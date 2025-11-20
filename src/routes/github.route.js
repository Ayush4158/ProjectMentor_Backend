import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {githubCallback, githubWebhook} from "../controllers/github.controller.js"

const router = Router()

router.route("/auth").get(verifyJWT, (req, res) => {
  const userId = req.user._id
  const redirectUrl = `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&redirect_uri=${process.env.GITHUB_REDIRECT_URI}/api/github/callback&scope=repo,user&state=${userId}`.replace(/\s+/g, '');
  res.redirect(redirectUrl);
});
router.route("/callback").get(githubCallback);
router.route("/webhook").post(githubWebhook)

export default router