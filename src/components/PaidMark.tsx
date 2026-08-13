export function PaidMark({ paid }: { paid: boolean }) {
  if (paid) {
    return (
      <span
        className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-fairway text-cream"
        title="Paid"
        aria-label="Paid"
      >
        <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" aria-hidden="true">
          <path
            fill="currentColor"
            d="M7.7 14.3 3.9 10.5l1.4-1.4 2.4 2.4 6.9-6.9 1.4 1.4z"
          />
        </svg>
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-sm bg-danger/10 px-1.5 py-0.5 text-[10px] font-semibold tracking-[0.14em] text-danger uppercase">
      Unpaid
    </span>
  );
}
