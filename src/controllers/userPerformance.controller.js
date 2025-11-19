import { ApiError } from "../helper/ApiError.js";
import { ApiResponse } from "../helper/ApiResponse.js";
import { Project } from "../models/project-task.model.js";

export const getUserPerformance = async (req, res) => {
  try {
    const userId = req.user._id;

    // Count total & completed projects
    const totalProject = await Project.countDocuments({ userId });
    const completedProject = await Project.countDocuments({
      userId,
      status: "completed",
    });

    const completionRate = totalProject
      ? (completedProject / totalProject) * 100
      : 0;

    // Weekly performance aggregation
    const weeklyData = await Project.aggregate([
      { $match: { userId: userId } },
      {
        $group: {
          _id: { $week: "$updatedAt" },
          completedCount: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Count total number of tasks inside all projects
    const projects = await Project.find({ userId });

    const totalTask = projects.reduce((sum, project) => {
      return sum + (project.task ? project.task.length : 0);
    }, 0);
    const project = await Project.find({userId, status: 'completed'}).select("_id name")

    return res.status(200).json(
      new ApiResponse(
        200,
        { totalProject, completedProject, completionRate, weeklyData, totalTask, project },
        "User performance fetched successfully"
      )
    );
  } catch (error) {
    console.error("Error fetching user performance:", error);

    if (error instanceof ApiError) {
      return res.status(error.statusCode || 400).json({
        success: false,
        message: error.message,
        errors: error.errors || [],
      });
    }

    return res.status(500).json(
      new ApiError(
        500,
        "Failed to fetch user performance",
        error?.message || "Internal Server Error"
      )
    );
  }
};
