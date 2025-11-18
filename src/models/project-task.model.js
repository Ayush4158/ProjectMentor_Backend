import mongoose, { Schema, Document } from "mongoose";

const TaskSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    hint: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

const CommitSchema = new Schema({
  message: String,
  author: String,
  date: Date,
  url: String,
});

const AISuggestionSchema = new Schema({
  commitMessage: String,
  suggestion: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ProjectSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    objective: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    githubLink: {
      type: String,
    },
    techStack: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "in_progress", "completed"],
      default: "pending",
    },
    task: {
      type: [TaskSchema],
      default: [],
    },

    lastPush: Date,
    recentCommits: {
      type: [CommitSchema],
      default: [],
    },

    aiSuggestions: {
      type: [AISuggestionSchema],
      default: [],
    },
  },
  { timestamps: true }
);

export const Project = mongoose.model("Project", ProjectSchema);
