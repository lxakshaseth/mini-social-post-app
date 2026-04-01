import { Heart, MessageSquare, Send, Sparkles } from "lucide-react";
import { getImageUrl } from "../api";
import { colorFromText, engagementScore, formatDate, relativeTime } from "../utils";
import Avatar from "./Avatar";

function PostCard({
  busyPostId,
  commentDrafts,
  currentUser,
  expandedPostId,
  onCommentChange,
  onCommentSubmit,
  onLike,
  onToggleComments,
  post,
}) {
  const isLikedByCurrentUser = post.likes.some(
    (like) => String(like.userId) === String(currentUser?._id)
  );
  const isExpanded = expandedPostId === post._id;

  return (
    <article className="post-card card">
      <div className="post-header">
        <div className="post-author">
          <Avatar
            name={post.authorName}
            color={post.authorAvatarColor || colorFromText(post.authorName)}
          />
          <div>
            <div className="author-row">
              <strong>{post.authorName}</strong>
              <span>@{post.authorHandle}</span>
            </div>
            <p>{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <div className="post-meta">
          <span>{relativeTime(post.createdAt)}</span>
        </div>
      </div>

      {post.text ? <p className="post-copy">{post.text}</p> : null}

      {post.imageUrl ? (
        <div className="post-image-shell">
          <img src={getImageUrl(post.imageUrl)} alt="Post attachment" />
        </div>
      ) : null}

      {post.likes.length ? (
        <div className="identity-strip">
          <span>Liked by:</span>
          <div className="identity-list">
            {post.likes.slice(0, 4).map((like) => (
              <span key={`${post._id}-${like.userId}`} className="identity-pill">
                {like.username}
              </span>
            ))}
            {post.likes.length > 4 ? (
              <span className="identity-pill">+{post.likes.length - 4} more</span>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="post-actions">
        <button
          type="button"
          className={`action-link ${isLikedByCurrentUser ? "active" : ""}`}
          onClick={() => onLike(post._id)}
          disabled={busyPostId === post._id}
        >
          <Heart size={18} />
          <span>{post.likes.length}</span>
        </button>

        <button
          type="button"
          className={`action-link ${isExpanded ? "active" : ""}`}
          onClick={() => onToggleComments(isExpanded ? "" : post._id)}
        >
          <MessageSquare size={18} />
          <span>{post.comments.length}</span>
        </button>

        <div className="action-link static">
          <Sparkles size={18} />
          <span>{engagementScore(post)} score</span>
        </div>
      </div>

      <div className={`comment-zone ${isExpanded || post.comments.length ? "open" : ""}`}>
        <div className="comment-list">
          {post.comments.length ? (
            post.comments.map((comment) => (
              <div key={comment._id} className="comment-item">
                <Avatar
                  name={comment.username}
                  color={colorFromText(comment.handle || comment.username)}
                  size="xs"
                />
                <div>
                  <div className="comment-header">
                    <strong>{comment.username}</strong>
                    <span>@{comment.handle}</span>
                    <small>{relativeTime(comment.createdAt)}</small>
                  </div>
                  <p>{comment.text}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="comment-placeholder">No comments yet. Start the conversation.</div>
          )}
        </div>

        <div className="comment-composer">
          <input
            type="text"
            value={commentDrafts[post._id] || ""}
            onChange={(event) => onCommentChange(post._id, event.target.value)}
            placeholder="Write a comment"
          />
          <button
            type="button"
            onClick={() => onCommentSubmit(post._id)}
            disabled={busyPostId === post._id}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </article>
  );
}

export default PostCard;

