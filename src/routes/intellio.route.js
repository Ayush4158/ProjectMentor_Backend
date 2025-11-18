import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { aiAssistance } from "../controllers/intellio.controller.js";

const router = Router()

router.route('/intellio').post(verifyJWT, aiAssistance)

export default router