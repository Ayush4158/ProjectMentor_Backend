import { User } from "../models/user.model.js";
import { ApiError } from "../helper/ApiError.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import jwt from "jsonwebtoken";

// ------------------- Generate Tokens -------------------
const generateAccessRefreshTokens = async (id) => {
  try {
    const newUser = await User.findById(id);

    const accessToken = await newUser.generateAccessToken();
    const refreshToken = await newUser.generateRefreshToken();

    newUser.refreshToken = refreshToken;
    await newUser.save({ validateBeforeSave: false });

    return { accessToken, refreshToken, newUser };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating refresh and access token"
    );
  }
};

// Common Cookie Options for deployment (Vercel + Render)
const cookieOptions = {
  httpOnly: true,
  secure: true, // required for HTTPS
  sameSite: "none", // required for cross-site cookies
};

// ------------------- Register -------------------
export const registerUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if ([username, email, password].some((f) => f?.trim() === "")) {
      throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new ApiError(409, "User with this email already exists");
    }

    const user = await User.create({ username, email, password });

    const sanitizedUser = user.toObject();
    delete sanitizedUser.password;

    return res
      .status(201)
      .json(new ApiResponse(201, sanitizedUser, "User Registered Successfully"));
  } catch (error) {
    console.error("Error during registration:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((v) => v.message);
      return res.status(400).json(new ApiError(400, messages.join(", ")));
    }
  }
};

// ------------------- Login -------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      throw new ApiError(400, "All fields are required");

    const user = await User.findOne({ email });
    if (!user) throw new ApiError(404, "User with the email not found");

    const isPasswordValid = await user.isPasswordCorrect(password);
    if (!isPasswordValid) throw new ApiError(401, "Invalid Credentials");

    const { accessToken, refreshToken, newUser } =
      await generateAccessRefreshTokens(user._id);

    const loggedInUser = newUser.toObject();
    delete loggedInUser.password;
    delete loggedInUser.refreshToken;

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", refreshToken, cookieOptions)
      .json(new ApiResponse(200, loggedInUser, "User Logged in Successfully"));
  } catch (error) {
    console.error("Login error:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(500).json(new ApiError(500, "Internal server error"));
  }
};

// ------------------- Logout -------------------
export const logoutUser = async (req, res) => {
  await User.findByIdAndUpdate(
    req.userId,
    { $set: { refreshToken: undefined } },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", cookieOptions)
    .clearCookie("refreshToken", cookieOptions)
    .json(new ApiResponse(200, "User logged out successfully"));
};

// ------------------- Get User -------------------
export const getUser = async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Fetched User Successfully"));
};

// ------------------- Refresh Token -------------------
export const refreshAccessToken = async (req, res) => {
  const incomingToken =
    req.cookies?.refreshToken || req.body.refreshToken;

  if (!incomingToken) {
    throw new ApiError(401, "Unauthorized request");
  }

  try {
    const decoded = jwt.verify(
      incomingToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);
    if (!user) throw new ApiError(401, "Invalid refresh token");

    if (user.refreshToken !== incomingToken) {
      throw new ApiError(401, "Refresh token expired or invalid");
    }

    const { accessToken, refreshToken: newRefreshToken } =
      await generateAccessRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, cookieOptions)
      .cookie("refreshToken", newRefreshToken, cookieOptions)
      .json(new ApiResponse(200, "Access Token refreshed"));
  } catch (error) {
    console.error("Refresh token error:", error);
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
};
