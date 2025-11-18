import {User} from '../models/user.model.js'
import {ApiError} from '../helper/ApiError.js'
import {ApiResponse} from '../helper/ApiResponse.js'

const generateAccessRefreshTokens = async(id) => {
  try {
    const newUser = await User.findById(id)

    const accessToken = await newUser.generateAccessToken()
    const refreshToken = await newUser.generateRefreshToken()
    newUser.refreshToken = refreshToken

    await newUser.save({validateBeforeSave: false})

    return {accessToken, refreshToken, newUser}
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating refresh and access token")
  }
}

export const registerUser = async(req,res) => {
  try {
    const {username, email, password} = req.body

    if([username, email, password].some((field) => field?.trim() === "")){
      throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({email})
    if(existingUser){
      throw new ApiError(409, "User with this email already exists")
    }

    const user = await User.create({
      username,
      email,
      password
    })

    const sanitizedUser = user.toObject()
    delete sanitizedUser.password

    return res.status(201).json(
      new ApiResponse(201, sanitizedUser, "User Registered Successfully")
    )
  } catch (error) {
    console.error("Error during registration:", error);

    if (error instanceof ApiError) {
    return res.status(error.statusCoude).json({
      success: false,
      message: error.message,
      errors: error.errors || [],
    });
  }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((val) => val.message);
      return res.status(400).json(new ApiError(400, messages.join(", ")));
    }
  }
}

export const loginUser = async(req,res) => {
  try {
    const {email, password} = req.body
  
    if(!email || !password){
      throw new ApiError(400, "All fields are required")
    }
  
    const user = await User.findOne({email})
    if(!user){
      throw new ApiError(404, "User with the email not found")
    }
  
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
      throw new ApiError(401, "Invalid Credentials")
    }
  
    const {accessToken, refreshToken, newUser} = await generateAccessRefreshTokens(user._id)
  
    const loggedInUser = newUser.toObject()
    delete loggedInUser.password
    delete loggedInUser.refreshToken
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(200, loggedInUser,"User Logged in Successfully")
    )
  } catch (error) {
    console.error("Login error:", error);
    if (error instanceof ApiError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
      });
    }
    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
}

export const logoutUser = async(req,res) => {
  await User.findByIdAndUpdate(req.userId,
    {
      $set: {refreshToken: undefined}
    },
    {
      new: true
    }
  )

  const options = {
    httpOnly: true,
    secure: true
  }

  return res.status(200)
  .clearCookie("accessToken", options)
  .clearCookie("refreshToken", options)
  .json(new ApiResponse(200, "User loggedout successfully"))
}

export const getUser = async(req,res) => {
  return res.status(200).json(
    new ApiResponse(200, req.user, "Fetched User Successfully")
  )
}

export const refreshAccessToken = async(req,res) => {
  const incommingToken = req.cookie.refreshToken || req.body.refreshToken

  if(!incommingToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decoded = await jwt.verify(incommingToken, process.env.REFRESH_TOKEN_SECRET)
    const user = await User.findById(decoded._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }

    if(user.refreshToken !== incommingToken){
      throw new ApiError(401, "Refresh token is expired or used")
    }

    const options = {
      httpOnly: true,
      secure: true
    }

    const {accessToken, newRefreshToken} = await generateAccessRefreshTokens(user._id)

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", newRefreshToken, options)
    .json(new ApiResponse(200, "Access Token is generaaed"))
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid refresh token")
  }
}