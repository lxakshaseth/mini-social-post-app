const avatarPalette = ["#1b84ff", "#ff8a00", "#00a389", "#ef476f", "#6a4c93", "#118ab2"];

export const navigationItems = [
  { label: "Home", detail: "Community pulse" },
  { label: "Social", detail: "Live feed", active: true },
  { label: "Bookmarks", detail: "Saved posts" },
  { label: "Discover", detail: "Trending creators" },
];

export const feedFilters = [
  { id: "all", label: "All Posts" },
  { id: "polls", label: "Polls" },
  { id: "media", label: "Media" },
  { id: "saved", label: "Saved" },
  { id: "for-you", label: "For You" },
  { id: "most-liked", label: "Most Liked" },
  { id: "most-commented", label: "Most Discussed" },
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
  return (post.likes?.length || 0) * 2 + (post.comments?.length || 0) * 3 + (post.imageUrl ? 2 : 0);
}

export function calculateEngagementRate(post) {
  if (!post) return 0;
  const interactions = (post.likes?.length || 0) + (post.comments?.length || 0) * 2 + (post.poll?.options?.reduce((sum, o) => sum + (o.votes?.length || 0), 0) || 0);
  const views = Math.max(post.viewsCount || 1, 1);
  return Math.min(100, Math.round((interactions / views) * 100));
}

export function isTrendingPost(post) {
  if (!post) return false;
  const score = engagementScore(post);
  return score >= 6 || (post.likes?.length >= 3) || (post.comments?.length >= 2);
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

export function downloadPostCardImage(post) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const width = 800;
      const height = 500;
      canvas.width = width;
      canvas.height = height;

      // Draw Gradient Background
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0f172a");
      gradient.addColorStop(0.5, "#1e293b");
      gradient.addColorStop(1, "#0284c7");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Card Container
      ctx.fillStyle = "rgba(255, 255, 255, 0.96)";
      ctx.beginPath();
      const cardX = 40, cardY = 40, cardW = 720, cardH = 420, radius = 18;
      ctx.roundRect(cardX, cardY, cardW, cardH, radius);
      ctx.fill();

      // Brand Ribbon
      ctx.fillStyle = "#1b84ff";
      ctx.font = "bold 13px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      ctx.fillText("TASKPLANET SOCIAL POST", cardX + 28, cardY + 40);

      // Author Avatar Circle
      const avatarX = cardX + 48;
      const avatarY = cardY + 80;
      ctx.beginPath();
      ctx.arc(avatarX, avatarY, 24, 0, Math.PI * 2);
      ctx.fillStyle = post.authorAvatarColor || "#1b84ff";
      ctx.fill();

      // Author Initials
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const initials = (post.authorName || "U")
        .split(" ")
        .map((p) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
      ctx.fillText(initials, avatarX, avatarY);

      // Author Name & Handle
      ctx.textAlign = "left";
      ctx.textBaseline = "alphabetic";
      ctx.fillStyle = "#0f172a";
      ctx.font = "bold 18px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(post.authorName || "Member", avatarX + 38, avatarY - 4);

      ctx.fillStyle = "#64748b";
      ctx.font = "14px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText(`@${post.authorHandle || "user"} · ${formatDate(post.createdAt || new Date())}`, avatarX + 38, avatarY + 16);

      // Post Text / Content (Word Wrapping)
      const postContent = post.text || (post.imageUrl ? "[Attached Image Post]" : "Community post");
      ctx.fillStyle = "#1e293b";
      ctx.font = "17px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
      const maxWidth = 640;
      const lineHeight = 26;
      const startX = cardX + 28;
      let startY = cardY + 145;

      const words = postContent.split(" ");
      let currentLine = "";
      let linesCount = 0;

      for (let i = 0; i < words.length; i++) {
        const testLine = currentLine + words[i] + " ";
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && i > 0) {
          ctx.fillText(currentLine, startX, startY);
          currentLine = words[i] + " ";
          startY += lineHeight;
          linesCount++;
          if (linesCount >= 6) {
            ctx.fillText(currentLine + "...", startX, startY);
            break;
          }
        } else {
          currentLine = testLine;
        }
      }
      if (linesCount < 6) {
        ctx.fillText(currentLine, startX, startY);
      }

      // Bottom Metrics Strip
      const bottomY = cardY + cardH - 30;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "600 13px -apple-system, BlinkMacSystemFont, sans-serif";
      const likesCount = post.likes?.length || 0;
      const commentsCount = post.comments?.length || 0;
      const views = post.viewsCount || 0;
      ctx.fillText(
        `❤️ ${likesCount} Likes   💬 ${commentsCount} Comments   👁️ ${views} Views`,
        cardX + 28,
        bottomY
      );

      // Footer Watermark
      ctx.textAlign = "right";
      ctx.fillStyle = "#cbd5e1";
      ctx.font = "12px -apple-system, BlinkMacSystemFont, sans-serif";
      ctx.fillText("taskplanet.app", cardX + cardW - 28, bottomY);

      // Trigger Download
      const dataUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `taskplanet-post-${post._id || Date.now()}.png`;
      downloadLink.href = dataUrl;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      resolve(true);
    } catch (err) {
      reject(err);
    }
  });
}

export function calculateReadingTime(text = "") {
  if (!text || typeof text !== "string") return "";
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  if (words < 25) return "";
  const minutes = Math.ceil(words / 180);
  return minutes <= 1 ? "< 1 min read" : `${minutes} min read`;
}

