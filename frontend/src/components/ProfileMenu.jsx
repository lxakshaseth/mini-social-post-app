import {
  BadgeCheck,
  CircleHelp,
  Info,
  LogOut,
  MessageCircleMore,
  MessageSquare,
  Rocket,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Avatar from "./Avatar";
import { colorFromText, profileMenuItems } from "../utils";

const iconMap = {
  "My Profile": UserRound,
  "Activate Premium": Rocket,
  "Activate Premium Plus": Sparkles,
  "Help and Support": CircleHelp,
  "Chat with Us": MessageCircleMore,
  Feedback: MessageSquare,
  FAQ: CircleHelp,
  About: Info,
  "Sign Out": LogOut,
};

function ProfileMenu({
  currentUser,
  onProfileMenuAction,
  ownPostsCount,
  starCount,
  unreadNotificationsCount,
}) {
  return (
    <div className="profile-menu card">
      <div className="profile-menu-header">
        <Avatar
          name={currentUser?.name || "Guest User"}
          color={currentUser?.avatarColor || colorFromText("guest")}
        />
        <div className="profile-menu-copy">
          <div className="profile-menu-title-row">
            <strong>{currentUser?.name || "Guest User"}</strong>
            <span className="verified-pill">
              <BadgeCheck size={14} />
              Active
            </span>
          </div>
          <p>{currentUser ? `@${currentUser.handle}` : "Sign in to unlock all actions"}</p>
          <small>{currentUser?.email || "Public browsing mode enabled"}</small>
          {currentUser?.bio && (
            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "var(--muted, #64748b)" }}>
              {currentUser.bio}
            </p>
          )}
          {currentUser?.createdAt && (
            <div style={{ marginTop: "4px", fontSize: "11px", color: "var(--muted, #94a3b8)" }}>
              Member since {new Date(currentUser.createdAt).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
            </div>
          )}
        </div>
      </div>

      <div className="profile-menu-stats">
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
      </div>

      {profileMenuItems.map((group) => (
        <div key={group.section} className="profile-menu-group">
          <div className="profile-menu-group-label">{group.section}</div>

          {group.items.map((item) => {
            const Icon = iconMap[item.label];

            return (
              <button
                key={item.label}
                type="button"
                className={`menu-item ${item.accent ? "accent" : ""}`}
                onClick={() => onProfileMenuAction(item)}
              >
                <span className="menu-label">
                  <span className="menu-icon-shell">
                    <Icon size={18} />
                  </span>
                  <span className="menu-text">
                    <strong>{item.label}</strong>
                    <small>{item.description}</small>
                  </span>
                </span>
                {item.badge ? <span className="menu-badge">{item.badge}</span> : null}
              </button>
            );
          })}
        </div>
      ))}

      <div className="profile-menu-footer">
        <ShieldCheck size={16} />
        <span>Secure session. Keyboard shortcut `/` focuses search, `Esc` closes open overlays.</span>
      </div>
    </div>
  );
}

export default ProfileMenu;

