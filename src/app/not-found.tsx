import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <p className="text-[11px] tracking-[0.22em] text-gold uppercase">
        Lost ball
      </p>
      <h1 className="display mt-3 text-4xl text-pine">That page is not in play.</h1>
      <Link href="/" className="mt-6 inline-block text-fairway">
        Back to the clubhouse
      </Link>
    </div>
  );
}
