export function Crest({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="32" cy="32" r="30" fill="#16352b" />
      <circle cx="32" cy="32" r="26" stroke="#b08d4a" strokeWidth="1.5" />
      <path
        d="M18 42c6-11 12-18 18-22"
        stroke="#e6d5a8"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path
        d="M22 44c8-14 16-20 24-22"
        stroke="#f4efe6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M36 14v22" stroke="#e6d5a8" strokeWidth="2" />
      <path d="M36 14l12 5-12 4" fill="#b08d4a" />
      <circle cx="32" cy="46" r="3" fill="#b08d4a" />
    </svg>
  );
}
