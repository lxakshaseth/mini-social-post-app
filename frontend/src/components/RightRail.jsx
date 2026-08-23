import { useState } from "react";
import { Eye, EyeOff, LogOut } from "lucide-react";
import Avatar from "./Avatar";

function RightRail({
  activityItems,
  activityTab,
  activityPanelRef,
  currentUser,
  engagementRate,
  onActivityTabChange,
  onClearActivity,
  onSignOut,
  onAuthModeChange,
  onAuthSubmit,
  authForm,
  authLoading,
  authMode,
  onAuthFormChange,
  ownPosts,
  profileCompletion,
  starCount,
  statsPanelRef,
  totalComments,
  trendingTopics,
  posts,
}) {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <aside className="right-rail">
      <section ref={activityPanelRef} className="activity-panel card">
        <div className="activity-header">
          <div>
            <h2>Notifications</h2>
            <p>Comments and reactions on your posts</p>
          </div>
          <button type="button" className="clear-button" onClick={onClearActivity}>
            Clear all
          </button>
        </div>

        <div className="segmented-control activity-toggle">
          <button
            type="button"
            className={activityTab === "message" ? "active" : ""}
            onClick={() => onActivityTabChange("message")}
          >
            Message
          </button>
          <button
            type="button"
            className={activityTab === "notification" ? "active" : ""}
            onClick={() => onActivityTabChange("notification")}
          >
            Notification
          </button>
        </div>

        <div className="activity-list">
          {activityItems.length ? (
            activityItems.map((item) => (
              <article key={item.id} className={`activity-item ${item.tone}`}>
                <div className="activity-dot" />
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                  <small>{item.date}</small>
                </div>
              </article>
            ))
          ) : (
            <div className="activity-empty">
              <h3>Nothing new yet.</h3>
              <p>Once someone likes or comments on one of your posts, it will appear here.</p>
            </div>
          )}
        </div>
      </section>

      <section className="auth-card card">
        <div className="section-header compact">
          <div>
            <h2>{currentUser ? "Your Profile" : "Account Access"}</h2>
            <p>
              {currentUser
                ? "You are ready to create, like, and comment."
                : "Sign up or log in with email and password."}
            </p>
          </div>
        </div>

        {currentUser ? (
          <div className="profile-card">
            <div className="profile-line">
              <Avatar name={currentUser.name} color={currentUser.avatarColor} />
              <div>
                <strong>{currentUser.name}</strong>
                <p>@{currentUser.handle}</p>
              </div>
            </div>

            <div className="stat-grid">
              <div>
                <strong>{ownPosts.length}</strong>
                <span>Posts</span>
              </div>
              <div>
                <strong>{starCount}</strong>
                <span>Likes</span>
              </div>
              <div>
                <strong>{ownPosts.reduce((sum, post) => sum + post.comments.length, 0)}</strong>
                <span>Comments</span>
              </div>
            </div>

            <div className="profile-health">
              <div className="profile-health-row">
                <span>Profile completion</span>
                <strong>{profileCompletion}%</strong>
              </div>
              <div className="progress-track">
                <div className="progress-bar" style={{ width: `${profileCompletion}%` }} />
              </div>
              <div className="profile-health-row compact">
                <span>Avg engagement per post</span>
                <strong>{engagementRate}</strong>
              </div>
            </div>

            <button type="button" className="secondary-action" onClick={onSignOut}>
              <LogOut size={18} />
              <span>Sign Out</span>
            </button>
          </div>
        ) : (
          <>
            <div className="segmented-control auth-toggle">
              <button
                type="button"
                className={authMode === "signup" ? "active" : ""}
                onClick={() => onAuthModeChange("signup")}
              >
                Sign Up
              </button>
              <button
                type="button"
                className={authMode === "login" ? "active" : ""}
                onClick={() => onAuthModeChange("login")}
              >
                Login
              </button>
            </div>

            <form className="auth-form" onSubmit={onAuthSubmit}>
              {authMode === "signup" ? (
                <label>
                  Full Name
                  <input
                    type="text"
                    value={authForm.name}
                    onChange={(event) => onAuthFormChange("name", event.target.value)}
                    placeholder="Akshat Seth"
                  />
                </label>
              ) : null}

              <label>
                Email
                <input
                  type="email"
                  value={authForm.email}
                  onChange={(event) => onAuthFormChange("email", event.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label style={{ position: "relative" }}>
                Password
                <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={authForm.password}
                    onChange={(event) => onAuthFormChange("password", event.target.value)}
                    placeholder="At least 6 characters"
                    style={{ width: "100%", paddingRight: "40px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    title={showPassword ? "Hide password" : "Show password"}
                    style={{
                      position: "absolute",
                      right: "10px",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                      display: "flex",
                      color: "var(--muted, #64748b)",
                      padding: "4px",
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <button type="submit" className="primary-action wide" disabled={authLoading}>
                {authLoading
                  ? authMode === "signup"
                    ? "Creating..."
                    : "Signing in..."
                  : authMode === "signup"
                    ? "Create Account"
                    : "Login"}
              </button>
            </form>
          </>
        )}
      </section>

      <section ref={statsPanelRef} className="stats-panel card">
        <div className="section-header compact">
          <div>
            <h2>Live Community Pulse</h2>
            <p>Quick assignment-friendly stats from the same feed data.</p>
          </div>
        </div>

        <div className="pulse-list">
          <div className="pulse-row">
            <span>Users posting in feed</span>
            <strong>{new Set(posts.map((post) => post.authorHandle)).size}</strong>
          </div>
          <div className="pulse-row">
            <span>Total reactions</span>
            <strong>{posts.reduce((sum, post) => sum + post.likes.length, 0)}</strong>
          </div>
          <div className="pulse-row">
            <span>Total comments</span>
            <strong>{totalComments}</strong>
          </div>
          <div className="pulse-row">
            <span>Posts with images</span>
            <strong>{posts.filter((post) => post.imageUrl).length}</strong>
          </div>
        </div>

        <div className="trend-panel">
          <p className="eyebrow">Trending Topics</p>
          <div className="trending-strip">
            {trendingTopics.length ? (
              trendingTopics.map((topic) => (
                <span key={topic} className="trend-chip">
                  {topic}
                </span>
              ))
            ) : (
              <span className="trend-chip muted">No trends available</span>
            )}
          </div>
        </div>
      </section>
    </aside>
  );
}

export default RightRail;
