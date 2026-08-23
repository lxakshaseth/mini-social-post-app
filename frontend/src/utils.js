const avatarPalette = ["#1b84ff", "#ff8a00", "#00a389", "#ef476f", "#6a4c93", "#118ab2"];

export const navigationItems = [
  { label: "Home", detail: "Community pulse" },
  { label: "Social", detail: "Live feed", active: true },
  { label: "Bookmarks", detail: "Saved posts" },
  { label: "Discover", detail: "Trending creators" },
];

export const feedFilters = [
  { id: "all", label: "All Posts" },
  { id: "saved", label: "Saved" },
  { id: "for-you", label: "For You" },
  { id: "most-liked", label: "Most Liked" },
  { id: "most-commented", label: "Most Commented" },
];

export const heroHighlights = [
  "Public community feed for every member",
  "Text-only, image-only, or mixed posts",
  "Instant likes and comments without refresh pain",
];

export const profileMenuItems = [
  {
    section: "Account",
    items: [
      {
        label: "My Profile",
        badge: "Get 800",
        description: "Review identity, stats, and creator status.",
      },
      {
        label: "Activate Premium",
        description: "Unlock better visibility and promotion tools.",
      },
      {
        label: "Activate Premium Plus",
        description: "Advanced growth, analytics, and priority support.",
      },
    ],
  },
  {
    section: "Support",
    items: [
      {
        label: "Help and Support",
        description: "Resolve account, posting, and notification issues.",
      },
      {
        label: "Chat with Us",
        accent: true,
        description: "Start a fast support conversation.",
      },
      {
        label: "Feedback",
        description: "Share product ideas and bug reports.",
      },
      {
        label: "FAQ",
        description: "Read common answers for the social experience.",
      },
      {
        label: "About",
        description: "Project stack, build notes, and release context.",
      },
    ],
  },
  {
    section: "Session",
    items: [
      {
        label: "Sign Out",
        action: "signout",
        description: "Securely end the current session.",
      },
    ],
  },
];

export function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("taskplanet-user") || "null");
  } catch (error) {
    return null;
  }
}

export function getInitials(name = "Guest") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function colorFromText(value = "guest") {
  const hash = value.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarPalette[hash % avatarPalette.length];
}

export function formatDate(value) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function relativeTime(value) {
  const date = new Date(value).getTime();
  const difference = Date.now() - date;
  const minutes = Math.floor(difference / 60000);

  if (minutes < 1) {
    return "Just now";
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export function engagementScore(post) {
  return post.likes.length * 2 + post.comments.length * 3 + (post.imageUrl ? 2 : 0);
}

export function extractTrendingTopics(posts) {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "you",
    "your",
    "with",
    "that",
    "this",
    "have",
    "from",
    "post",
    "just",
    "they",
    "their",
    "what",
    "when",
    "where",
    "would",
    "also",
    "there",
    "please",
    "good",
    "everyone",
  ]);

  const scores = new Map();

  posts.forEach((post) => {
    const text = `${post.text || ""} ${post.comments?.map((comment) => comment.text).join(" ") || ""}`
      .toLowerCase()
      .replace(/[^a-z0-9#\s]/g, " ");

    text.split(/\s+/).forEach((word) => {
      if (!word || word.length < 4 || stopWords.has(word)) {
        return;
      }

      scores.set(word, (scores.get(word) || 0) + 1);
    });
  });

  return [...scores.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5)
    .map(([topic]) => topic.startsWith("#") ? topic : `#${topic}`);
}
