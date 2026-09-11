import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <h1 className="text-4xl font-black text-gold-400">404</h1>
      <p className="text-parchment/70">This page doesn't exist.</p>
      <Link to="/dashboard" className="rounded-md bg-gold-500 px-5 py-2.5 font-bold text-charcoal-950 hover:bg-gold-400">
        Back to Dashboard
      </Link>
    </div>
  );
}
