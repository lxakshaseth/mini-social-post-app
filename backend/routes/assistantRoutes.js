const express = require("express");
const { requestGroqChat } = require("../utils/aiClient");

const router = express.Router();

function buildProductContext(context = {}) {
  return [
    "TaskPlanet Social Desk product context:",
    `- Signed in user: ${context.userName || "Guest"}`,
    `- Handle: ${context.userHandle || "guest"}`,
    `- Posts created: ${context.ownPostsCount || 0}`,
    `- Likes received: ${context.starCount || 0}`,
    `- Unread notifications: ${context.unreadNotificationsCount || 0}`,
    `- Profile completion: ${context.profileCompletion || 0}%`,
    `- Average engagement: ${context.engagementRate || 0}`,
    `- Total comments across community: ${context.totalComments || 0}`,
    "- The product supports signup/login, text or image posts, public feed, likes, comments, notifications, profile menu, premium surfaces, and creator insights.",
  ].join("\n");
}

function buildFallbackSupportBrief(context = {}, issue = "") {
  const issueText = issue || "general platform help";
  const actions = [];
  const prompts = [];

  if ((context.unreadNotificationsCount || 0) > 0) {
    actions.push("Open Notifications and review the latest community reactions on your posts.");
    prompts.push("How do I manage my notifications professionally?");
  }

  if ((context.profileCompletion || 0) < 100) {
    actions.push("Complete your profile details and creator settings to improve trust signals.");
    prompts.push("What should I complete in my profile next?");
  }

  if ((context.ownPostsCount || 0) === 0) {
    actions.push("Create your first public post with a strong opener and one clear idea.");
    prompts.push("Help me write my first professional post.");
  } else {
    actions.push("Review recent posts, comments, and likes to identify what is driving engagement.");
    prompts.push("How can I improve engagement on my latest posts?");
  }

  actions.push("Use live support chat for step-by-step guidance on posting, premium, or account access.");
  prompts.push("Explain Premium and Premium Plus in simple terms.");
  prompts.push("How do likes, comments, and alerts work in this app?");

  return {
    summary: `TaskPlanet Care is running in smart fallback mode right now. For ${issueText}, start with account health, creator settings, and recent engagement checks while the live AI connection stabilizes.`,
    actions: actions.slice(0, 3),
    prompts: prompts.slice(0, 3),
    statusLabel: "Smart fallback",
    source: "fallback",
  };
}

function buildFallbackChatReply(messages = [], context = {}) {
  const latestUserMessage =
    [...messages].reverse().find((message) => message.role === "user")?.content?.trim() || "";
  const lowerMessage = latestUserMessage.toLowerCase();

  if (!latestUserMessage) {
    return "TaskPlanet Care is ready. Tell me whether you need help with posting, profile setup, notifications, or premium tools.";
  }

  if (lowerMessage.includes("post") || lowerMessage.includes("feed")) {
    return "For a professional post, lead with a clear hook, keep the message focused, and add one strong image when possible. After publishing, review comments and likes in Notifications to see which content is getting response.";
  }

  if (lowerMessage.includes("premium")) {
    return "Premium is best for visibility and promotion tools. Premium Plus is better when you want deeper creator insights, stronger support, and more advanced growth surfaces.";
  }

  if (
    lowerMessage.includes("login") ||
    lowerMessage.includes("sign") ||
    lowerMessage.includes("account") ||
    lowerMessage.includes("password")
  ) {
    return "For account issues, first confirm your email and password, then open Help and Support from the profile menu. If the database is reconnecting, account actions may pause briefly, but support guidance remains available.";
  }

  if (
    lowerMessage.includes("like") ||
    lowerMessage.includes("comment") ||
    lowerMessage.includes("notification") ||
    lowerMessage.includes("alert")
  ) {
    return "Likes and comments update your creator activity, and notifications surface those events in the right rail. A good next step is to review which posts are attracting the strongest reactions and respond quickly to comments.";
  }

  return `Here is the best next step for ${context.userName || "your"} account: describe the exact issue in one sentence, mention where it happens in the app, and then use Help Center or Chat to get guided resolution. I can help with posting, profile, notifications, or premium flows.`;
}

router.post("/support-brief", async (req, res) => {
  const context = req.body?.context || {};
  const issue = (req.body?.issue || "general platform help").trim();

  try {
    const content = await requestGroqChat({
      jsonMode: true,
      maxTokens: 600,
      messages: [
        {
          role: "system",
          content:
            "You are TaskPlanet Care, a concise but premium product support concierge inside a desktop social app. Respond only as valid JSON with keys: summary (string), actions (array of exactly 3 strings), prompts (array of exactly 3 strings), statusLabel (string). Keep it product-focused and practical.",
        },
        {
          role: "user",
          content: `${buildProductContext(context)}\n\nUser support issue: ${issue}\nCreate a professional support brief.`,
        },
      ],
    });

    const parsed = JSON.parse(content || "{}");

    return res.json({
      summary:
        parsed.summary ||
        "TaskPlanet Care is ready. Start with account access, posting, or notification guidance.",
      actions: Array.isArray(parsed.actions) ? parsed.actions.slice(0, 3) : [],
      prompts: Array.isArray(parsed.prompts) ? parsed.prompts.slice(0, 3) : [],
      statusLabel: parsed.statusLabel || "AI concierge ready",
      source: "groq",
    });
  } catch (error) {
    return res.json({
      ...buildFallbackSupportBrief(context, issue),
      warning: error.message || "Unable to generate support guidance right now.",
    });
  }
});

router.post("/chat", async (req, res) => {
  const context = req.body?.context || {};
  const incomingMessages = Array.isArray(req.body?.messages) ? req.body.messages : [];

  try {
    const safeMessages = incomingMessages
      .filter(
        (message) =>
          message &&
          typeof message.role === "string" &&
          typeof message.content === "string" &&
          ["user", "assistant"].includes(message.role)
      )
      .slice(-10);

    if (!safeMessages.length) {
      return res.status(400).json({ message: "At least one chat message is required." });
    }

    const content = await requestGroqChat({
      temperature: 0.45,
      maxTokens: 700,
      messages: [
        {
          role: "system",
          content:
            "You are TaskPlanet Care, a professional in-app support assistant. Help with account access, posting, likes, comments, premium, profile settings, and social engagement. Be clear, practical, and product-oriented. Keep replies concise but helpful, and suggest next steps when useful.",
        },
        {
          role: "system",
          content: buildProductContext(context),
        },
        ...safeMessages,
      ],
    });

    return res.json({
      reply: content || "TaskPlanet Care is ready to help.",
      source: "groq",
    });
  } catch (error) {
    return res.json({
      reply: buildFallbackChatReply(incomingMessages, context),
      source: "fallback",
      warning: error.message || "Unable to generate chat response right now.",
    });
  }
});

module.exports = router;
