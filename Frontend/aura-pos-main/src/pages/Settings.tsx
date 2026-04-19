import { usePOS } from "@/store/pos";
import { Button } from "@/components/ui/button";
import { useTutorial } from "@/components/pos/TutorialProvider";
import { Moon, Sun, RotateCcw, HelpCircle } from "lucide-react";

export default function Settings() {
  const { theme, setTheme, sales, products } = usePOS();
  const { start } = useTutorial();

  return (
    <div className="p-4 md:p-8 max-w-2xl mx-auto">
      <h1 className="font-display font-bold text-2xl md:text-3xl mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">Quiet preferences for a quiet system.</p>

      <div className="space-y-3">
        <Row label="Appearance" hint="Choose how the interface feels.">
          <div className="flex gap-2">
            <Button variant={theme === "light" ? "default" : "outline"} onClick={() => setTheme("light")} className="rounded-[10px] gap-2">
              <Sun size={16} /> Light
            </Button>
            <Button variant={theme === "dark" ? "default" : "outline"} onClick={() => setTheme("dark")} className="rounded-[10px] gap-2">
              <Moon size={16} /> Dark
            </Button>
          </div>
        </Row>

        <Row label="Tutorial" hint="Walk through the system again, anytime.">
          <Button variant="outline" onClick={start} className="rounded-[10px] gap-2"><HelpCircle size={16} /> Replay tour</Button>
        </Row>

        <Row label="Reset data" hint={`${products.length} products · ${sales.length} sales recorded`}>
          <Button
            variant="outline"
            className="rounded-[10px] gap-2 text-destructive hover:text-destructive"
            onClick={() => {
              if (confirm("Erase all data and start fresh?")) {
                localStorage.removeItem("pos-store-v1");
                location.reload();
              }
            }}
          >
            <RotateCcw size={16} /> Reset
          </Button>
        </Row>
      </div>
    </div>
  );
}

function Row({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <div className="card-soft p-5 flex items-center justify-between gap-4">
      <div>
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{hint}</div>
      </div>
      {children}
    </div>
  );
}
