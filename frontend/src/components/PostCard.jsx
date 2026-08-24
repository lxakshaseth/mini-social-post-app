import { useState } from "react";
import { BarChart2, Bookmark, Check, CheckCircle2, Copy, Edit3, Heart, MessageSquare, MoreHorizontal, Pin, Send, Share2, Sparkles, Trash2, Vote, X } from "lucide-react";
import { getImageUrl } from "../api";
import { colorFromText, engagementScore, formatDate, highlightText, relativeTime } from "../utils";
import Avatar from "./Avatar";

function PostCard({
  busyPostId,
  commentDrafts,
  currentUser,
  expandedPostId,
  onBookmark,
  onCommentChange,
  onCommentSubmit,
  onDeleteComment,
  onDeletePost,
  onEditPost,
  onImageClick,
  onLike,
  onLikeComment,
  onNotify,
  onPinPost,
  onToggleComments,
  onVotePoll,
  post,
  searchTerm,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(post.text || "");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isTextExpanded, setIsTextExpanded] = useState(false);

  const isAuthor =
    currentUser &&
    (String(post.author) === String(currentUser._id) ||
      post.authorHandle === currentUser.handle);

  const isLikedByCurrentUser = post.likes.some(
    (like) => String(like.userId) === String(currentUser?._id)
  );
  const isExpanded = expandedPostId === post._id;

  function handleSaveEdit() {
    if (!editText.trim() && !post.imageUrl) {
      return;
    }
    if (onEditPost) {
      onEditPost(post._id, editText.trim());
    }
    setIsEditing(false);
  }

  async function handleShare() {
    const shareUrl = `${window.location.origin}/#post-${post._id}`;
    const shareText = post.text
      ? `${post.text.slice(0, 100)}... by @${post.authorHandle}`
      : `Check out this post by @${post.authorHandle}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: shareText,
          url: shareUrl,
        });
        onNotify?.("success", "Post shared successfully!");
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      onNotify?.("success", "Link copied to clipboard!");
    } catch {
      onNotify?.("info", `Post URL: ${shareUrl}`);
    }
  }

  return (
    <article className="post-card card" id={`post-${post._id}`}>
      {post.isPinned && (
        <div
          className="post-pinned-badge"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--primary, #1b84ff)",
            marginBottom: "8px",
          }}
        >
          <Pin size={13} style={{ transform: "rotate(45deg)" }} />
          <span>Pinned Post</span>
        </div>
      )}
      <div className="post-header">
        <div className="post-author">
          <Avatar
            name={post.authorName}
            color={post.authorAvatarColor || colorFromText(post.authorName)}
          />
          <div>
            <div className="author-row">
              <strong>{highlightText(post.authorName, searchTerm)}</strong>
              <span>@{highlightText(post.authorHandle, searchTerm)}</span>
            </div>
            <p>{formatDate(post.createdAt)}</p>
          </div>
        </div>

        <div className="post-meta" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{relativeTime(post.createdAt)}</span>
          {isAuthor && (
            <div style={{ position: "relative" }}>
              <button
                type="button"
                className="icon-btn"
                title="Post options"
                onClick={() => setMenuOpen((o) => !o)}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "6px",
                  display: "flex",
                  color: "inherit",
                }}
              >
                <MoreHorizontal size={18} />
              </button>

              {menuOpen && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "100%",
                    zIndex: 20,
                    background: "var(--card-bg, #fff)",
                    border: "1px solid var(--border-color, #e2e8f0)",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    padding: "4px",
                    minWidth: "130px",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      onPinPost && onPinPost(post._id);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                      color: "inherit",
                      borderRadius: "4px",
                    }}
                  >
                    <Pin size={14} />
                    <span>{post.isPinned ? "Unpin Post" : "Pin to Top"}</span>
                  </button>
                  {post.text && (
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(post.text);
                        onNotify?.("success", "Post text copied to clipboard!");
                        setMenuOpen(false);
                      }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        width: "100%",
                        padding: "8px 12px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        fontSize: "13px",
                        textAlign: "left",
                        color: "inherit",
                        borderRadius: "4px",
                      }}
                    >
                      <Copy size={14} />
                      <span>Copy text</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      textAlign: "left",
                      color: "inherit",
                      borderRadius: "4px",
                    }}
                  >
                    <Edit3 size={14} />
                    <span>Edit Post</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteConfirm(true);
                      setMenuOpen(false);
                    }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      width: "100%",
                      padding: "8px 12px",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      fontSize: "13px",
                      color: "#ef4444",
                      textAlign: "left",
                      borderRadius: "4px",
                    }}
                  >
                    <Trash2 size={14} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && (
        <div
          style={{
            background: "rgba(239, 68, 68, 0.08)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "8px",
            padding: "12px",
            margin: "8px 0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span style={{ fontSize: "13px", fontWeight: 500 }}>
            Delete this post permanently?
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              type="button"
              onClick={() => onDeletePost && onDeletePost(post._id)}
              disabled={busyPostId === post._id}
              style={{
                background: "#ef4444",
                color: "#fff",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              {busyPostId === post._id ? "Deleting..." : "Yes, Delete"}
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(false)}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color, #ccc)",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing ? (
        <div style={{ margin: "10px 0" }}>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            style={{
              width: "100%",
              padding: "10px",
              borderRadius: "8px",
              border: "1px solid var(--border-color, #ccc)",
              background: "var(--input-bg, transparent)",
              color: "inherit",
              fontFamily: "inherit",
              fontSize: "14px",
              resize: "vertical",
            }}
          />
          <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "6px" }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{
                padding: "6px 12px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #ccc)",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
              }}
            >
              <X size={14} />
              <span>Cancel</span>
            </button>
            <button
              type="button"
              onClick={handleSaveEdit}
              disabled={busyPostId === post._id}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                border: "none",
                background: "var(--primary, #3b82f6)",
                color: "#fff",
                cursor: "pointer",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "13px",
              }}
            >
              <Check size={14} />
              <span>Save</span>
            </button>
          </div>
        </div>
      ) : (
        post.text ? (
          <div className="post-copy-wrapper" style={{ margin: "10px 0" }}>
            <p className="post-copy" style={{ margin: 0, whiteSpace: "pre-wrap" }}>
              {post.text.length > 280 && !isTextExpanded
                ? highlightText(`${post.text.slice(0, 280)}...`, searchTerm)
                : highlightText(post.text, searchTerm)}
            </p>
            {post.text.length > 280 && (
              <button
                type="button"
                onClick={() => setIsTextExpanded((e) => !e)}
                style={{
                  background: "transparent",
                  border: "none",
                  padding: "4px 0",
                  color: "var(--primary, #3b82f6)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {isTextExpanded ? "Show less" : "Read more"}
              </button>
            )}
          </div>
        ) : null
      )}

      {post.imageUrl ? (
        <div
          className="post-image-shell"
          onClick={() => onImageClick && onImageClick(getImageUrl(post.imageUrl))}
          style={{ cursor: "zoom-in" }}
          title="Click to view full image"
        >
          <img src={getImageUrl(post.imageUrl)} alt="Post attachment" />
        </div>
      ) : null}

      {post.poll && Array.isArray(post.poll.options) && post.poll.options.length > 0 && (
        <div
          className="post-poll-box"
          style={{
            margin: "12px 0",
            padding: "14px",
            borderRadius: "10px",
            background: "var(--poll-bg, rgba(27, 132, 255, 0.04))",
            border: "1px solid var(--border-color, #e2e8f0)",
          }}
        >
          {post.poll.question && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px", fontWeight: 600 }}>
              <Vote size={16} color="var(--primary, #1b84ff)" />
              <span>{post.poll.question}</span>
            </div>
          )}

          {(() => {
            const totalVotes = post.poll.options.reduce(
              (acc, opt) => acc + (Array.isArray(opt.votes) ? opt.votes.length : 0),
              0
            );
            const userHasVoted = post.poll.options.some((opt) =>
              opt.votes?.some((id) => String(id) === String(currentUser?._id))
            );

            return (
              <div style={{ display: "grid", gap: "8px" }}>
                {post.poll.options.map((opt, idx) => {
                  const voteCount = Array.isArray(opt.votes) ? opt.votes.length : 0;
                  const percent = totalVotes > 0 ? Math.round((voteCount / totalVotes) * 100) : 0;
                  const isUserPick = opt.votes?.some(
                    (id) => String(id) === String(currentUser?._id)
                  );

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={busyPostId === post._id}
                      onClick={() => onVotePoll && onVotePoll(post._id, idx)}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        border: isUserPick
                          ? "1.5px solid var(--primary, #1b84ff)"
                          : "1px solid var(--border-color, #cbd5e1)",
                        background: "var(--card-bg, #fff)",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: isUserPick ? 600 : 500,
                        textAlign: "left",
                        color: "inherit",
                        transition: "border-color 0.2s ease, transform 0.1s ease",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          left: 0,
                          top: 0,
                          bottom: 0,
                          width: `${percent}%`,
                          background: isUserPick
                            ? "rgba(27, 132, 255, 0.2)"
                            : "rgba(203, 213, 225, 0.25)",
                          zIndex: 1,
                          transition: "width 0.3s ease",
                        }}
                      />
                      <span
                        style={{
                          position: "relative",
                          zIndex: 2,
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {isUserPick && <CheckCircle2 size={15} color="var(--primary, #1b84ff)" />}
                        {opt.optionText}
                      </span>
                      <span
                        style={{
                          position: "relative",
                          zIndex: 2,
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--muted, #64748b)",
                        }}
                      >
                        {percent}% ({voteCount})
                      </span>
                    </button>
                  );
                })}

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: "11px",
                    color: "var(--muted, #64748b)",
                    marginTop: "4px",
                    padding: "0 2px",
                  }}
                >
                  <span>
                    {totalVotes} total vote{totalVotes === 1 ? "" : "s"}
                    {userHasVoted ? " · Click your choice to change or remove" : " · Click option to vote"}
                  </span>
                  <span>Interactive Poll</span>
                </div>
              </div>
            );
          })()}
        </div>
      )}

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

        <button
          type="button"
          className={`action-link ${
            currentUser?.savedPosts?.some(
              (id) => String(id) === String(post._id) || String(id?._id) === String(post._id)
            )
              ? "active"
              : ""
          }`}
          onClick={() => onBookmark && onBookmark(post._id)}
          title="Save to bookmarks"
        >
          <Bookmark size={18} />
          <span>
            {currentUser?.savedPosts?.some(
              (id) => String(id) === String(post._id) || String(id?._id) === String(post._id)
            )
              ? "Saved"
              : "Save"}
          </span>
        </button>

        <button
          type="button"
          className="action-link"
          onClick={handleShare}
          title="Share post"
        >
          <Share2 size={18} />
          <span>Share</span>
        </button>

        <div className="action-link static">
          <Sparkles size={18} />
          <span>{engagementScore(post)} score</span>
        </div>
      </div>

      <div className={`comment-zone ${isExpanded || post.comments.length ? "open" : ""}`}>
        <div className="comment-list">
          {post.comments.length ? (
            post.comments.map((comment) => {
              const commentLikes = Array.isArray(comment.likes) ? comment.likes : [];
              const isCommentLiked = commentLikes.some(
                (l) => String(l.userId) === String(currentUser?._id)
              );
              const canDeleteComment =
                currentUser &&
                (String(comment.userId) === String(currentUser._id) || isAuthor);

              return (
                <div key={comment._id} className="comment-item" style={{ position: "relative" }}>
                  <Avatar
                    name={comment.username}
                    color={colorFromText(comment.handle || comment.username)}
                    size="xs"
                  />
                  <div style={{ flex: 1 }}>
                    <div className="comment-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <strong>{comment.username}</strong>
                        <span>@{comment.handle}</span>
                        <small>{relativeTime(comment.createdAt)}</small>
                      </div>
                      {canDeleteComment && (
                        <button
                          type="button"
                          title="Delete comment"
                          onClick={() => onDeleteComment && onDeleteComment(post._id, comment._id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            padding: "2px 4px",
                            color: "#ef4444",
                            opacity: 0.7,
                            display: "flex",
                          }}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                    <p style={{ margin: "4px 0" }}>{comment.text}</p>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                      <button
                        type="button"
                        onClick={() => onLikeComment && onLikeComment(post._id, comment._id)}
                        style={{
                          background: isCommentLiked ? "rgba(239, 68, 68, 0.1)" : "transparent",
                          border: "none",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          color: isCommentLiked ? "#ef4444" : "var(--muted, #64748b)",
                          padding: "2px 6px",
                          borderRadius: "4px",
                        }}
                      >
                        <Heart size={12} fill={isCommentLiked ? "#ef4444" : "none"} />
                        <span>{commentLikes.length > 0 ? commentLikes.length : "Like"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
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

