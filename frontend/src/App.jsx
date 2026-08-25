import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ArrowUp, CheckCircle2, Info, X } from "lucide-react";
import ActionModal from "./components/ActionModal";
import FeatureDrawer from "./components/FeatureDrawer";
import SystemCheckModal from "./components/SystemCheckModal";
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
  reportPost,
  signupUser,
  toggleBookmarkPost,
  toggleLikeComment,
  toggleLikeOnPost,
  togglePinPost,
  updatePost,
  updateUserProfile,
  votePoll,
} from "./api";
import {
  compressImage,
  engagementScore,
  exportBookmarksToJson,
  extractTrendingTopics,
  formatDate,
  getStoredUser,
  heroHighlights,
} from "./utils";
import { playDelete, playPop, playSuccess, playToggle } from "./soundEffects";

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
  const [feedDensity, setFeedDensity] = useState(() => localStorage.getItem("taskplanet-feed-density") || "cozy");
  const [expandedPostId, setExpandedPostId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionModal, setActionModal] = useState(null);
  const [featureDrawer, setFeatureDrawer] = useState(null);
  const [systemCheckOpen, setSystemCheckOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [draftSaved, setDraftSaved] = useState(Boolean(localStorage.getItem(POST_DRAFT_KEY)));
  const [authLoading, setAuthLoading] = useState(false);
  const [postLoading, setPostLoading] = useState(false);
  const [busyPostId, setBusyPostId] = useState("");
  const [dismissedActivityIds, setDismissedActivityIds] = useState([]);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== "undefined" ? navigator.onLine : true));
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
    function handleOnline() {
      setIsOnline(true);
      showNotice("success", "Connection restored. Live feed synchronized.");
      loadPosts();
    }
    function handleOffline() {
      setIsOnline(false);
      showNotice("info", "You are currently offline. Drafts will save locally.");
    }

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
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
        setSystemCheckOpen(false);
        setLightboxImage("");
        return;
      }

      if (isTypingContext) {
        return;
      }

      if (event.key === "/") {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === "c" || event.key === "n" || event.key === "C" || event.key === "N") {
        event.preventDefault();
        const composerTextarea = document.querySelector(".composer-textarea");
        if (composerTextarea) {
          composerTextarea.scrollIntoView({ behavior: "smooth", block: "center" });
          composerTextarea.focus();
        }
      } else if (event.key === "d" || event.key === "D") {
        event.preventDefault();
        setSystemCheckOpen((prev) => !prev);
      } else if (event.key === "t" || event.key === "T") {
        event.preventDefault();
        handleThemeToggle();
      } else if (event.key === "?") {
        event.preventDefault();
        setActionModal({
          title: "Keyboard Shortcuts",
          eyebrow: "Productivity",
          summary: "Navigate and interact quickly with power shortcuts:",
          points: [
            "/ - Focus search bar immediately",
            "C or N - Create new post (focus composer)",
            "D - Open System Health & Diagnostics",
            "T - Toggle Light / Night mode",
            "J / K - Navigate to next / previous post in feed",
            "Esc - Close open dialogs, drawers, and lightboxes",
            "? - Show this keyboard shortcut guide",
          ],
          actionLabel: "Got it",
        });
      } else if (event.key === "j" || event.key === "J") {
        const postCards = document.querySelectorAll(".post-card");
        if (postCards.length) {
          const scrollPos = window.scrollY + 150;
          for (let i = 0; i < postCards.length; i++) {
            const top = postCards[i].offsetTop;
            if (top > scrollPos) {
              postCards[i].scrollIntoView({ behavior: "smooth", block: "start" });
              break;
            }
          }
        }
      } else if (event.key === "k" || event.key === "K") {
        const postCards = document.querySelectorAll(".post-card");
        if (postCards.length) {
          const scrollPos = window.scrollY - 50;
          for (let i = postCards.length - 1; i >= 0; i--) {
            const top = postCards[i].offsetTop;
            if (top < scrollPos) {
              postCards[i].scrollIntoView({ behavior: "smooth", block: "start" });
              break;
            }
          }
        }
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

    function handleScroll() {
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    }

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("scroll", handleScroll);
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

  const [toasts, setToasts] = useState([]);

  const showNotice = useCallback((type, text) => {
    if (!text) return;
    const id = Date.now() + Math.random();
    const newToast = { id, type: type || "info", text };
    setToasts((current) => [...current.slice(-4), newToast]);
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const setFlash = useCallback((flashObj) => {
    if (flashObj?.text) {
      showNotice(flashObj.type, flashObj.text);
    }
  }, [showNotice]);

  function requireAuth(message) {
    if (token) {
      return true;
    }

    setAuthMode("login");
    showNotice("info", message);
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

  async function handleImageChange(event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (postForm.preview?.startsWith("blob:")) {
      URL.revokeObjectURL(postForm.preview);
    }

    try {
      const processedFile = await compressImage(file);
      setPostForm((current) => ({
        ...current,
        image: processedFile,
        preview: URL.createObjectURL(processedFile),
      }));
    } catch {
      setPostForm((current) => ({
        ...current,
        image: file,
        preview: URL.createObjectURL(file),
      }));
    }
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

  async function handleCreatePost(pollPayload) {
    if (!requireAuth("Sign in to create a post.")) {
      return;
    }

    if (!postForm.text.trim() && !postForm.image && !pollPayload) {
      setFlash({ type: "error", text: "Add text, choose an image, or create a poll before posting." });
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

      if (pollPayload) {
        formData.append("poll", JSON.stringify(pollPayload));
      }

      const createdPost = await createPost(formData, token);
      playSuccess();
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

  async function handleVotePoll(postId, optionIndex) {
    if (!requireAuth("Sign in to vote in community polls.")) {
      return;
    }

    // Optimistic poll vote update
    setPosts((current) =>
      current.map((post) => {
        if (post._id !== postId || !post.poll || !post.poll.options) return post;
        const userId = currentUser?._id;
        const updatedOptions = post.poll.options.map((opt, idx) => {
          const currentVotes = Array.isArray(opt.votes) ? opt.votes : [];
          const hasVotedThis = currentVotes.some((id) => String(id) === String(userId));
          if (idx === optionIndex) {
            return {
              ...opt,
              votes: hasVotedThis
                ? currentVotes.filter((id) => String(id) !== String(userId))
                : [...currentVotes, userId],
            };
          } else {
            return {
              ...opt,
              votes: currentVotes.filter((id) => String(id) !== String(userId)),
            };
          }
        });

        return {
          ...post,
          poll: {
            ...post.poll,
            options: updatedOptions,
          },
        };
      })
    );

    try {
      const updatedPost = await votePoll(postId, optionIndex, token);
      playSuccess();
      setPosts((current) =>
        current.map((post) => (post._id === postId ? updatedPost : post))
      );
    } catch (error) {
      loadPosts();
      setFlash({ type: "error", text: error.message });
    }
  }

  async function handleTogglePin(postId) {
    if (!requireAuth("Sign in to pin posts.")) {
      return;
    }

    playPop();
    setPosts((current) =>
      current.map((post) => {
        if (post._id !== postId) return post;
        return { ...post, isPinned: !post.isPinned };
      })
    );

    try {
      const updatedPost = await togglePinPost(postId, token);
      setPosts((current) =>
        current.map((post) => (post._id === postId ? updatedPost : post))
      );
      showNotice("success", updatedPost.isPinned ? "Post pinned to top of your profile." : "Post unpinned.");
    } catch (error) {
      loadPosts();
      showNotice("error", error.message);
    }
  }

  async function handleReportPost(postId, reason) {
    if (!requireAuth("Sign in to report inappropriate content.")) {
      return;
    }

    try {
      const res = await reportPost(postId, reason, token);
      showNotice("info", res.message || "Post reported for moderation review.");
    } catch (error) {
      showNotice("error", error.message || "Failed to submit report.");
    }
  }

  async function handleLike(postId) {
    if (!requireAuth("Log in to like posts.")) {
      return;
    }

    playPop();
    // Optimistic UI update for instant feedback
    setPosts((current) =>
      current.map((post) => {
        if (post._id !== postId) return post;
        const alreadyLiked = post.likes.some(
          (l) => String(l.userId) === String(currentUser?._id)
        );
        const newLikes = alreadyLiked
          ? post.likes.filter((l) => String(l.userId) !== String(currentUser?._id))
          : [
              {
                userId: currentUser?._id,
                username: currentUser?.name,
                handle: currentUser?.handle,
              },
              ...post.likes,
            ];
        return { ...post, likes: newLikes };
      })
    );

    try {
      const updatedPost = await toggleLikeOnPost(postId, token);
      setPosts((current) =>
        current.map((post) => (post._id === updatedPost._id ? updatedPost : post))
      );
    } catch (error) {
      loadPosts();
      setFlash({ type: "error", text: error.message });
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
      playSuccess();
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
      playDelete();
      setPosts((current) => current.filter((post) => post._id !== postId));
      setFlash({ type: "success", text: "Post deleted successfully." });
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
    if (!requireAuth("Log in to delete your comment.")) {
      return;
    }

    try {
      const updatedPost = await deleteComment(postId, commentId, token);
      playDelete();
      setPosts((current) => current.map((post) => (post._id === updatedPost._id ? updatedPost : post)));
      setFlash({ type: "success", text: "Comment deleted." });
    } catch (error) {
      setFlash({ type: "error", text: error.message });
    }
  }

  async function handleLikeComment(postId, commentId) {
    if (!requireAuth("Log in to like comments.")) {
      return;
    }

    playPop();
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
    if (!requireAuth("Log in to save posts.")) {
      return;
    }

    playPop();

    const currentSaved = currentUser?.savedPosts || [];
    const isAlreadySaved = currentSaved.some(
      (id) => String(id) === String(postId) || String(id?._id) === String(postId)
    );
    const optimisticSaved = isAlreadySaved
      ? currentSaved.filter((id) => String(id) !== String(postId) && String(id?._id) !== String(postId))
      : [postId, ...currentSaved];

    setCurrentUser((prev) => {
      if (!prev) return prev;
      return { ...prev, savedPosts: optimisticSaved };
    });

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
      setCurrentUser((prev) => (prev ? { ...prev, savedPosts: currentSaved } : prev));
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

  function handleToggleFeedDensity(mode) {
    playToggle();
    setFeedDensity(mode);
    localStorage.setItem("taskplanet-feed-density", mode);
    setFlash({
      type: "info",
      text: mode === "compact" ? "Switched to compact feed view." : "Switched to comfortable feed view.",
    });
  }

  function handleThemeToggle() {
    playToggle();
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

    if (item.label === "System Diagnostics") {
      setSystemCheckOpen(true);
      return;
    }

    if (item.label === "Activate Premium") {
      openFeatureDrawer("premium");
      return;
    }

    if (item.action === "export_bookmarks" || item.label === "Export Bookmarks") {
      const saved = posts.filter((p) => currentUser?.savedPosts?.includes(p._id));
      if (!saved.length) {
        showNotice("info", "No saved bookmarks found to export.");
        return;
      }
      exportBookmarksToJson(saved);
      showNotice("success", `Exported ${saved.length} bookmarks successfully!`);
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
    if (query.startsWith("#")) {
      const tag = query.slice(1);
      visiblePosts = visiblePosts.filter((post) =>
        (post.text || "").toLowerCase().includes(query) ||
        (post.text || "").toLowerCase().includes(`#${tag}`)
      );
    } else if (query.startsWith("@")) {
      const handle = query.slice(1);
      visiblePosts = visiblePosts.filter((post) =>
        post.authorHandle.toLowerCase().includes(handle) ||
        post.comments.some((c) => c.handle?.toLowerCase().includes(handle))
      );
    } else {
      visiblePosts = visiblePosts.filter((post) =>
        [post.authorName, post.authorHandle, post.text, post.comments.map((c) => c.username).join(" "), post.likes.map((l) => l.username).join(" ")]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }
  }

  if (feedFilter === "polls") {
    visiblePosts = visiblePosts.filter((post) => post.poll && Array.isArray(post.poll.options) && post.poll.options.length > 0);
  } else if (feedFilter === "media") {
    visiblePosts = visiblePosts.filter((post) => Boolean(post.imageUrl));
  } else if (feedFilter === "saved") {
    const savedIds = new Set(
      (currentUser?.savedPosts || []).map((p) => (p._id ? String(p._id) : String(p)))
    );
    visiblePosts = visiblePosts.filter((post) => savedIds.has(String(post._id)));
  } else if (feedFilter === "for-you") {
    const sortedForYou = [...visiblePosts].sort(
      (left, right) =>
        (Number(right.isPinned || false) - Number(left.isPinned || false)) ||
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
      (left, right) => (Number(right.isPinned || false) - Number(left.isPinned || false)) || new Date(right.createdAt) - new Date(left.createdAt)
    );
  }

  return (
    <div className={`app-shell ${themeMode === "night" ? "night-mode" : ""}`}>
      <a href="#main-feed" className="skip-to-content">
        Skip to main content
      </a>
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />

      <LeftRail activeNav={activeNav} onNavClick={handleNavClick} />

      <main className="main-stage" id="main-feed" role="main">
        {!isOnline && (
          <div
            className="offline-banner"
            style={{
              background: "#f59e0b",
              color: "#fff",
              padding: "8px 16px",
              borderRadius: "8px",
              marginBottom: "12px",
              fontSize: "13px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <AlertCircle size={16} />
            <span>You are currently offline. Feed is operating in offline mode.</span>
          </div>
        )}
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
          onSystemCheckOpen={() => setSystemCheckOpen(true)}
          onProfileMenuAction={handleProfileMenuAction}
          ownPostsCount={ownPosts.length}
        />

        {toasts.length > 0 && (
          <div
            className="toast-container"
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              zIndex: 9999,
              display: "flex",
              flexDirection: "column",
              gap: "10px",
              maxWidth: "380px",
              width: "100%",
              pointerEvents: "none",
            }}
          >
            {toasts.map((toast) => (
              <div
                key={toast.id}
                className={`notice notice-${toast.type || "info"}`}
                style={{
                  pointerEvents: "auto",
                  margin: 0,
                  boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  animation: "slideInRight 0.25s ease-out",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {toast.type === "success" && <CheckCircle2 size={18} color="#10b981" />}
                  {toast.type === "error" && <AlertCircle size={18} color="#ef4444" />}
                  {toast.type === "info" && <Info size={18} color="#3b82f6" />}
                  <span style={{ fontSize: "13px", fontWeight: 500 }}>{toast.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setToasts((cur) => cur.filter((t) => t.id !== toast.id))}
                  style={{
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    padding: "4px",
                    display: "flex",
                    opacity: 0.7,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

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
              feedDensity={feedDensity}
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
              onImageClick={(url) => setLightboxImage(url)}
              onLike={handleLike}
              onLikeComment={handleLikeComment}
              onNotify={showNotice}
              onPinPost={handleTogglePin}
              onPostTextChange={handlePostTextChange}
              onRemoveImage={removeSelectedImage}
              onReportPost={handleReportPost}
              onToggleComments={setExpandedPostId}
              onToggleFeedDensity={handleToggleFeedDensity}
              onVotePoll={handleVotePoll}
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

      {lightboxImage ? (
        <div
          className="modal-backdrop"
          onClick={() => setLightboxImage("")}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "relative",
              maxWidth: "90vw",
              maxHeight: "90vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={lightboxImage}
              alt="Full view"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: "12px",
                objectFit: "contain",
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
              }}
            />
            <button
              type="button"
              onClick={() => setLightboxImage("")}
              style={{
                position: "absolute",
                top: "-15px",
                right: "-15px",
                background: "#1e293b",
                color: "#fff",
                border: "2px solid #fff",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
          </div>
        </div>
      ) : null}

      <ActionModal modal={actionModal} onClose={() => setActionModal(null)} />
      <SystemCheckModal isOpen={systemCheckOpen} onClose={() => setSystemCheckOpen(false)} />
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

      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          title="Back to Top"
          style={{
            position: "fixed",
            bottom: "24px",
            right: "24px",
            zIndex: 90,
            width: "44px",
            height: "44px",
            borderRadius: "50%",
            background: "var(--primary, #3b82f6)",
            color: "#fff",
            border: "none",
            boxShadow: "0 8px 20px rgba(59, 130, 246, 0.4)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "transform 0.2s ease, opacity 0.2s ease",
            animation: "slideInRight 0.2s ease-out",
          }}
        >
          <ArrowUp size={20} />
        </button>
      )}
    </div>
  );
}

export default App;
