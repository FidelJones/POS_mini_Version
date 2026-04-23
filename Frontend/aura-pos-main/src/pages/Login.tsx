import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, BarChart3, Clock3, LockKeyhole, ShieldCheck, Sparkles, TrendingUp, Users } from "lucide-react";
import { API_BASE, formatCurrency, usePOS } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type DashboardSummary = {
  today_total?: number;
  sales_count?: number;
  average_sale?: number;
};

const fallbackCards = [
  { label: "Today's revenue", value: "Live after sign-in", icon: TrendingUp },
  { label: "Avg. checkout", value: "Backend metrics", icon: Clock3 },
  { label: "Active staff", value: "Secure access", icon: Users },
];

export default function Login() {
  const navigate = useNavigate();
  const { signIn, signUp, isAuthenticated } = usePOS();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [backendError, setBackendError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const checkBackend = async () => {
      try {
        const response = await fetch(`${API_BASE}/health/`);
        if (!response.ok) {
          throw new Error(`Backend unavailable (${response.status})`);
        }
        setBackendError(null);
      } catch (err) {
        setBackendError(err instanceof Error ? err.message : "Could not reach backend.");
      }
    };

    void checkBackend();
  }, []);

  const readyStats = useMemo(
    () => [
      { value: "99.9%", label: "uptime target" },
      { value: "24/7", label: "access window" },
      { value: "UGX", label: "local currency" },
    ],
    []
  );

  const floatingCards = useMemo(
    () => [
      { label: "Today's revenue", value: dashboard ? formatCurrency(dashboard.today_total ?? 0) : fallbackCards[0].value, icon: TrendingUp },
      {
        label: "Avg. checkout",
        value: dashboard ? formatCurrency(dashboard.average_sale ?? 0) : fallbackCards[1].value,
        icon: Clock3,
      },
      {
        label: "Sales count",
        value: dashboard ? String(dashboard.sales_count ?? 0) : fallbackCards[2].value,
        icon: Users,
      },
    ],
    [dashboard]
  );

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || password.trim().length < 4) {
      setError("Username and password are required.");
      return;
    }

    if (mode === "signup") {
      if (password !== confirmPassword) {
        setError("Passwords do not match.");
        return;
      }
      if (password.trim().length < 6) {
        setError("Password must be at least 6 characters.");
        return;
      }
    }

    setSubmitting(true);
    const ok =
      mode === "signin"
        ? await signIn(username.trim(), password)
        : await signUp({ username: username.trim(), password, email: email.trim(), firstName: firstName.trim(), lastName: lastName.trim() });
    setSubmitting(false);
    if (!ok) {
      setError(mode === "signin" ? "Invalid credentials. Check your username and password." : "Could not create account. Try a different username.");
      return;
    }

    navigate("/dashboard", { replace: true });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-background text-foreground">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(21,212,143,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(11,15,22,0.92),rgba(11,15,22,0.98))]" />
      <div className="absolute inset-0 opacity-[0.08] bg-[linear-gradient(to_right,hsl(var(--foreground)/0.12)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.12)_1px,transparent_1px)] bg-[size:72px_72px]" />

      <div className="relative grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
        <motion.section
          initial={{ opacity: 0, x: -36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex flex-col justify-between p-6 sm:p-8 lg:p-10 xl:p-12 text-white overflow-hidden"
        >
          <div className="absolute inset-0 bg-[linear-gradient(145deg,rgba(4,8,14,0.96),rgba(5,22,21,0.92))]" />
          <motion.div
            animate={{ y: [0, -12, 0], x: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-16 left-10 w-72 h-72 rounded-full bg-primary/20 blur-3xl"
          />
          <motion.div
            animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-8 right-10 w-80 h-80 rounded-full bg-emerald-400/10 blur-3xl"
          />

          <div className="relative z-10 flex items-center gap-3">
            <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-gradient-to-br from-primary to-emerald-300 text-primary-foreground shadow-lg shadow-primary/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xl sm:text-2xl font-display font-bold tracking-tight">Jambo</div>
              <div className="text-xs uppercase tracking-[0.28em] text-white/60">Retail command platform</div>
            </div>
          </div>

          <div className="relative z-10 max-w-xl pt-12 lg:pt-0">
            <Badge variant="secondary" className="mb-5 border border-white/10 bg-white/5 text-white/90 backdrop-blur">
              <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Admin-only access
            </Badge>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[0.92] tracking-tight max-w-[11ch]">
              Calm control for a busy sales floor.
            </h1>
            <p className="mt-5 max-w-lg text-sm sm:text-base leading-7 text-white/68">
              Enter Jambo’s admin workspace to manage products, inspect live revenue, review throughput, and keep every
              shift moving with clarity.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {floatingCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.18 * index, duration: 0.45 }}
                  className="rounded-[20px] border border-white/10 bg-white/5 backdrop-blur-xl p-4 shadow-2xl shadow-black/10"
                >
                  <card.icon className="h-4 w-4 text-primary mb-3" />
                  <div className="text-2xl font-display font-bold text-white">{card.value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/50">{card.label}</div>
                </motion.div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-3 pt-10 text-[11px] uppercase tracking-[0.24em] text-white/45">
            {readyStats.map((item) => (
              <div key={item.label} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur">
                <span className="text-white/85 font-semibold mr-2">{item.value}</span>
                {item.label}
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="relative flex items-center justify-center p-4 sm:p-6 lg:p-10"
        >
          <div className="absolute inset-0 bg-[linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.45))]" />
          <div className="relative z-10 w-full max-w-xl">
            <div className="rounded-[32px] border border-border/70 bg-card/90 backdrop-blur-2xl shadow-[0_24px_80px_hsl(230_25%_10%/0.12)] p-6 sm:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm text-primary mb-6">
                <LockKeyhole size={14} /> Secure, encrypted session
              </div>

              <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-muted/35 px-4 py-3 text-xs sm:text-sm">
                <span className="font-medium text-muted-foreground">Backend</span>
                <span className={backendError ? "text-destructive" : "text-emerald-600"}>
                  {backendError ? backendError : `Connected to ${API_BASE}`}
                </span>
              </div>

              <h2 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight">{mode === "signin" ? "Welcome back" : "Create account"}</h2>
              <p className="mt-3 text-sm sm:text-base leading-7 text-muted-foreground max-w-lg">
                {mode === "signin"
                  ? "Sign in to reach the dashboard, monitor sales, and manage the system with full control."
                  : "Sign up with your details and start managing your POS immediately."}
              </p>

              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className={`rounded-2xl border-2 px-4 py-3 text-left ${
                      mode === "signin"
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]"
                        : "border-border/70 bg-muted/40"
                    }`}
                  >
                    <div className="text-sm font-semibold">Admin</div>
                    <div className="text-xs text-muted-foreground mt-1">Sign in with existing account</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className={`rounded-2xl border-2 px-4 py-3 text-left ${
                      mode === "signup"
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_0_1px_hsl(var(--primary)/0.1)]"
                        : "border-border/70 bg-muted/40"
                    }`}
                  >
                    <div className="text-sm font-semibold">Sign up</div>
                    <div className="text-xs text-muted-foreground mt-1">Create a new account</div>
                  </button>
                </div>

                {mode === "signup" && (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="text-sm font-medium text-foreground">First name</label>
                      <Input
                        value={firstName}
                        onChange={(event) => setFirstName(event.target.value)}
                        className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                        placeholder="First name"
                        autoComplete="given-name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground">Last name</label>
                      <Input
                        value={lastName}
                        onChange={(event) => setLastName(event.target.value)}
                        className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                        placeholder="Last name"
                        autoComplete="family-name"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground">Username</label>
                  <Input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                    placeholder="admin"
                    autoComplete="username"
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                      placeholder="you@example.com"
                      autoComplete="email"
                    />
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-3">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <span className="text-xs font-medium text-primary">Forgot?</span>
                  </div>
                  <Input
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                    type="password"
                    autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  />
                </div>

                {mode === "signup" && (
                  <div>
                    <label className="text-sm font-medium text-foreground">Confirm password</label>
                    <Input
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      className="mt-2 h-12 rounded-2xl text-base bg-background/80"
                      type="password"
                      autoComplete="new-password"
                    />
                  </div>
                )}

                {error && (
                  <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={submitting}
                  className="btn-accent h-14 w-full rounded-2xl text-base gap-2 shadow-[0_18px_45px_hsl(var(--primary)/0.3)]"
                >
                  {mode === "signin" ? "Enter Jambo Dashboard" : "Create account and continue"}
                  <ArrowRight size={18} />
                </Button>
              </form>

              <div className="my-6 flex items-center gap-4 text-xs uppercase tracking-[0.24em] text-muted-foreground">
                <span className="h-px flex-1 bg-border" />
                or
                <span className="h-px flex-1 bg-border" />
              </div>

              <div className="rounded-2xl border border-border/70 bg-muted/35 p-4 sm:p-5">
                <div className="flex items-start gap-3">
                  <BarChart3 className="mt-0.5 h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">What you unlock</div>
                    <p className="mt-1 text-sm text-muted-foreground leading-6">
                      Daily revenue visibility, product management, sales history, and a clean control surface for the
                      whole POS.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>
    </div>
  );
}