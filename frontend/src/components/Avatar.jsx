import { colorFromText, getInitials } from "../utils";

function Avatar({ name, color, size = "md" }) {
  return (
    <div className={`avatar avatar-${size}`} style={{ background: color || colorFromText(name) }}>
      <span>{getInitials(name)}</span>
    </div>
  );
}

export default Avatar;

