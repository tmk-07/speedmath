export function Card({ children, className = "" }) {
  return <div className={`mm-card ${className}`}>{children}</div>;
}
