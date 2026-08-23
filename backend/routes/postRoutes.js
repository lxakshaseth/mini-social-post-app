const express = require("express");
const { isDatabaseReady } = require("../config/db");
const requireDatabase = require("../middleware/requireDatabase");
const Post = require("../models/Post");
const auth = require("../middleware/auth");
const upload = require("../utils/upload");

const router = express.Router();

router.get("/", async (req, res) => {
  if (!isDatabaseReady()) {
    if (req.query.paginated === "true" || req.query.page) {
      return res.json({
        posts: [],
        pagination: { page: 1, limit: 10, totalPosts: 0, totalPages: 0, hasMore: false },
      });
    }
    return res.json([]);
  }

  try {
    const isPaginated = req.query.paginated === "true" || Boolean(req.query.page);
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.author) {
      filter.author = req.query.author;
    }
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search.trim(), "i");
      filter.$or = [
        { text: searchRegex },
        { authorName: searchRegex },
        { authorHandle: searchRegex },
      ];
    }

    let sort = { createdAt: -1 };
    if (req.query.sort === "most-liked") {
      sort = { "likes.length": -1, createdAt: -1 };
    }

    if (isPaginated) {
      const [totalPosts, posts] = await Promise.all([
        Post.countDocuments(filter),
        Post.find(filter)
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean({ virtuals: true }),
      ]);

      const totalPages = Math.ceil(totalPosts / limit);
      return res.json({
        posts,
        pagination: {
          page,
          limit,
          totalPosts,
          totalPages,
          hasMore: page < totalPages,
        },
      });
    }

    const posts = await Post.find(filter).sort(sort).lean();
    return res.json(posts);
  } catch (error) {
    return res.status(500).json({ message: "Unable to load posts." });
  }
});

router.post("/", requireDatabase, auth, upload.single("image"), async (req, res) => {
  try {
    const text = (req.body.text || "").trim();

    if (!text && !req.file) {
      return res.status(400).json({ message: "Add some text or an image before posting." });
    }

    const post = await Post.create({
      author: req.user._id,
      authorName: req.user.name,
      authorHandle: req.user.handle,
      authorAvatarColor: req.user.avatarColor,
      text,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
    });

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create post right now." });
  }
});

router.post("/:postId/like", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const existingLikeIndex = post.likes.findIndex(
      (like) => like.userId.toString() === req.user._id.toString()
    );

    if (existingLikeIndex >= 0) {
      post.likes.splice(existingLikeIndex, 1);
    } else {
      post.likes.unshift({
        userId: req.user._id,
        username: req.user.name,
        handle: req.user.handle,
      });
    }

    await post.save();
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update your reaction." });
  }
});

router.post("/:postId/comments", requireDatabase, auth, async (req, res) => {
  try {
    const text = (req.body.text || "").trim();

    if (!text) {
      return res.status(400).json({ message: "Comment text is required." });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.unshift({
      userId: req.user._id,
      username: req.user.name,
      handle: req.user.handle,
      text,
    });

    await post.save();
    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to add your comment." });
  }
});

router.delete("/:postId/comments/:commentId", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    // Only comment author or post author can delete
    const isCommentAuthor = comment.userId.toString() === req.user._id.toString();
    const isPostAuthor = post.author.toString() === req.user._id.toString();

    if (!isCommentAuthor && !isPostAuthor) {
      return res.status(403).json({ message: "You are not authorized to delete this comment." });
    }

    post.comments.pull(req.params.commentId);
    await post.save();

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete comment." });
  }
});

router.post("/:postId/comments/:commentId/like", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const comment = post.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ message: "Comment not found." });
    }

    if (!Array.isArray(comment.likes)) {
      comment.likes = [];
    }

    const existingLikeIndex = comment.likes.findIndex(
      (like) => like.userId.toString() === req.user._id.toString()
    );

    if (existingLikeIndex >= 0) {
      comment.likes.splice(existingLikeIndex, 1);
    } else {
      comment.likes.unshift({
        userId: req.user._id,
        username: req.user.name,
        handle: req.user.handle,
      });
    }

    await post.save();
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to like comment." });
  }
});

router.put("/:postId", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to edit this post." });
    }

    const text = (req.body.text || "").trim();
    if (!text && !post.imageUrl) {
      return res.status(400).json({ message: "Post must have either text or an image." });
    }

    post.text = text;
    await post.save();

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update post." });
  }
});

router.delete("/:postId", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "You are not authorized to delete this post." });
    }

    await Post.findByIdAndDelete(req.params.postId);

    return res.json({ message: "Post deleted successfully.", postId: req.params.postId });
  } catch (error) {
    return res.status(500).json({ message: "Unable to delete post." });
  }
});

module.exports = router;
