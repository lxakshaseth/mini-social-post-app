import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import ActionModal from "./components/ActionModal";
import FeatureDrawer from "./components/FeatureDrawer";
import LeftRail from "./components/LeftRail";
import TopBar from "./components/TopBar";
import FeedColumn from "./components/FeedColumn";
import RightRail from "./components/RightRail";
import {
  addComment,
  createPost,
  deleteComment,
  deletePost,
  fetchCurrentUser,
  fetchPosts,
  loginUser,
  signupUser,
  toggleBookmarkPost,
  toggleLikeComment,
  toggleLikeOnPost,
  updatePost,
  updateUserProfile,
} from "./api";
import {
  engagementScore,
  extractTrendingTopics,
  formatDate,
  getStoredUser,
  heroHighlights,
} from "./utils";

const POST_DRAFT_KEY = "taskplanet-post-draft";
const THEME_KEY = "taskplanet-theme";
const MAX_POST_LENGTH = 1000;

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("taskplanet-token") || "");
  const [currentUser, setCurrentUser] = useState(getStoredUser);
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [authMode, setAuthMode] = useState("signup");
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [postForm, setPostForm] = useState(() => ({
    text: localStorage.getItem(POST_DRAFT_KEY) || "",
    image: null,
    preview: "",
  }));
  const [commentDrafts, setCommentDrafts] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [feedFilter, setFeedFilter] = useState("all");
  const [composerFilter, setComposerFilter] = useState("all");
  const [activityTab, setActivityTab] = useState("message");
  const [activeNav, setActiveNav] = useState("Social");
  const [themeMode, setThemeMode] = useState(() => localStorage.getItem(THEME_KEY) || "light");
  const [expandedPostId, setExpandedPostId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [featureDrawer, setFeatureDrawer] = useState(null);
  const [flash, setFlash] = useState(null);
  const [draftSaved, setDraftSaved] = useState(Boolean(localStorage.getItem(POST_DRAFT_KEY)));
  const [authLoading, setAuthLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [busyPostId, setBusyPostId] = useState("");
  const [dismissedActivityIds, setDismissedActivityIds] = useState([]);
  const heroRef = useRef(null);
  const feedRef = useRef(null);
  const activityRef = useRef(null);
  const statsRef = useRef(null);
  const searchInputRef = useRef(null);
  const profileDropdownRef = useRef(null);

  useEffect(() => {
    loadPosts();
  }, []);

  useEffect(() => {
    document.body.dataset.theme = themeMode;
    localStorage.setItem(THEME_KEY, themeMode);
    return () => {
      delete document.body.dataset.theme;
    };
  }, [themeMode]);

  useEffect(() => {
    const trimmedDraft = postForm.text.trim();

    if (trimmedDraft) {
      const timer = window.setTimeout(() => {
        localStorage.setItem(POST_DRAFT_KEY, postForm.text);
        setDraftSaved(true);
      }, 280);

      return () => window.clearTimeout(timer);
    } else {
      localStorage.removeItem(POST_DRAFT_KEY);
      setDraftSaved(false);
    }
  }, [postForm.text]);

  useEffect(() => {
    if (token) {
      localStorage.setItem("taskplanet-token", token);
    } else {
      localStorage.removeItem("taskplanet-token");
    }
  }, [token]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem("taskplanet-user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("taskplanet-user");
    }
  }, [currentUser]);

  useEffect(() => {
    if (!token) {
      setCurrentUser(null);
      return;
    }

    async function hydrateUser() {
      try {
        const response = await fetchCurrentUser(token);
        setCurrentUser(response.user);
      } catch (error) {
        if (error.status === 503) {
          setFlash({
            type: "info",
            text: "Account data is reconnecting. You can still browse the interface and use AI support.",
          });
          return;
        }

        setToken("");
        setCurrentUser(null);
      }
    }

    hydrateUser();
  }, [token]);

  useEffect(() => {
    function handleGlobalKeyDown(event) {
      const tagName = event.target?.tagName;
      const isTypingContext =
        tagName === "INPUT" || tagName === "TEXTAREA" || event.target?.isContentEditable;

      if (event.key === "Escape") {
        setMenuOpen(false);
        setActionModal(null);
        setFeatureDrawer(null);
        return;
      }

      if (event.key === "/" && !isTypingContext) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    }

    function handlePointerDown(event) {
      if (!menuOpen) {
        return;
      }

      if (!profileDropdownRef.current?.contains(event.target)) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [menuOpen]);

  async function loadPosts() {
    try {
      setLoadingPosts(true);
      const data = await fetchPosts();
      setPosts(data);
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setLoadingPosts(false);
    }
  }

  function scrollToSection(ref) {
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openModal(config) {
    setActionModal(config);
  }

  function openFeatureDrawer(view, payload = {}) {
    setActionModal(null);
    setFeatureDrawer({ view, ...payload });
  }

  const showNotice = useCallback((type, text) => {
    setFlash({ type, text });
  }, []);

  function requireAuth(message) {
    if (token) {
      return true;
    }

    setAuthMode("login");
    setFlash({ type: "info", text: message });
    return false;
  }

  function resetComposer() {
    if (postForm.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(postForm.preview);
    }

    localStorage.removeItem(POST_DRAFT_KEY);
    setDraftSaved(false);
    setPostForm({ text: "", image: null, preview: "" });
  }

  function removeSelectedImage() {
    if (postForm.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(postForm.preview);
    }

    setPostForm((current) => ({ ...current, image: null, preview: "" }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (postForm.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(postForm.preview);
    }

    setPostForm((current) => ({
      ...current,
      image: file,
      preview: URL.createObjectURL(file),
    }));
  }

  function handlePostTextChange(value) {
    const trimmedValue = value.slice(0, MAX_POST_LENGTH);
    setDraftSaved(false);
    setPostForm((current) => ({ ...current, text: trimmedValue }));
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthLoading(true);

    try {
      const action = authMode === "signup" ? signupUser : loginUser;
      const payload =
        authMode === "signup"
          ? authForm
          : { email: authForm.email, password: authForm.password };
      const response = await action(payload);

      setToken(response.token);
      setCurrentUser(response.user);
      setAuthForm({ name: "", email: "", password: "" });
      setFlash({
        type: "success",
        text:
          authMode === "signup"
            ? "Account created. You can post, like, and comment now."
            : "Welcome back. Your feed is ready.",
      });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleCreatePost() {
    if (!requireAuth("Sign in to create a post.")) {
      return;
    }

    if (!postForm.text.trim() && !postForm.image) {
      setFlash({ type: "error", text: "Add text or choose an image before posting." });
      return;
    }

    setPostLoading(true);

    try {
      const formData = new FormData();

      if (postForm.text.trim()) {
        formData.append("text", postForm.text.trim());
      }

      if (postForm.image) {
        formData.append("image", postForm.image);
      }

      const createdPost = await createPost(formData, token);
      setPosts((current) => [createdPost, ...current]);
      setComposerFilter("all");
      setFeedFilter("all");
      resetComposer();
      setFlash({ type: "success", text: "Your post is live in the public feed." });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setPostLoading(false);
    }
  }

  async function handleLike(postId) {
    if (!requireAuth("Log in to like posts.")) {
      return;
    }

    setBusyPostId(postId);

    try {
      const updatedPost = await toggleLikeOnPost(postId, token);
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setBusyPostId("");
    }
  }

  async function handleCommentSubmit(postId) {
    if (!requireAuth("Log in to comment on posts.")) {
      return;
    }

    const text = (commentDrafts[postId] || "").trim();

    if (!text) {
      setFlash({ type: "error", text: "Write a comment before sending it." });
      return;
    }

    setBusyPostId(postId);

    try {
      const updatedPost = await addComment(postId, text, token);
      setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
      setExpandedPostId(postId);
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setBusyPostId("");
    }
  }

  async function handleDeletePost(postId) {
    if (!requireAuth("Log in to delete your post.")) {
      return;
    }

    setBusyPostId(postId);

    try {
      await deletePost(postId, token);
      setPosts((current) => current.filter((post) => post._id !== postId));
      setFlash({ type: "success", text: "Post removed successfully." });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setBusyPostId("");
    }
  }

  async function handleEditPost(postId, updatedText) {
    if (!requireAuth("Log in to edit your post.")) {
      return;
    }

    setBusyPostId(postId);

    try {
      const updatedPost = await updatePost(postId, updatedText, token);
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
      setFlash({ type: "success", text: "Post updated successfully." });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    } finally {
      setBusyPostId("");
    }
  }

  async function handleDeleteComment(postId, commentId) {
    if (!requireAuth("Log in to delete comments.")) {
      return;
    }

    try {
      const updatedPost = await deleteComment(postId, commentId, token);
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
      setFlash({ type: "success", text: "Comment removed." });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    }
  }

  async function handleLikeComment(postId, commentId) {
    if (!requireAuth("Log in to like comments.")) {
      return;
    }

    try {
      const updatedPost = await toggleLikeComment(postId, commentId, token);
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    }
  }

  async function handleBookmark(postId) {
    if (!requireAuth("Log in to bookmark posts.")) {
      return;
    }

    try {
      const result = await toggleBookmarkPost(postId, token);
      setCurrentUser((prev) => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          savedPosts: result.savedPosts || [],
        };
        localStorage.setItem("taskplanet-user", JSON.stringify(updated));
        return updated;
      });
      setFlash({
        type: "success",
        text: result.message || (result.isBookmarked ? "Post saved." : "Post removed from saved."),
      });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    }
  }

  async function handleUpdateProfile(profileData) {
    if (!token) return;
    const response = await updateUserProfile(profileData, token);
    if (response?.user) {
      setCurrentUser(response.user);
      localStorage.setItem("taskplanet-user", JSON.stringify(response.user));
      // update user in posts if any
      setPosts((current) =>
        current.map((p) =>
          String(p.author) === String(response.user._id)
            ? {
                ...p,
                authorName: response.user.name,
                authorAvatarColor: response.user.avatarColor,
              }
            : p
        )
      );
    }
    return response;
  }

  function handleNavClick(label) {
    setActiveNav(label);
    setMenuOpen(false);

    if (label === "Home") {
      scrollToSection(heroRef);
      setFlash({ type: "info", text: "Home section opened. Overview is ready on top." });
      return;
    }

    if (label === "Social") {
      setFeedFilter("all");
      scrollToSection(feedRef);
      setFlash({ type: "info", text: "Social feed opened. You can create and browse posts here." });
      return;
    }

    if (label === "Bookmarks") {
      setFeedFilter("saved");
      scrollToSection(feedRef);
      setFlash({ type: "info", text: "Bookmarks opened. Showing all your saved posts." });
      return;
    }

    scrollToSection(statsRef);
    setFlash({ type: "info", text: "Discover opened. Community stats and trends are on the right." });
  }

  function handleSearchSubmit() {
    scrollToSection(feedRef);

    if (!searchTerm.trim()) {
      setFlash({
        type: "info",
        text: "Search bar is active. Type a username, handle, or post keyword.",
      });
      return;
    }

    setFlash({
      type: "info",
      text: `${visiblePosts.length} post${visiblePosts.length === 1 ? "" : "s"} found for "${searchTerm.trim()}".`,
    });
  }

  function handleThemeToggle() {
    setThemeMode((current) => {
      const next = current === "light" ? "night" : "light";
      setFlash({
        type: "success",
        text: next === "night" ? "Night mode enabled." : "Light mode enabled.",
      });
      return next;
    });
  }

  function handleStarOpen() {
    openModal({
      eyebrow: "Engagement",
      title: "Your total likes",
      description: "This counter shows the likes collected on posts created by the current account.",
      points: [
        `${starCount} likes received so far`,
        `${ownPosts.length} post${ownPosts.length === 1 ? "" : "s"} published`,
        `${posts.reduce((sum, post) => sum + post.likes.length, 0)} total likes in the full community`,
      ],
      cta: "Close",
    });
  }

  function handleWalletOpen() {
    openModal({
      eyebrow: "Wallet",
      title: "Estimated wallet summary",
      description: "For demo feedback, the wallet value is calculated from comments on your posts so taps produce a meaningful response.",
      points: [
        `Current estimate: INR ${walletValue}`,
        `${ownPosts.reduce((sum, post) => sum + post.comments.length, 0)} comment-based earnings events`,
        "You can swap this formula later with real business logic from your backend.",
      ],
      cta: "Got it",
    });
  }

  function handleNotificationOpen() {
    setActivityTab("notification");
    scrollToSection(activityRef);
    setFlash({
      type: "info",
      text: unreadNotificationsCount
        ? `${unreadNotificationsCount} notification${unreadNotificationsCount === 1 ? "" : "s"} available.`
        : "No new notifications right now.",
    });
  }

  function handleProfileMenuAction(item) {
    setMenuOpen(false);

    if (item.label === "My Profile") {
      openFeatureDrawer("profile");
      return;
    }

    if (item.label === "Activate Premium") {
      openFeatureDrawer("premium");
      return;
    }

    if (item.label === "Activate Premium Plus") {
      openFeatureDrawer("premiumPlus");
      return;
    }

    if (item.label === "Help and Support") {
      openFeatureDrawer("support");
      return;
    }

    if (item.label === "Chat with Us") {
      openFeatureDrawer("chat");
      return;
    }

    if (item.label === "Feedback") {
      openFeatureDrawer("feedback");
      return;
    }

    if (item.label === "FAQ") {
      openFeatureDrawer("faq");
      return;
    }

    if (item.action === "signout") {
      openFeatureDrawer("session");
      return;
    }

    openFeatureDrawer("about");
  }

  function handleSignOut() {
    setToken("");
    setCurrentUser(null);
    setMenuOpen(false);
    setActionModal(null);
    setFeatureDrawer(null);
    setFlash({ type: "success", text: "Signed out. The feed is still public to browse." });
  }

  const ownPosts = currentUser
    ? posts.filter((post) => String(post.author) === String(currentUser._id))
    : [];
  const starCount = ownPosts.reduce((total, post) => total + post.likes.length, 0);
  const walletValue = ownPosts.reduce((total, post) => total + post.comments.length * 7.5, 0).toFixed(2);
  const totalComments = posts.reduce((total, post) => total + post.comments.length, 0);
  const trendingTopics = extractTrendingTopics(posts);
  const profileCompletion = currentUser
    ? [currentUser.name, currentUser.email, ownPosts.length > 0, starCount > 0].filter(Boolean).length * 25
    : 25;
  const engagementRate = ownPosts.length
    ? Math.round(
        (ownPosts.reduce((sum, post) => sum + post.likes.length + post.comments.length, 0) /
          ownPosts.length) *
          10
      ) / 10
    : 0;

  const notificationItems = currentUser
    ? posts
        .filter((post) => String(post.author) === String(currentUser._id))
        .flatMap((post) => [
          ...post.likes
            .filter((like) => String(like.userId) !== String(currentUser._id))
            .map((like) => ({
              id: `like-${post._id}-${like.userId}`,
              title: `${like.username} liked your post`,
              detail: post.text || "Image post",
              date: formatDate(post.updatedAt),
              createdAt: post.updatedAt,
              tone: "positive",
            })),
          ...post.comments
            .filter((comment) => String(comment.userId) !== String(currentUser._id))
            .map((comment) => ({
              id: `comment-${post._id}-${comment._id}`,
              title: `${comment.username} replied to your post`,
              detail: comment.text,
              date: formatDate(comment.createdAt),
              createdAt: comment.createdAt,
              tone: "neutral",
            })),
        ])
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    : [];

  const messageItems = currentUser
    ? posts
        .filter((post) => String(post.author) === String(currentUser._id))
        .flatMap((post) =>
          post.comments
            .filter((comment) => String(comment.userId) !== String(currentUser._id))
            .map((comment) => ({
              id: `message-${post._id}-${comment._id}`,
              title: comment.username,
              detail: comment.text,
              date: formatDate(comment.createdAt),
              createdAt: comment.createdAt,
              tone: "neutral",
            }))
        )
        .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    : [];

  const activityItems = (activityTab === "message" ? messageItems : notificationItems).filter(
    (item) => !dismissedActivityIds.includes(item.id)
  );
  const unreadNotificationsCount = notificationItems.filter(
    (item) => !dismissedActivityIds.includes(item.id)
  ).length;

  let visiblePosts = [...posts];

  if (composerFilter === "promotions") {
    visiblePosts = visiblePosts.filter((post) => post.imageUrl);
  }

  if (searchTerm.trim()) {
    const query = searchTerm.trim().toLowerCase();
    visiblePosts = visiblePosts.filter((post) =>
      [post.authorName, post.authorHandle, post.text, post.comments.map((c) => c.username).join(" "), post.likes.map((l) => l.username).join(" ")]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }

  if (feedFilter === "saved") {
    const savedIds = new Set(
      (currentUser?.savedPosts || []).map((p) => (p._id ? String(p._id) : String(p)))
    );
    visiblePosts = visiblePosts.filter((post) => savedIds.has(String(post._id)));
  } else if (feedFilter === "for-you") {
    const sortedForYou = [...visiblePosts].sort(
      (left, right) =>
        engagementScore(right) - engagementScore(left) ||
        new Date(right.createdAt) - new Date(left.createdAt)
    );
    visiblePosts = currentUser
      ? sortedForYou.filter((post) => String(post.author) !== String(currentUser._id))
      : sortedForYou;
    if (!visiblePosts.length) {
      visiblePosts = sortedForYou;
    }
  } else if (feedFilter === "most-liked") {
    visiblePosts = [...visiblePosts].sort(
      (left, right) => right.likes.length - left.likes.length || new Date(right.createdAt) - new Date(left.createdAt)
    );
  } else if (feedFilter === "most-commented") {
    visiblePosts = [...visiblePosts].sort(
      (left, right) =>
        right.comments.length - left.comments.length || new Date(right.createdAt) - new Date(left.createdAt)
    );
  } else {
    visiblePosts = [...visiblePosts].sort(
      (left, right) => new Date(right.createdAt) - new Date(left.createdAt)
    );
  }

  return (
    <div className={`app-shell ${themeMode === "night" ? "night-mode" : ""}`}>
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <LeftRail activeNav={activeNav} onNavClick={handleNavClick} />

      <main className="main-stage">
        <TopBar
          currentUser={currentUser}
          menuOpen={menuOpen}
          onToggleMenu={() => setMenuOpen((open) => !open)}
          profileDropdownRef={profileDropdownRef}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onSearchSubmit={handleSearchSubmit}
          searchInputRef={searchInputRef}
          onThemeToggle={handleThemeToggle}
          themeMode={themeMode}
          starCount={starCount}
          onStarOpen={handleStarOpen}
          walletValue={walletValue}
          onWalletOpen={handleWalletOpen}
          unreadNotificationsCount={unreadNotificationsCount}
          onNotificationOpen={handleNotificationOpen}
          onProfileMenuAction={handleProfileMenuAction}
          ownPostsCount={ownPosts.length}
        />

        {flash ? (
          <div className={`notice notice-${flash.type || "info"}`}>
            <span>{flash.text}</span>
            <button type="button" onClick={() => setFlash(null)}>
              <X size={16} />
            </button>
          </div>
        ) : null}

        <section ref={heroRef} className="hero-banner card">
          <div className="hero-copy">
            <p className="eyebrow">Inspired by the TaskPlanet mobile feed</p>
            <h2>A desktop-first social board with real auth, posts, likes, and comments.</h2>
            <p className="hero-text">
              The layout keeps the familiar TaskPlanet feel, then stretches it into a wider
              dashboard with a left navigation rail, a feed-focused center column, and a live
              activity panel on the right.
            </p>
            <div className="hero-tags">
              {heroHighlights.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>
          </div>

          <div className="hero-preview">
            <div className="mini-card">
              <strong>{posts.length}</strong>
              <span>Public posts</span>
            </div>
            <div className="mini-card">
              <strong>{totalComments}</strong>
              <span>Comments saved</span>
            </div>
            <div className="mini-card">
              <strong>{posts.reduce((sum, post) => sum + post.likes.length, 0)}</strong>
              <span>Total likes</span>
            </div>
          </div>
        </section>

        <div className="content-grid">
          <div ref={feedRef}>
            <FeedColumn
              busyPostId={busyPostId}
              commentDrafts={commentDrafts}
              composerFilter={composerFilter}
              currentUser={currentUser}
              draftSaved={draftSaved}
              expandedPostId={expandedPostId}
              feedFilter={feedFilter}
              loadingPosts={loadingPosts}
              maxPostLength={MAX_POST_LENGTH}
              onBookmark={handleBookmark}
              onCommentChange={(postId, value) =>
                setCommentDrafts((current) => ({ ...current, [postId]: value }))
              }
              onCommentSubmit={handleCommentSubmit}
              onComposerFilterChange={setComposerFilter}
              onClearComposer={resetComposer}
              onCreatePost={handleCreatePost}
              onDeleteComment={handleDeleteComment}
              onDeletePost={handleDeletePost}
              onEditPost={handleEditPost}
              onFeedFilterChange={setFeedFilter}
              onImageChange={handleImageChange}
              onLike={handleLike}
              onLikeComment={handleLikeComment}
              onPostTextChange={handlePostTextChange}
              onRemoveImage={removeSelectedImage}
              onToggleComments={setExpandedPostId}
              postForm={postForm}
              postLoading={postLoading}
              searchTerm={searchTerm}
              trendingTopics={trendingTopics}
              visiblePosts={visiblePosts}
            />
          </div>

          <RightRail
            activityItems={activityItems}
            activityTab={activityTab}
            activityPanelRef={activityRef}
            authForm={authForm}
            authLoading={authLoading}
            authMode={authMode}
            currentUser={currentUser}
            engagementRate={engagementRate}
            onActivityTabChange={setActivityTab}
            onAuthFormChange={(field, value) =>
              setAuthForm((current) => ({ ...current, [field]: value }))
            }
            onAuthModeChange={setAuthMode}
            onAuthSubmit={handleAuthSubmit}
            onClearActivity={() =>
              setDismissedActivityIds((current) => [
                ...new Set([...current, ...activityItems.map((item) => item.id)]),
              ])
            }
            onSignOut={handleSignOut}
            ownPosts={ownPosts}
            profileCompletion={profileCompletion}
            posts={posts}
            starCount={starCount}
            statsPanelRef={statsRef}
            totalComments={totalComments}
            trendingTopics={trendingTopics}
          />
        </div>
      </main>

      <ActionModal modal={actionModal} onClose={() => setActionModal(null)} />
      <FeatureDrawer
        currentUser={currentUser}
        drawer={featureDrawer}
        engagementRate={engagementRate}
        onClose={() => setFeatureDrawer(null)}
        onNotify={showNotice}
        onOpenView={openFeatureDrawer}
        onSignOut={handleSignOut}
        ownPostsCount={ownPosts.length}
        profileCompletion={profileCompletion}
        starCount={starCount}
        totalComments={totalComments}
        unreadNotificationsCount={unreadNotificationsCount}
        walletValue={walletValue}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}

export default App;
