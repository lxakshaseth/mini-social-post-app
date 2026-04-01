import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  Bot,
  CheckCircle2,
  CreditCard,
  Crown,
  LifeBuoy,
  Lock,
  Mail,
  MessageCircleMore,
  Rocket,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  UserRound,
  X,
  Zap,
} from "lucide-react";
import { fetchSupportBrief, requestSupportChat } from "../api";
import Avatar from "./Avatar";
import { colorFromText } from "../utils";

const faqItems = [
  {
    id: "post",
    question: "How do I create a high-performing post?",
    answer:
      "Use a clear text hook, add an image when possible, and keep the message short enough to scan quickly in the public feed.",
  },
  {
    id: "engagement",
    question: "How are likes, comments, and alerts tracked?",
    answer:
      "The feed stores like usernames and comment usernames on each post, and the right rail surfaces those reactions as alerts for the signed-in creator.",
  },
  {
    id: "premium",
    question: "What changes when Premium is enabled?",
    answer:
      "Premium unlocks better promotion workflows, creator insights, and stronger support paths. In this demo, those flows are shown as professional product panels.",
  },
  {
    id: "security",
    question: "What security controls should exist in a professional app?",
    answer:
      "Session controls, JWT auth, secure sign-out, profile completion visibility, and access to help/support all help the product feel trustworthy.",
  },
];

function SectionCard({ title, subtitle, actionLabel, onAction, icon: Icon }) {
  return (
    <article className="drawer-section-card">
      <div className="drawer-section-icon">
        <Icon size={18} />
      </div>
      <div className="drawer-section-copy">
        <strong>{title}</strong>
        <p>{subtitle}</p>
      </div>
      {actionLabel ? (
        <button type="button" className="drawer-inline-action" onClick={onAction}>
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}

function FeatureDrawer({
  drawer,
  currentUser,
  ownPostsCount,
  starCount,
  unreadNotificationsCount,
  profileCompletion,
  engagementRate,
  totalComments,
  walletValue,
  onClose,
  onOpenView,
  onSignOut,
  onNotify,
}) {
  const [openFaqId, setOpenFaqId] = useState("post");
  const [feedbackRating, setFeedbackRating] = useState(4);
  const [feedbackCategory, setFeedbackCategory] = useState("Product");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [supportLoading, setSupportLoading] = useState(false);
  const [supportBrief, setSupportBrief] = useState(null);
  const supportRequestKeyRef = useRef("");
  const [chatMessages, setChatMessages] = useState([
    {
      id: 1,
      role: "agent",
      text: "Hi, this is TaskPlanet Care. Tell us what you need help with and we will guide you quickly.",
    },
    {
      id: 2,
      role: "agent",
      text: "You can ask about posting, account access, premium tools, or social feed engagement.",
    },
  ]);

  const titleMap = useMemo(
    () => ({
      profile: {
        eyebrow: "Account",
        title: "Profile Workspace",
        subtitle: "Manage identity, creator standing, and account controls from one place.",
      },
      premium: {
        eyebrow: "Upgrade",
        title: "Premium Plans",
        subtitle: "Professional growth features, promotion tools, and better creator visibility.",
      },
      premiumPlus: {
        eyebrow: "Growth",
        title: "Premium Plus Suite",
        subtitle: "Advanced creator operations for serious reach, analytics, and monetization.",
      },
      support: {
        eyebrow: "Support",
        title: "Help Center",
        subtitle: "Access support routes, issue handling, and product guidance.",
      },
      chat: {
        eyebrow: "Live Support",
        title: "Support Conversation",
        subtitle: "A real application-like support space for quick product help.",
      },
      feedback: {
        eyebrow: "Product Feedback",
        title: "Share Feedback",
        subtitle: "Send structured product feedback like a polished production application.",
      },
      faq: {
        eyebrow: "Knowledge Base",
        title: "FAQ Library",
        subtitle: "Answers to the most common questions about the social platform.",
      },
      about: {
        eyebrow: "Product",
        title: "About This Build",
        subtitle: "Architecture, UI system, and the professional features added in this version.",
      },
      session: {
        eyebrow: "Security",
        title: "Session Controls",
        subtitle: "Review secure session actions and sign out with confidence.",
      },
    }),
    []
  );

  const assistantContext = {
    userName: currentUser?.name || "Guest User",
    userHandle: currentUser?.handle || "guest",
    ownPostsCount,
    starCount,
    unreadNotificationsCount,
    profileCompletion,
    engagementRate,
    totalComments,
  };

  const supportRequestKey = useMemo(
    () =>
      JSON.stringify({
        view: drawer?.view || "",
        userName: assistantContext.userName,
        userHandle: assistantContext.userHandle,
        ownPostsCount: assistantContext.ownPostsCount,
        starCount: assistantContext.starCount,
        unreadNotificationsCount: assistantContext.unreadNotificationsCount,
        profileCompletion: assistantContext.profileCompletion,
        engagementRate: assistantContext.engagementRate,
        totalComments: assistantContext.totalComments,
      }),
    [
      assistantContext.engagementRate,
      assistantContext.ownPostsCount,
      assistantContext.profileCompletion,
      assistantContext.starCount,
      assistantContext.totalComments,
      assistantContext.unreadNotificationsCount,
      assistantContext.userHandle,
      assistantContext.userName,
      drawer?.view,
    ]
  );

  const drawerView = drawer?.view || "";
  const details =
    titleMap[drawerView] || {
      eyebrow: "Workspace",
      title: "Feature Panel",
      subtitle: "Professional support workspace",
    };

  useEffect(() => {
    if (drawerView !== "support") {
      supportRequestKeyRef.current = "";
    }
  }, [drawerView]);

  useEffect(() => {
    if (drawerView !== "support") {
      return;
    }

    if (supportRequestKeyRef.current === supportRequestKey) {
      return;
    }

    let ignore = false;

    async function loadSupportBrief() {
      try {
        setSupportLoading(true);
        const data = await fetchSupportBrief({
          issue: "account support and product guidance",
          context: assistantContext,
        });

        if (!ignore) {
          supportRequestKeyRef.current = supportRequestKey;
          setSupportBrief(data);
        }
      } catch (error) {
        if (!ignore) {
          supportRequestKeyRef.current = supportRequestKey;
          setSupportBrief({
            summary:
              "Help Center is available in fallback mode. You can still review support options and open live chat while the AI connection stabilizes.",
            actions: [
              "Open live chat and describe the issue in one short sentence.",
              "Review posting, account, and notification guidance from the support options below.",
              "Retry in a moment if you want a fresh AI-generated support brief.",
            ],
            prompts: [
              "How do I improve my post quality?",
              "How can I manage notifications better?",
              "Explain the premium options.",
            ],
            statusLabel: "Offline fallback",
            source: "client-fallback",
          });
          onNotify?.("info", "Live support briefly disconnected. Fallback guidance is ready.");
        }
      } finally {
        if (!ignore) {
          setSupportLoading(false);
        }
      }
    }

    loadSupportBrief();

    return () => {
      ignore = true;
    };
  }, [
    drawerView,
    onNotify,
    supportRequestKey,
  ]);

  useEffect(() => {
    if (drawerView === "chat" && drawer?.prompt) {
      setChatInput(drawer.prompt);
    }
  }, [drawer?.prompt, drawerView]);

  if (!drawer) {
    return null;
  }

  async function handleSendChat(messageOverride) {
    const messageToSend = (messageOverride || chatInput).trim();

    if (!messageToSend || chatLoading) {
      return;
    }

    const nextMessages = [
      ...chatMessages,
      { id: chatMessages.length + 1, role: "user", text: messageToSend },
    ];

    setChatMessages(nextMessages);
    setChatInput("");
    setChatLoading(true);

    try {
      const response = await requestSupportChat({
        context: assistantContext,
        messages: nextMessages.map((message) => ({
          role: message.role === "agent" ? "assistant" : "user",
          content: message.text,
        })),
      });

      setChatMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          role: "agent",
          text: response.reply || "TaskPlanet Care is ready to help.",
        },
      ]);
    } catch (error) {
      setChatMessages((current) => [
        ...current,
        {
          id: current.length + 1,
          role: "agent",
          text: "I could not reach the support AI right now. Please try again in a moment.",
        },
      ]);
      onNotify?.("error", error.message);
    } finally {
      setChatLoading(false);
    }
  }

  function handleSuggestedPrompt(prompt) {
    onOpenView?.("chat", { prompt });
  }

  function handleSendChatLegacy() {
    const trimmed = chatInput.trim();

    if (!trimmed) {
      return;
    }
    handleSendChat(trimmed);
  }

  function handleFeedbackSubmit() {
    if (!feedbackMessage.trim()) {
      onNotify?.("error", "Write feedback before submitting.");
      return;
    }

    setFeedbackMessage("");
    onNotify?.("success", `Feedback sent for ${feedbackCategory.toLowerCase()} improvements.`);
  }

  function renderBody() {
    if (drawerView === "profile") {
      return (
        <>
          <section className="drawer-hero-card">
            <Avatar
              name={currentUser?.name || "Guest User"}
              color={currentUser?.avatarColor || colorFromText("guest")}
            />
            <div className="drawer-hero-copy">
              <div className="drawer-hero-title-row">
                <strong>{currentUser?.name || "Guest User"}</strong>
                <span className="verified-pill">
                  <BadgeCheck size={14} />
                  Active creator
                </span>
              </div>
              <p>{currentUser ? `@${currentUser.handle}` : "Public browsing mode"}</p>
              <small>{currentUser?.email || "Create an account to unlock creator tools"}</small>
            </div>
          </section>

          <div className="drawer-stat-grid">
            <div>
              <strong>{ownPostsCount}</strong>
              <span>Posts</span>
            </div>
            <div>
              <strong>{starCount}</strong>
              <span>Likes</span>
            </div>
            <div>
              <strong>{unreadNotificationsCount}</strong>
              <span>Alerts</span>
            </div>
            <div>
              <strong>{profileCompletion}%</strong>
              <span>Completion</span>
            </div>
          </div>

          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Creator controls</h3>
              <button
                type="button"
                className="drawer-inline-action"
                onClick={() => onNotify?.("info", "Profile editor can be connected next.")}
              >
                Edit profile
              </button>
            </div>

            <div className="drawer-section-list">
              <SectionCard
                icon={UserRound}
                title="Profile appearance"
                subtitle="Update avatar style, public name treatment, and visual creator identity."
                actionLabel="Open"
                onAction={() => onNotify?.("info", "Appearance settings ready for integration.")}
              />
              <SectionCard
                icon={ShieldCheck}
                title="Trust and verification"
                subtitle="Monitor account standing, profile completion, and professional trust signals."
                actionLabel="Review"
                onAction={() => onNotify?.("success", "Trust checklist opened.")}
              />
              <SectionCard
                icon={Bell}
                title="Alert preferences"
                subtitle="Decide which engagement events should surface as creator notifications."
                actionLabel="Manage"
                onAction={() => onNotify?.("info", "Notification preferences panel is ready.")}
              />
            </div>
          </section>

          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Creator performance</h3>
            </div>
            <div className="drawer-performance-card">
              <div className="profile-health-row">
                <span>Average engagement per post</span>
                <strong>{engagementRate}</strong>
              </div>
              <div className="profile-health-row compact">
                <span>Total community comments handled</span>
                <strong>{totalComments}</strong>
              </div>
              <div className="profile-health-row compact">
                <span>Estimated creator wallet</span>
                <strong>INR {walletValue}</strong>
              </div>
            </div>
          </section>
        </>
      );
    }

    if (drawerView === "premium" || drawerView === "premiumPlus") {
      return (
        <>
          <section className="drawer-plan-grid">
            <article className={`plan-card ${drawerView === "premium" ? "featured" : ""}`}>
              <div className="plan-head">
                <div>
                  <p className="eyebrow">Premium</p>
                  <h3>Creator Growth</h3>
                </div>
                <span className="plan-price">INR 299/mo</span>
              </div>
              <ul className="plan-list">
                <li>Priority placement in discovery sections</li>
                <li>Advanced promotion workflow for image posts</li>
                <li>Expanded creator stats and engagement overview</li>
              </ul>
              <button
                type="button"
                className="primary-action wide"
                onClick={() => onNotify?.("success", "Premium trial started in demo mode.")}
              >
                Start trial
              </button>
            </article>

            <article className={`plan-card ${drawerView === "premiumPlus" ? "featured" : ""}`}>
              <div className="plan-head">
                <div>
                  <p className="eyebrow">Premium Plus</p>
                  <h3>Scale Suite</h3>
                </div>
                <span className="plan-price">INR 699/mo</span>
              </div>
              <ul className="plan-list">
                <li>Audience-level insight panels and creator health tracking</li>
                <li>Priority support and advanced monetization placeholders</li>
                <li>More powerful content operations and premium workspace controls</li>
              </ul>
              <button
                type="button"
                className="primary-action wide"
                onClick={() => onNotify?.("success", "Premium Plus checkout opened in demo mode.")}
              >
                Upgrade now
              </button>
            </article>
          </section>

          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Professional value</h3>
            </div>
            <div className="drawer-section-list">
              <SectionCard
                icon={Rocket}
                title="Promotion controls"
                subtitle="Move from static posting to growth-focused promotion workflows."
              />
              <SectionCard
                icon={Crown}
                title="Creator credibility"
                subtitle="Show premium signals through profile, analytics, and support quality."
              />
              <SectionCard
                icon={CreditCard}
                title="Billing-ready structure"
                subtitle="UI now behaves like a real subscription surface, ready for payment integration."
              />
            </div>
          </section>
        </>
      );
    }

    if (drawerView === "support") {
      return (
        <>
          <section className="support-brief-card">
            <div className="support-brief-head">
              <div>
                <p className="eyebrow">AI Concierge</p>
                <h3>TaskPlanet Care</h3>
              </div>
              <span className="verified-pill">
                <Sparkles size={14} />
                {supportBrief?.statusLabel || "Groq connected"}
              </span>
            </div>

            <p className="support-brief-copy">
              {supportLoading
                ? "Preparing tailored support guidance for your current account and product state..."
                : supportBrief?.summary ||
                  "AI-powered support guidance will appear here once the assistant responds."}
            </p>

            {supportBrief?.actions?.length ? (
              <div className="support-action-list">
                {supportBrief.actions.map((action) => (
                  <div key={action} className="modal-point">
                    {action}
                  </div>
                ))}
              </div>
            ) : null}

            {supportBrief?.prompts?.length ? (
              <div className="support-prompt-list">
                {supportBrief.prompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="trend-chip"
                    onClick={() => handleSuggestedPrompt(prompt)}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : null}
          </section>

          <section className="drawer-section-list">
            <SectionCard
              icon={LifeBuoy}
              title="Account recovery"
              subtitle="Resolve sign-in or email issues with a guided support path."
              actionLabel="Open"
              onAction={() => onNotify?.("info", "Recovery assistant opened.")}
            />
            <SectionCard
              icon={MessageCircleMore}
              title="Live chat support"
              subtitle="Talk to support for help with posting, reactions, and profile setup."
              actionLabel="Chat"
              onAction={() => onOpenView?.("chat")}
            />
            <SectionCard
              icon={Bot}
              title="Smart help suggestions"
              subtitle="Get product help based on the feature you are currently using."
              actionLabel="Suggest"
              onAction={() =>
                onNotify?.(
                  "success",
                  supportBrief?.summary || "AI support summary already loaded in this panel."
                )
              }
            />
          </section>

          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Support status</h3>
            </div>
            <div className="drawer-status-grid">
              <div className="drawer-status-item">
                <strong>Normal</strong>
                <span>Platform health</span>
              </div>
              <div className="drawer-status-item">
                <strong>&lt; 2 hrs</strong>
                <span>Response target</span>
              </div>
              <div className="drawer-status-item">
                <strong>24/7</strong>
                <span>Knowledge base</span>
              </div>
            </div>
          </section>
        </>
      );
    }

    if (drawerView === "chat") {
      return (
        <>
          <section className="support-brief-card compact">
            <div className="support-brief-head">
              <div>
                <p className="eyebrow">AI Support</p>
                <h3>Groq-powered TaskPlanet Care</h3>
              </div>
              <span className="verified-pill">
                <Sparkles size={14} />
                Live
              </span>
            </div>
            <p className="support-brief-copy">
              Ask about posts, profile setup, premium, creator growth, comments, alerts, or feed behavior.
            </p>
          </section>

          <section className="chat-thread">
            {chatMessages.map((message) => (
              <div key={message.id} className={`chat-bubble ${message.role}`}>
                {message.text}
              </div>
            ))}
            {chatLoading ? <div className="chat-bubble agent">TaskPlanet Care is thinking...</div> : null}
          </section>

          <div className="chat-composer">
            <input
              type="text"
              value={chatInput}
              onChange={(event) => setChatInput(event.target.value)}
              placeholder="Describe your issue or question"
            />
            <button type="button" className="primary-action" onClick={handleSendChatLegacy} disabled={chatLoading}>
              <Send size={16} />
              <span>{chatLoading ? "Sending..." : "Send"}</span>
            </button>
          </div>
        </>
      );
    }

    if (drawerView === "feedback") {
      const categories = ["Product", "Bug", "Design", "Performance"];

      return (
        <>
          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>How was your experience?</h3>
            </div>

            <div className="rating-row">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  className={`rating-chip ${feedbackRating === value ? "active" : ""}`}
                  onClick={() => setFeedbackRating(value)}
                >
                  <Star size={16} />
                  <span>{value}</span>
                </button>
              ))}
            </div>

            <div className="category-row">
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`filter-chip ${feedbackCategory === category ? "active" : ""}`}
                  onClick={() => setFeedbackCategory(category)}
                >
                  {category}
                </button>
              ))}
            </div>

            <textarea
              className="drawer-textarea"
              value={feedbackMessage}
              onChange={(event) => setFeedbackMessage(event.target.value)}
              placeholder="Share product feedback, bug details, or design suggestions"
            />

            <button type="button" className="primary-action wide" onClick={handleFeedbackSubmit}>
              Submit feedback
            </button>
          </section>
        </>
      );
    }

    if (drawerView === "faq") {
      return (
        <section className="drawer-faq-list">
          {faqItems.map((item) => (
            <article
              key={item.id}
              className={`faq-card ${openFaqId === item.id ? "open" : ""}`}
            >
              <button
                type="button"
                className="faq-trigger"
                onClick={() => setOpenFaqId((current) => (current === item.id ? "" : item.id))}
              >
                <span>{item.question}</span>
                <ArrowRight size={16} />
              </button>
              {openFaqId === item.id ? <p>{item.answer}</p> : null}
            </article>
          ))}
        </section>
      );
    }

    if (drawerView === "about") {
      return (
        <>
          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Product summary</h3>
            </div>
            <div className="drawer-section-list">
              <SectionCard
                icon={CheckCircle2}
                title="Desktop-first social product"
                subtitle="Inspired by TaskPlanet, but upgraded into a richer professional web experience."
              />
              <SectionCard
                icon={Zap}
                title="Professional UX features"
                subtitle="Persistent theme, draft autosave, keyboard shortcuts, grouped account surfaces, and creator insights."
              />
              <SectionCard
                icon={Lock}
                title="Assignment-compatible architecture"
                subtitle="React frontend, Express backend, MongoDB, auth, public feed, likes, comments, and clean separation of concerns."
              />
            </div>
          </section>

          <section className="drawer-block">
            <div className="drawer-block-head">
              <h3>Stack</h3>
            </div>
            <div className="trending-strip">
              <span className="trend-chip">React</span>
              <span className="trend-chip">Vite</span>
              <span className="trend-chip">Express</span>
              <span className="trend-chip">MongoDB</span>
              <span className="trend-chip">JWT Auth</span>
              <span className="trend-chip">Custom CSS</span>
            </div>
          </section>
        </>
      );
    }

    return (
      <>
        <section className="drawer-section-list">
          <SectionCard
            icon={ShieldCheck}
            title="Current session"
            subtitle="Signed in with JWT-based authentication and a secure local session state."
          />
          <SectionCard
            icon={Mail}
            title="Clear local preferences"
            subtitle="Reset saved theme and draft preferences to default values."
            actionLabel="Reset"
            onAction={() => onNotify?.("info", "Local preferences can be reset in the next backend step.")}
          />
        </section>

        <button type="button" className="secondary-action wide" onClick={onSignOut}>
          Sign out now
        </button>
      </>
    );
  }

  return (
    <div className="feature-drawer-backdrop" onClick={onClose}>
      <aside className="feature-drawer card" onClick={(event) => event.stopPropagation()}>
        <div className="feature-drawer-header">
          <div>
            <p className="eyebrow">{details.eyebrow}</p>
            <h2>{details.title}</h2>
            <p className="feature-drawer-subtitle">{details.subtitle}</p>
          </div>
          <button type="button" className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="feature-drawer-body">{renderBody()}</div>
      </aside>
    </div>
  );
}

export default FeatureDrawer;
