import { ImagePlus, Send, Sparkles } from "lucide-react";
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
  onLike,
  onLikeComment,
  onPostTextChange,
  onRemoveImage,
  onToggleComments,
  postForm,
  postLoading,
  searchTerm,
  trendingTopics,
  visiblePosts,
}) {
  const postCharacterCount = postForm.text.length;
  const isPostDisabled = postLoading || (!postForm.text.trim() && !postForm.image);

  return (
    <section className="feed-column">
      <section className="composer card">
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
        <div className="empty-state card">
          <h3>Loading the community feed...</h3>
          <p>Posts will appear here as soon as the server responds.</p>
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
            onLike={onLike}
            onLikeComment={onLikeComment}
            onToggleComments={onToggleComments}
            post={post}
          />
        ))}
      </div>
    </section>
  );
}

export default FeedColumn;
