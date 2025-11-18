import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getUserPerformance } from "../controllers/userPerformance.controller.js";

const router = Router()

router.route('/analysis').get(verifyJWT, getUserPerformance)


export default router