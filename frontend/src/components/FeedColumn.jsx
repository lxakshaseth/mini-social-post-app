import { useState } from "react";
import { ImagePlus, Plus, Send, Sparkles, Trash2, UploadCloud, Vote, X } from "lucide-react";
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
  feedDensity = "cozy",
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
  onPinPost,
  onPostTextChange,
  onRemoveImage,
  onReportPost,
  onToggleComments,
  onToggleFeedDensity,
  onVotePoll,
  postForm,
  postLoading,
  searchTerm,
  trendingTopics,
  visiblePosts,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [showPollCreator, setShowPollCreator] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const postCharacterCount = postForm.text.length;
  const hasValidPoll = showPollCreator && pollOptions.filter((o) => o.trim()).length >= 2;
  const isPostDisabled =
    postLoading ||
    (!postForm.text.trim() && !postForm.image && !hasValidPoll);

  function handleFormSubmit() {
    let pollPayload = null;
    if (showPollCreator) {
      const validOptions = pollOptions.map((o) => o.trim()).filter(Boolean);
      if (validOptions.length >= 2) {
        pollPayload = {
          question: pollQuestion.trim(),
          options: validOptions.map((optText) => ({ optionText: optText })),
        };
      }
    }
    onCreatePost(pollPayload);
    if (pollPayload) {
      setShowPollCreator(false);
      setPollQuestion("");
      setPollOptions(["", ""]);
    }
  }

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

        <div className="composer-meta-row" style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={`composer-status ${draftSaved ? "good" : ""}`}>
              {draftSaved ? "Draft saved locally" : "Draft editing"}
            </span>
            <span
              className={`composer-status ${postCharacterCount > maxPostLength * 0.9 ? "warn" : ""}`}
              style={{
                color:
                  postCharacterCount > maxPostLength
                    ? "#ef4444"
                    : postCharacterCount > maxPostLength * 0.8
                    ? "#f59e0b"
                    : undefined,
                fontWeight: 600,
              }}
            >
              {postCharacterCount}/{maxPostLength}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              height: "4px",
              background: "var(--border-color, #e2e8f0)",
              borderRadius: "2px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${Math.min(100, (postCharacterCount / maxPostLength) * 100)}%`,
                background:
                  postCharacterCount > maxPostLength * 0.9
                    ? "#ef4444"
                    : postCharacterCount > maxPostLength * 0.7
                    ? "#f59e0b"
                    : "var(--primary, #3b82f6)",
                transition: "width 0.2s ease, background 0.2s ease",
              }}
            />
          </div>
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

        <div
          className="composer-templates-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "6px 0",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted, #64748b)", fontWeight: 500 }}>
            Templates:
          </span>
          {[
            { label: "🚀 Project", text: "🚀 Project Update: Excited to share what we've been building!\n\n#buildinpublic" },
            { label: "💡 Dev Tip", text: "💡 Quick Tip: Here is something helpful I discovered today:\n\n#devtips" },
            { label: "🎉 Milestone", text: "🎉 Big Milestone reached! Huge thanks to the community.\n\n#milestone" },
            { label: "❓ Question", text: "❓ Community Question: What is your favorite approach for\n\n#discussion" },
          ].map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                const nextText = postForm.text ? `${item.text}\n\n${postForm.text}` : item.text;
                onPostTextChange(nextText);
              }}
              style={{
                background: "rgba(20, 123, 255, 0.05)",
                border: "1px solid rgba(20, 123, 255, 0.15)",
                color: "var(--primary, #147bff)",
                borderRadius: "6px",
                padding: "2px 8px",
                fontSize: "12px",
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="composer-emoji-bar"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            margin: "4px 0 6px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "12px", color: "var(--muted, #64748b)", fontWeight: 500 }}>
            Quick Reactions:
          </span>
          {["🔥", "🚀", "💡", "✨", "❤️", "👏", "🎉", "💯"].map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onPostTextChange(postForm.text ? `${postForm.text} ${emoji}` : emoji)}
              style={{
                background: "transparent",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "6px",
                padding: "2px 6px",
                fontSize: "14px",
                cursor: "pointer",
                lineHeight: 1,
              }}
            >
              {emoji}
            </button>
          ))}
        </div>

        {showPollCreator && (
          <div
            className="composer-poll-creator"
            style={{
              background: "var(--poll-bg, rgba(27, 132, 255, 0.05))",
              border: "1px solid var(--border-color, #e2e8f0)",
              borderRadius: "10px",
              padding: "12px",
              margin: "10px 0",
              display: "grid",
              gap: "8px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <strong style={{ fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Vote size={16} color="var(--primary, #1b84ff)" />
                Create a Community Poll
              </strong>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setShowPollCreator(false)}
                title="Cancel Poll"
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit" }}
              >
                <X size={16} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Ask a question... (optional)"
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: "6px",
                border: "1px solid var(--border-color, #cbd5e1)",
                background: "var(--card-bg, #fff)",
                color: "inherit",
                fontSize: "13px",
              }}
            />

            {pollOptions.map((option, idx) => (
              <div key={idx} style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder={`Option ${idx + 1}`}
                  value={option}
                  onChange={(e) => {
                    const updated = [...pollOptions];
                    updated[idx] = e.target.value;
                    setPollOptions(updated);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px 10px",
                    borderRadius: "6px",
                    border: "1px solid var(--border-color, #cbd5e1)",
                    background: "var(--card-bg, #fff)",
                    color: "inherit",
                    fontSize: "13px",
                  }}
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => setPollOptions(pollOptions.filter((_, i) => i !== idx))}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                )}
              </div>
            ))}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
              {pollOptions.length < 4 ? (
                <button
                  type="button"
                  onClick={() => setPollOptions([...pollOptions, ""])}
                  style={{
                    background: "transparent",
                    border: "none",
                    color: "var(--primary, #1b84ff)",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                  }}
                >
                  <Plus size={14} /> Add Option
                </button>
              ) : <span />}
              <span style={{ fontSize: "11px", color: "var(--muted, #64748b)" }}>
                2-4 choices supported
              </span>
            </div>
          </div>
        )}

        <div className="composer-actions">
          <label className="action-pill upload-pill">
            <ImagePlus size={18} />
            <span>Add Image</span>
            <input type="file" accept="image/*" onChange={onImageChange} hidden />
          </label>

          <button
            type="button"
            className={`action-pill ${showPollCreator ? "active" : ""}`}
            onClick={() => setShowPollCreator((p) => !p)}
          >
            <Vote size={18} />
            <span>{showPollCreator ? "Poll Active" : "Add Poll"}</span>
          </button>

          <button type="button" className="action-pill">
            <Sparkles size={18} />
            <span>Promote</span>
          </button>

          <button type="button" className="action-pill neutral-pill" onClick={onClearComposer}>
            <span>Clear Draft</span>
          </button>

          <button type="button" className="primary-action" onClick={handleFormSubmit} disabled={isPostDisabled}>
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

      <div className="filter-row-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap", margin: "14px 0 10px" }}>
        <div className="filter-row" style={{ flex: 1, margin: 0 }}>
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

        {onToggleFeedDensity && (
          <div className="density-toggle" style={{ display: "flex", gap: "4px", background: "var(--surface-soft, #f1f5f9)", padding: "2px", borderRadius: "8px" }}>
            <button
              type="button"
              onClick={() => onToggleFeedDensity("cozy")}
              title="Comfortable feed spacing"
              style={{
                border: "none",
                background: feedDensity === "cozy" ? "var(--surface-strong, #fff)" : "transparent",
                color: feedDensity === "cozy" ? "var(--primary, #147bff)" : "var(--muted, #64748b)",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Cozy
            </button>
            <button
              type="button"
              onClick={() => onToggleFeedDensity("compact")}
              title="Compact high-density feed"
              style={{
                border: "none",
                background: feedDensity === "compact" ? "var(--surface-strong, #fff)" : "transparent",
                color: feedDensity === "compact" ? "var(--primary, #147bff)" : "var(--muted, #64748b)",
                padding: "3px 8px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Compact
            </button>
          </div>
        )}
      </div>

      {loadingPosts ? (
        <div className={`feed-list ${feedDensity === "compact" ? "feed-compact" : ""}`}>
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

      <div className={`feed-list ${feedDensity === "compact" ? "feed-compact" : ""}`}>
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
            onPinPost={onPinPost}
            onReportPost={onReportPost}
            onToggleComments={onToggleComments}
            onVotePoll={onVotePoll}
            post={post}
            searchTerm={searchTerm}
          />
        ))}
      </div>
    </section>
  );
}

export default FeedColumn;
