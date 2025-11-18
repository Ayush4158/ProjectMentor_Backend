import axios from "axios";
import { User } from "../models/user.model.js";
import { Project } from "../models/project-task.model.js";
import { generateAISuggestion } from "../helper/generateAiSuggestion.js";

export const githubCallback = async (req, res) => {
  const code = req.query.code;
  const userId = req.query.state;
  // console.log("userId", userId)
  try {

    const user = await User.findById(userId)
    console.log("prev", user)
    if(!user.githubAccessToken){
      const tokenResponse = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        },
        {
          headers: { Accept: "application/json" },
        }
      );

      const accessToken = tokenResponse.data.access_token;
      console.log('accessToken', accessToken)

      const userResponse = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const githubUsername = userResponse.data.login;


      
      user.githubUsername =  githubUsername,
      user.githubAccessToken = accessToken,
      await user.save()
      // console.log("accesstoken: ", accessToken)
      // console.log("user ", user)
    }
    

    res.redirect("http://localhost:5173");
  } catch (error) {
    console.error("GitHub OAuth failed:", error);
    res.status(500).json({ message: "GitHub connection failed" });
  }
};

// export const githubWebhook = async(req,res) => {
//   try {
//     const payload = req.body

//     res.status(200).json({ success: true });

//     const repoUrl = payload.repository?.html_url;
//     const commit = payload.head_commit;
//     if(!commit){
//       return res.status(400).json({
//         success: false,
//         message: "No commmit found"
//       })
//     }
//     const commitMessage = commit.message;
//     const commitUrl = commit.url;
//     const author = commit.author?.name;
//     const commitDate = commit.timestamp;

//     const project = await Project.findOne({githubLink: repoUrl})
//     if(!project){
//       return res.status(404).json({success: false, message: "Project not found"})
//     }

//     const commitSha = commit.id
//     const githubApiUrl = `https://api.github.com/repos/${payload.repository.full_name}/commits/${commitSha}`;

//     const githubResponse = await axios.get(githubApiUrl, {
//       headerse: {
//         Accept: "application/vnd.github.v3+json"
//       }
//     })

//     const files = githubResponse.data.files || [];
//     let codeChanges = "";
//     files.forEach((file) => {
//       codeChanges += `\nFile: ${file.filename}\nChanges:\n${file.patch || "Binary or large file"}\n`;
//     });

//     // console.log("messages: ", commitMessage,codeChanges)
//     const suggestion = await generateAISuggestion(commitMessage, codeChanges )
//     console.log("suggestion: ", suggestion)

//     project.recentCommits.push({
//       message: commitMessage,
//       author,
//       data: commitDate,
//       url: commitUrl
//     })

//     project.aiSuggestions.push({
//       commitMessage,
//       suggestion
//     })

//     project.lastPush = new Date(commitDate)
//     await project.save();

//      res.status(200).json({ success: true, project, message: "Push processed successfully" });

//   } catch (error) {
//     console.error("❌ Error processing webhook:", error.message);
//     res.status(500).json({ success: false, error: error.message });
//   }
// }


export const githubWebhook = async (req, res) => {
  const payload = req.body;
  res.status(200).json({ success: true });

  setImmediate(async () => {
    try {
      const repoUrl = payload.repository?.html_url;
      const commit = payload.head_commit;

      if (!commit) {
        console.log("❌ No commit found");
        return;
      }

      const commitMessage = commit.message;
      const commitUrl = commit.url;
      const author = commit.author?.name;
      const commitDate = commit.timestamp;

      const project = await Project.findOne({ githubLink: repoUrl });
      if (!project) {
        console.log("❌ Project not found for repo:", repoUrl);
        return;
      }

      const commitSha = commit.id;
      const githubApiUrl = `https://api.github.com/repos/${payload.repository.full_name}/commits/${commitSha}`;

      const githubResponse = await axios.get(githubApiUrl, {
        headers: { Accept: "application/vnd.github.v3+json" }
      });

      const files = githubResponse.data.files || [];
      let codeChanges = "";
      files.forEach(file => {
        codeChanges += `\nFile: ${file.filename}\nChanges:\n${file.patch || "Binary or large file"}\n`;
      });

      const suggestion = await generateAISuggestion(commitMessage, codeChanges);
      console.log("suggestion: ", suggestion)
      project.recentCommits.push({
        message: commitMessage,
        author,
        date: commitDate,
        url: commitUrl
      });

      project.aiSuggestions.push({
        commitMessage,
        suggestion
      });

      project.lastPush = new Date(commitDate);

      await project.save();
      console.log("🚀 Webhook processed successfully for project:", project);

    } catch (error) {
      console.error("❌ Async webhook processing error:", error);
    }
  });
};
