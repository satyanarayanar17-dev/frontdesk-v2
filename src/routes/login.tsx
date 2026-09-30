import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { friendlyError, getSupabase, isOwnerEmail } from "@/lib/supabase";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Owner login — FrontDesk AI for Trades" },
      { name: "description", content: "Owner sign-in for the FrontDesk operations dashboard." },
      { property: "og:title", content: "Owner login — FrontDesk AI for Trades" },
      { property: "og:description", content: "Owner sign-in for the FrontDesk operations dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSupabase().auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard/leads", replace: true });
    });
  }, [navigate]);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (state === "sending") return;
    setError(null);
    if (!isOwnerEmail(email)) {
      setError("This email isn't registered as an owner account.");
      return;
    }
    setState("sending");
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: { emailRedirectTo: `${window.location.origin}/dashboard/leads`, shouldCreateUser: true },
    });
    if (error) {
      setError(friendlyError(error));
      setState("idle");
    } else setState("sent");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <Link to="/" className="text-sm font-bold tracking-tight">
          FrontDesk <span className="font-medium text-muted-foreground">for Trades</span>
        </Link>
        <h1 className="mt-6 text-xl font-semibold">Owner sign-in</h1>
        {state === "sent" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Check <strong className="text-foreground">{email}</strong> for a sign-in link. You can close this tab.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 space-y-3">
            <p className="text-sm text-muted-foreground">We'll email you a one-time sign-in link.</p>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
            />
            {error && <p className="text-xs text-destructive" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={state === "sending"}
              className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {state === "sending" ? "Sending…" : "Send sign-in link"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}