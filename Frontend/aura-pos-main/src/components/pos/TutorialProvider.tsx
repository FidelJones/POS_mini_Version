import { createContext, useContext, useEffect, useLayoutEffect, useState, ReactNode, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { usePOS } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, X, Sparkles } from "lucide-react";

type Step = {
  selector: string;
  title: string;
  body: string;
  route?: string;
};

const steps: Step[] = [
  { selector: '[data-tour="grid"]', title: "Your products", body: "These are your products. Tap any card to add it to the current sale.", route: "/" },
  { selector: '[data-tour="search"]', title: "Find anything fast", body: "Search any product by name. Results filter as you type.", route: "/" },
  { selector: '[data-tour="cart"]', title: "Live cart", body: "Your cart lives here. Every item you tap appears instantly.", route: "/" },
  { selector: '[data-tour="qty"]', title: "Adjust quantities", body: "Use + and − to change quantities. The total updates the moment you tap.", route: "/" },
  { selector: '[data-tour="record"]', title: "Record the sale", body: "When you're ready, press this to save the sale to the system.", route: "/" },
  { selector: '[data-tour="dashboard-nav"]', title: "Your dashboard", body: "After every sale, your dashboard updates automatically. Check daily totals here.", route: "/" },
];

type Ctx = { start: () => void };
const TutorialCtx = createContext<Ctx>({ start: () => {} });
export const useTutorial = () => useContext(TutorialCtx);

export function TutorialProvider({ children }: { children: ReactNode }) {
  const [active, setActive] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  const { tutorialDone, setTutorialDone } = usePOS();

  const start = useCallback(() => {
    setStepIdx(0);
    setDone(false);
    setActive(true);
  }, []);

  // Auto-start on first visit
  useEffect(() => {
    if (!tutorialDone) {
      const t = setTimeout(() => start(), 600);
      return () => clearTimeout(t);
    }
  }, [tutorialDone, start]);

  // Navigate if step requires it
  useEffect(() => {
    if (!active) return;
    const step = steps[stepIdx];
    if (step?.route) navigate(step.route);
  }, [active, stepIdx, navigate]);

  // Track target element rect
  useLayoutEffect(() => {
    if (!active || done) return;
    let raf = 0;
    const update = () => {
      const step = steps[stepIdx];
      const el = step ? document.querySelector(step.selector) : null;
      if (el) {
        const r = el.getBoundingClientRect();
        setRect(r);
        // For sidebar nav item ensure visible
        el.scrollIntoView({ block: "center", behavior: "smooth" });
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(update);
    };
    raf = requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [active, stepIdx, done]);

  if (!active) return <TutorialCtx.Provider value={{ start }}>{children}</TutorialCtx.Provider>;

  const step = steps[stepIdx];
  const finish = () => {
    setActive(false);
    setTutorialDone(true);
  };

  // Tooltip placement
  const padding = 12;
  let tipStyle: React.CSSProperties = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  if (rect) {
    const tipW = 320, tipH = 180;
    const vw = window.innerWidth, vh = window.innerHeight;
    let top = rect.bottom + padding;
    let left = rect.left + rect.width / 2 - tipW / 2;
    if (top + tipH > vh - 16) top = Math.max(16, rect.top - tipH - padding);
    left = Math.max(16, Math.min(left, vw - tipW - 16));
    tipStyle = { top, left, width: tipW };
  }

  return (
    <TutorialCtx.Provider value={{ start }}>
      {children}
      <AnimatePresence>
        <motion.div
          key="overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] pointer-events-auto"
          style={{ background: "hsl(0 0% 0% / 0.55)", backdropFilter: "blur(4px)" }}
          onClick={(e) => e.stopPropagation()}
        />

        {!done && rect && (
          <motion.div
            key="ring"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed z-[101] pointer-events-none pulse-ring"
            style={{
              top: rect.top - 6,
              left: rect.left - 6,
              width: rect.width + 12,
              height: rect.height + 12,
              borderRadius: 16,
              background: "transparent",
            }}
          />
        )}

        {!done && (
          <motion.div
            key={`tip-${stepIdx}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="fixed z-[102] card-elevated p-5"
            style={tipStyle}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${i === stepIdx ? "w-6 bg-primary" : "w-1.5 bg-muted"}`}
                  />
                ))}
              </div>
              <button onClick={finish} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <div className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Step {stepIdx + 1} of {steps.length}</div>
            <h3 className="font-display font-semibold text-lg mb-1.5">{step.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{step.body}</p>
            <div className="flex justify-between items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
                disabled={stepIdx === 0}
                className="rounded-[10px] gap-1"
              >
                <ArrowLeft size={14} /> Back
              </Button>
              {stepIdx < steps.length - 1 ? (
                <Button size="sm" onClick={() => setStepIdx((i) => i + 1)} className="btn-accent h-9 px-4 gap-1">
                  Next <ArrowRight size={14} />
                </Button>
              ) : (
                <Button size="sm" onClick={() => setDone(true)} className="btn-accent h-9 px-4">
                  Finish
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {done && (
          <motion.div
            key="done"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fixed inset-0 z-[102] flex items-center justify-center pointer-events-none"
          >
            <div className="card-elevated p-8 text-center pointer-events-auto max-w-sm">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: "var(--gradient-accent)" }}>
                <Sparkles className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-bold text-2xl mb-2">You're ready!</h3>
              <p className="text-sm text-muted-foreground mb-5">Make your first sale in seconds. You can revisit the tour anytime.</p>
              <Button onClick={finish} className="btn-accent h-10 px-6">Start using Nordic POS</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </TutorialCtx.Provider>
  );
}
