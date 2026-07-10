export function Button({ children, onClick, variant = "ghost", icon: Icon, type = "button", disabled, full }) {
  return (
    <button
      type={type}
      className={`mm-btn mm-btn-${variant}${full ? " mm-btn-full" : ""}`}
      onClick={onClick}
      disabled={disabled}
    >
      {Icon ? <Icon size={16} strokeWidth={2.25} /> : null}
      <span>{children}</span>
    </button>
  );
}
