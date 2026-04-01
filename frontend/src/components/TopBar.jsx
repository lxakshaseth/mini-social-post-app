import {
  Bell,
  MoonStar,
  Search,
  Star,
  Wallet,
} from "lucide-react";
import Avatar from "./Avatar";
import ProfileMenu from "./ProfileMenu";
import { colorFromText } from "../utils";

function TopBar({
  currentUser,
  menuOpen,
  onToggleMenu,
  profileDropdownRef,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  searchInputRef,
  onThemeToggle,
  themeMode,
  starCount,
  onStarOpen,
  walletValue,
  onWalletOpen,
  unreadNotificationsCount,
  onNotificationOpen,
  onProfileMenuAction,
  ownPostsCount,
}) {
  return (
    <header className="topbar">
      <div>
        <p className="eyebrow">Assignment-ready social experience</p>
        <h1>Social</h1>
      </div>

      <div className="topbar-controls">
        <label className="search-shell">
          <Search size={18} />
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search promotions, users, posts..."
          />
        </label>

        <button type="button" className="icon-circle icon-circle-primary" onClick={onSearchSubmit}>
          <Search size={18} />
        </button>

        <button
          type="button"
          className={`icon-circle icon-circle-muted ${themeMode === "night" ? "is-active" : ""}`}
          onClick={onThemeToggle}
        >
          <MoonStar size={18} />
        </button>

        <button type="button" className="status-chip" onClick={onStarOpen}>
          <Star size={16} />
          <span>{starCount}</span>
        </button>

        <button type="button" className="status-chip money-chip" onClick={onWalletOpen}>
          <Wallet size={16} />
          <span>INR {walletValue}</span>
        </button>

        <button
          type="button"
          className="icon-circle notification-button"
          onClick={onNotificationOpen}
        >
          <Bell size={18} />
          {unreadNotificationsCount > 0 ? (
            <span className="badge-count">{unreadNotificationsCount}</span>
          ) : null}
        </button>

        <div ref={profileDropdownRef} className="profile-dropdown">
          <button type="button" className="profile-trigger" onClick={onToggleMenu}>
            <Avatar
              name={currentUser?.name || "Guest User"}
              color={currentUser?.avatarColor || colorFromText("guest")}
              size="sm"
            />
          </button>

          {menuOpen ? (
            <ProfileMenu
              currentUser={currentUser}
              onProfileMenuAction={onProfileMenuAction}
              ownPostsCount={ownPostsCount}
              starCount={starCount}
              unreadNotificationsCount={unreadNotificationsCount}
            />
          ) : null}
        </div>
      </div>
    </header>
  );
}

export default TopBar;
