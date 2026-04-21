import mongoose, { Schema } from "mongoose";
import { ICodeSnippet, Language, ExecutionStatus } from "../types/index";

const codeSnippetSchema = new Schema<ICodeSnippet>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
      default: "Untitled",
    },
    language: {
      type: String,
      enum: Object.values(Language),
      required: [true, "Language is required"],
    },
    code: {
      type: String,
      required: [true, "Code is required"],
      maxlength: [50000, "Code cannot exceed 50000 characters"],
    },
    stdin: {
      type: String,
      default: "",
      maxlength: [10000, "Stdin cannot exceed 10000 characters"],
    },
    stdout: {
      type: String,
      default: "",
    },
    stderr: {
      type: String,
      default: "",
    },
    exitCode: {
      type: Number,
      default: null,
    },
    executionTime: {
      type: Number,
      default: null,
    },
    status: {
      type: String,
      enum: Object.values(ExecutionStatus),
      default: ExecutionStatus.PENDING,
    },
    shareId: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        const { __v, ...rest } = ret;
        return ret;
      },
    },
  },
);

codeSnippetSchema.index({ userId: 1, createdAt: -1 });

const CodeSnippet = mongoose.model<ICodeSnippet>(
  "CodeSnippet",
  codeSnippetSchema,
);

export default CodeSnippet;
