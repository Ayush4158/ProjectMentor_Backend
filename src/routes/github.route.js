import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {githubCallback, githubWebhook} from "../controllers/github.controller.js"

const router = Router()

router.get("/auth", verifyJWT, (req, res) => {
  const userId = req.user._id
  console.log(userId)
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}/api/github/callback&scope=repo,user&state=${userId}`.replace(/\s+/g, '');
  // const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=https://irretrievable-kody-tardily.ngrok-free.dev/api/github/callback&scope=repo,user&state=${userId}`;
  res.redirect(redirectUrl);
});
router.get("/callback",  githubCallback);
router.route("/webhook").post(githubWebhook)

export default router