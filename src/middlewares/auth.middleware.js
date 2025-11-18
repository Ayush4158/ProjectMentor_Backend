import jwt from 'jsonwebtoken'
import { ApiError } from '../helper/ApiError.js'
import {User} from '../models/user.model.js'

export const verifyJWT = async (req, res, next) => {
  try {

    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
    if(!token){
      throw new ApiError(401, "Token is missing")
    }

    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    const user = await User.findById(decoded?._id).select("-password -refreshToken")

    if(!user){
      throw new ApiError(401, "Invalid Access Token")
    }

    req.user = user
    next()
    
  } catch (error) {

    if (error instanceof ApiError) {
      return res.status(error.statusCoude).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
      });
    }

    return res.status(401).json(
      new ApiError(401, "Unauthorized error")
    )
  }
}