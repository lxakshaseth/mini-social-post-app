import { useState } from "react";
import { ImagePlus, Send, Sparkles, UploadCloud } from "lucide-react";
import { feedFilters } from "../utils";
import Avatar from "./Avatar";
import FeedInsights from "./FeedInsights";
import PostCard from "./PostCard";

function FeedColumn({
  busyPostId,
  commentDrafts,
  composerFilter,
  currentUser,
  draftSaved,
  expandedPostId,
  feedFilter,
  loadingPosts,
  maxPostLength,
  onBookmark,
  onCommentChange,
  onCommentSubmit,
  onComposerFilterChange,
  onClearComposer,
  onCreatePost,
  onDeleteComment,
  onDeletePost,
  onEditPost,
  onFeedFilterChange,
  onImageChange,
  onImageClick,
  onLike,
  onLikeComment,
  onNotify,
  onPostTextChange,
  onRemoveImage,
  onToggleComments,
  postForm,
  postLoading,
  searchTerm,
  trendingTopics,
  visiblePosts,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const postCharacterCount = postForm.text.length;
  const isPostDisabled = postLoading || (!postForm.text.trim() && !postForm.image);

  function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      onImageChange({ target: { files: [file] } });
    }
  }

  return (
    <section className="feed-column">
      <section
        className={`composer card ${isDragging ? "drag-active" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: isDragging ? "2px dashed var(--primary, #3b82f6)" : undefined,
          transition: "border 0.2s ease, background 0.2s ease",
          background: isDragging ? "rgba(59, 130, 246, 0.05)" : undefined,
        }}
      >
        <div className="section-header">
          <div>
            <h2>Create Post</h2>
            <p>Text, image, or both. One is enough to publish.</p>
          </div>

          <div className="segmented-control">
            <button
              type="button"
              className={composerFilter === "all" ? "active" : ""}
              onClick={() => onComposerFilterChange("all")}
            >
              All Posts
            </button>
            <button
              type="button"
              className={composerFilter === "promotions" ? "active" : ""}
              onClick={() => onComposerFilterChange("promotions")}
            >
              Promotions
            </button>
          </div>
        </div>

        <div className="composer-intro">
          <Avatar
            name={currentUser?.name || "Guest User"}
            color={currentUser?.avatarColor}
            size="sm"
          />
          <div>
            <strong>{currentUser ? currentUser.name : "Join the conversation"}</strong>
            <p>
              {currentUser
                ? `Posting as @${currentUser.handle}`
                : "Create an account or sign in to publish, like, and comment."}
            </p>
          </div>
        </div>

        <textarea
          className="composer-textarea"
          value={postForm.text}
          onChange={(event) => onPostTextChange(event.target.value)}
          placeholder="What's on your mind?"
        />

        <div className="composer-meta-row">
          <span className={`composer-status ${draftSaved ? "good" : ""}`}>
            {draftSaved ? "Draft saved locally" : "Draft editing"}
          </span>
          <span className={`composer-status ${postCharacterCount > maxPostLength ? "warn" : ""}`}>
            {postCharacterCount}/{maxPostLength}
          </span>
        </div>

        {postForm.preview ? (
          <div className="image-preview">
            <img src={postForm.preview} alt="Selected preview" />
            <button type="button" onClick={onRemoveImage}>
              Remove image
            </button>
            {postForm.image ? (
              <div className="image-meta-pill">
                {postForm.image.name} · {(postForm.image.size / 1024 / 1024).toFixed(2)} MB
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="composer-actions">
          <label className="action-pill upload-pill">
            <ImagePlus size={18} />
            <span>Add Image</span>
            <input type="file" accept="image/*" onChange={onImageChange} hidden />
          </label>

          <button type="button" className="action-pill">
            <Sparkles size={18} />
            <span>Promote</span>
          </button>

          <button type="button" className="action-pill neutral-pill" onClick={onClearComposer}>
            <span>Clear Draft</span>
          </button>

          <button type="button" className="primary-action" onClick={onCreatePost} disabled={isPostDisabled}>
            <Send size={18} />
            <span>{postLoading ? "Posting..." : "Post"}</span>
          </button>
        </div>
      </section>

      <FeedInsights
        characterCount={postCharacterCount}
        draftSaved={draftSaved}
        feedFilter={feedFilter}
        maxCharacters={maxPostLength}
        searchTerm={searchTerm}
        trendingTopics={trendingTopics}
        visibleCount={visiblePosts.length}
      />

      <div className="filter-row">
        {feedFilters.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`filter-chip ${feedFilter === item.id ? "active" : ""}`}
            onClick={() => onFeedFilterChange(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {loadingPosts ? (
        <div className="feed-list">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="post-card card"
              style={{
                opacity: 0.7,
                animation: "pulse 1.5s infinite ease-in-out",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "50%",
                    background: "var(--border-color, #e2e8f0)",
                  }}
                />
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", flex: 1 }}>
                  <div
                    style={{
                      height: "14px",
                      width: "35%",
                      borderRadius: "4px",
                      background: "var(--border-color, #e2e8f0)",
                    }}
                  />
                  <div
                    style={{
                      height: "10px",
                      width: "20%",
                      borderRadius: "4px",
                      background: "var(--border-color, #e2e8f0)",
                    }}
                  />
                </div>
              </div>
              <div
                style={{
                  height: "14px",
                  width: "90%",
                  borderRadius: "4px",
                  background: "var(--border-color, #e2e8f0)",
                }}
              />
              <div
                style={{
                  height: "14px",
                  width: "65%",
                  borderRadius: "4px",
                  background: "var(--border-color, #e2e8f0)",
                }}
              />
              <div
                style={{
                  height: "180px",
                  width: "100%",
                  borderRadius: "8px",
                  background: "var(--border-color, #e2e8f0)",
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {!loadingPosts && !visiblePosts.length ? (
        <div className="empty-state card">
          <h3>No posts match this view yet.</h3>
          <p>Try another filter, clear the search, or publish the first post.</p>
        </div>
      ) : null}

      <div className="feed-list">
        {visiblePosts.map((post) => (
          <PostCard
            key={post._id}
            busyPostId={busyPostId}
            commentDrafts={commentDrafts}
            currentUser={currentUser}
            expandedPostId={expandedPostId}
            onBookmark={onBookmark}
            onCommentChange={onCommentChange}
            onCommentSubmit={onCommentSubmit}
            onDeleteComment={onDeleteComment}
            onDeletePost={onDeletePost}
            onEditPost={onEditPost}
            onImageClick={onImageClick}
            onLike={onLike}
            onLikeComment={onLikeComment}
            onNotify={onNotify}
            onToggleComments={onToggleComments}
            post={post}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </section>
  );
}

export default FeedColumn;
