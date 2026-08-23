const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    handle: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
    avatarColor: {
      type: String,
      required: true,
    },
    bio: {
      type: String,
      maxlength: 160,
      default: "",
    },
    location: {
      type: String,
      maxlength: 60,
      default: "",
    },
    website: {
      type: String,
      maxlength: 100,
      default: "",
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
  },
  {
    timestamps: true,
  }
);

userSchema.index({ createdAt: -1 });

module.exports = mongoose.model("User", userSchema);

