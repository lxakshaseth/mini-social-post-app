const express = require("express");
const { isDatabaseReady } = require("../config/db");
const requireDatabase = require("../middleware/requireDatabase");
const Post = require("../models/Post");
const User = require("../models/User");
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
    } else if (req.query.sort === "most-commented") {
      sort = { "comments.length": -1, createdAt: -1 };
    } else if (req.query.sort === "most-viewed") {
      sort = { viewsCount: -1, createdAt: -1 };
    }

    if (req.query.filter === "polls" || req.query.sort === "polls-only") {
      filter["poll.options.0"] = { $exists: true };
    } else if (req.query.filter === "media" || req.query.sort === "media-only") {
      filter.imageUrl = { $ne: "" };
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

router.get("/saved", requireDatabase, auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedPosts");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.json(user.savedPosts || []);
  } catch (error) {
    return res.status(500).json({ message: "Unable to load saved posts." });
  }
});

router.post("/:postId/bookmark", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);
    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (!Array.isArray(user.savedPosts)) {
      user.savedPosts = [];
    }

    const existingIndex = user.savedPosts.findIndex(
      (savedId) => savedId.toString() === req.params.postId
    );

    let isBookmarked = false;
    if (existingIndex >= 0) {
      user.savedPosts.splice(existingIndex, 1);
      isBookmarked = false;
    } else {
      user.savedPosts.unshift(post._id);
      isBookmarked = true;
    }

    await user.save();

    return res.json({
      isBookmarked,
      savedPosts: user.savedPosts,
      message: isBookmarked ? "Post saved to bookmarks." : "Post removed from bookmarks.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Unable to update bookmark." });
  }
});

router.post("/", requireDatabase, auth, upload.single("image"), async (req, res) => {
  try {
    const text = (req.body.text || "").trim();

    let pollData = null;
    if (req.body.poll) {
      try {
        const parsedPoll = typeof req.body.poll === "string" ? JSON.parse(req.body.poll) : req.body.poll;
        if (parsedPoll && Array.isArray(parsedPoll.options) && parsedPoll.options.length >= 2) {
          const validOptions = parsedPoll.options
            .map((opt) => (typeof opt === "string" ? opt.trim() : (opt.optionText || "").trim()))
            .filter(Boolean);

          if (validOptions.length >= 2) {
            pollData = {
              question: (parsedPoll.question || "").trim(),
              options: validOptions.map((optionText) => ({ optionText, votes: [] })),
              expiresAt: parsedPoll.expiresAt || null,
            };
          }
        }
      } catch (err) {
        // Skip invalid poll payload
      }
    }

    if (!text && !req.file && !pollData) {
      return res.status(400).json({ message: "Add some text, an image, or a poll before posting." });
    }

    const post = await Post.create({
      author: req.user._id,
      authorName: req.user.name,
      authorHandle: req.user.handle,
      authorAvatarColor: req.user.avatarColor,
      text,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : "",
      poll: pollData,
    });

    return res.status(201).json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to create post right now." });
  }
});

router.post("/:postId/vote", requireDatabase, auth, async (req, res) => {
  try {
    const { optionIndex } = req.body;
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (!post.poll || !Array.isArray(post.poll.options) || post.poll.options.length === 0) {
      return res.status(400).json({ message: "This post does not have an active poll." });
    }

    const targetIndex = Number(optionIndex);
    if (isNaN(targetIndex) || targetIndex < 0 || targetIndex >= post.poll.options.length) {
      return res.status(400).json({ message: "Invalid option selected." });
    }

    const userIdStr = req.user._id.toString();

    let previousOptionIndex = -1;
    post.poll.options.forEach((opt, idx) => {
      if (opt.votes.some((id) => id.toString() === userIdStr)) {
        previousOptionIndex = idx;
      }
    });

    if (previousOptionIndex === targetIndex) {
      post.poll.options[targetIndex].votes = post.poll.options[targetIndex].votes.filter(
        (id) => id.toString() !== userIdStr
      );
    } else {
      if (previousOptionIndex !== -1) {
        post.poll.options[previousOptionIndex].votes = post.poll.options[previousOptionIndex].votes.filter(
          (id) => id.toString() !== userIdStr
        );
      }
      post.poll.options[targetIndex].votes.push(req.user._id);
    }

    await post.save();
    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to record vote." });
  }
});

router.post("/:postId/pin", requireDatabase, auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Only the author can pin or unpin this post." });
    }

    post.isPinned = !post.isPinned;
    await post.save();

    return res.json(post);
  } catch (error) {
    return res.status(500).json({ message: "Unable to update post pin status." });
  }
});

router.post("/:postId/view", requireDatabase, async (req, res) => {
  try {
    const post = await Post.findByIdAndUpdate(
      req.params.postId,
      { $inc: { viewsCount: 1 } },
      { new: true }
    ).select("viewsCount");

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    return res.json({ viewsCount: post.viewsCount });
  } catch (error) {
    return res.status(500).json({ message: "Unable to record view." });
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
