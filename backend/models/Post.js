const mongoose = require("mongoose");

const likeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    handle: {
      type: String,
      required: true,
      trim: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 280,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: true }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    authorName: {
      type: String,
      required: true,
      trim: true,
    },
    authorHandle: {
      type: String,
      required: true,
      trim: true,
    },
    authorAvatarColor: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
    imageUrl: {
      type: String,
      default: "",
    },
    likes: {
      type: [likeSchema],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Post", postSchema);

