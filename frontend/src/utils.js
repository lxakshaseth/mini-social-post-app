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
        label: "System Diagnostics",
        accent: true,
        description: "Live health check of API, DB, memory & uptime.",
      },
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

export function compressImage(file, maxWidth = 1400, quality = 0.85) {
  return new Promise((resolve) => {
    // If not an image or SVG/GIF, return as-is
    if (!file || !file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob || blob.size >= file.size) {
              resolve(file); // if compression didn't save space, return original
            } else {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            }
          },
          file.type,
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
}

import React from "react";

export function highlightText(text, query) {
  if (!text) return "";
  if (!query || !query.trim()) return text;

  const escapedQuery = query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = text.split(new RegExp(`(${escapedQuery})`, "gi"));

  return parts.map((part, index) =>
    part.toLowerCase() === query.trim().toLowerCase()
      ? React.createElement(
          "mark",
          {
            key: index,
            style: {
              backgroundColor: "#fde047",
              color: "#0f172a",
              padding: "0 2px",
              borderRadius: "2px",
            },
          },
          part
        )
      : part
  );
}
