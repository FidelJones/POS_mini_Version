import { Link } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Boxes,
  Download,
  FileText,
  KeyRound,
  LayoutDashboard,
  LifeBuoy,
  Printer,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Sparkles,
  UserCircle2,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { jsPDF } from "jspdf";

const sections = [
  { id: "overview", title: "System overview", icon: BookOpen },
  { id: "getting-started", title: "Getting started", icon: Zap },
  { id: "dashboard", title: "Dashboard", icon: LayoutDashboard },
  { id: "products", title: "Products & categories", icon: Boxes },
  { id: "sales", title: "Running sales in POS", icon: ShoppingCart },
  { id: "sales-history", title: "Sales history", icon: Receipt },
  { id: "reports", title: "Reports & exports", icon: BarChart3 },
  { id: "settings", title: "Settings & tutorial", icon: Settings },
  { id: "faq", title: "FAQ", icon: LifeBuoy },
] as const;

const guideText = `JAMBO POS USER GUIDE

1) System Overview
- Jambo POS is a web-based point-of-sale and operations tool.
- Core modules: Dashboard, POS, Products, Sales History, Reports, Settings.
- VAT is automatically applied at 18% during checkout.
- Business data is stored in the backend API; UI preferences are stored in browser local storage.

2) Getting Started
- Sign in with your account on the login page.
- Confirm backend status shows connected.
- Open Dashboard to confirm live metrics are loading.
- Add at least one category and one product before checkout.

3) Dashboard
- Track: Today's revenue, sales count, average sale time, voided sales placeholder.
- Review: 7-day revenue chart and hourly activity snapshot.
- Use quick actions: New Category, Add Product, View Reports.

4) Products and Categories
- Create categories with optional images for faster visual scanning.
- Add products with name, price, category, and optional image.
- Edit and delete products as needed.

5) Running Sales in POS
- Open POS and filter by category or search by product name.
- Tap products to add items to cart.
- Adjust quantities with plus/minus.
- Enter recipient and optional notes.
- Review subtotal, VAT (18%), and total.
- Click Place Order to record sale.
- Use Print if you need a physical copy.

6) Sales History
- Review transactions by date and detail.
- Use filters: Today, This Week, This Month, All Time.
- Each row/card includes customer, notes, items, total, and timestamp.

7) Reports and Exports
- Select date range and generate report.
- Analyze revenue, count, average sale, top products, unique customers.
- Review period heatmap for busy hours.
- Export CSV or print report.

8) Settings and Tutorial
- Toggle light/dark theme.
- Replay guided tour anytime.
- Reset local settings when needed.

9) FAQ Highlights
- VAT: Automatically added at checkout.
- Historical prices: Saved as snapshots at sale time.
- Print issue: Allow popups in browser settings.
- Data storage: Backend for business records, local storage for UI/session preferences.
`;

function Step({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-md">
        {n}
      </div>
      <div className="flex-1 pt-0.5">
        <p className="font-semibold">{title}</p>
        <div className="mt-1 text-sm text-muted-foreground space-y-1">{children}</div>
      </div>
    </div>
  );
}

function Section({
  id,
  icon: Icon,
  title,
  subtitle,
  children,
  accent,
}: {
  id: string;
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-4">
      <div className="flex items-center gap-3">
        <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${accent}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold tracking-tight">{title}</h2>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>
      <Card className="p-6 shadow-sm">{children}</Card>
    </section>
  );
}

function downloadGuidePdf() {
  const pdf = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 40;
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const maxLineWidth = pageWidth - margin * 2;
  const lineHeight = 16;

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.text("Jambo POS User Guide", margin, margin);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(11);

  const lines = pdf.splitTextToSize(guideText, maxLineWidth) as string[];
  let y = margin + 28;

  lines.forEach((line) => {
    if (y > pageHeight - margin) {
      pdf.addPage();
      y = margin;
    }
    pdf.text(line, margin, y);
    y += lineHeight;
  });

  pdf.save("jambo-pos-user-guide.pdf");
}

export default function Guide() {
  return (
    <div className="space-y-8 animate-fade-in p-4 md:p-8 max-w-6xl mx-auto">
      <div className="relative overflow-hidden rounded-3xl p-8 sm:p-10 text-white shadow-elevated bg-[#0a0a14] border border-white/10">
        <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_right,hsl(var(--foreground)/0.20)_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--foreground)/0.20)_1px,transparent_1px)] bg-[size:56px_56px]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-emerald-400/20 blur-3xl" />

        <div className="relative max-w-3xl space-y-4">
          <Badge className="bg-white/15 text-white border-0 hover:bg-white/20">
            <BookOpen className="mr-1.5 h-3 w-3" /> One-page User Guide
          </Badge>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
            Complete Jambo POS guide for your whole team.
          </h1>
          <p className="text-white/85">
            This page teaches new staff how to use the full system end to end,
            while you control which pages each role can access.
          </p>

          <div className="grid gap-3 sm:grid-cols-3 pt-2">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Sections</p>
              <p className="text-xl font-semibold">9</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">Avg sale flow</p>
              <p className="text-xl font-semibold">~6 sec</p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3">
              <p className="text-[11px] uppercase tracking-wide text-white/70">VAT</p>
              <p className="text-xl font-semibold">18%</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={downloadGuidePdf} variant="secondary" className="gap-2">
              <Download className="h-4 w-4" /> Download Guide (.pdf)
            </Button>
            <Button
              onClick={() => window.print()}
              variant="outline"
              className="gap-2 bg-transparent border-white/30 text-white hover:bg-white/10 hover:text-white"
            >
              <Printer className="h-4 w-4" /> Print Guide
            </Button>
            <Button asChild className="btn-accent gap-2">
              <Link to="/pos">
                <ShoppingCart className="h-4 w-4" /> Open POS
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 card-soft p-3">
            <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              On this page
            </p>
            <nav className="space-y-1">
              {sections.map((s) => (
                <a
                  key={s.id}
                  href={`#${s.id}`}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-base hover:bg-accent hover:text-accent-foreground"
                >
                  <s.icon className="h-4 w-4" />
                  {s.title}
                </a>
              ))}
            </nav>
          </div>
        </aside>

        <div className="space-y-10 min-w-0">
          <Section
            id="overview"
            icon={BookOpen}
            title="System overview"
            subtitle="What Jambo POS does and where key data lives."
            accent="bg-primary/10 text-primary"
          >
            <ul className="space-y-3 text-sm">
              <li className="flex gap-3">
                <Sparkles className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  Jambo POS is a full workflow system with modules for Dashboard,
                  POS checkout, Products, Sales History, Reports, and Settings.
                </span>
              </li>
              <li className="flex gap-3">
                <FileText className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  Business records come from the backend API; theme and tutorial
                  progress are stored locally for user experience.
                </span>
              </li>
              <li className="flex gap-3">
                <UserCircle2 className="h-4 w-4 mt-0.5 text-primary" />
                <span>
                  You can onboard all staff using this same guide and then limit
                  what pages each role can access as you expand role controls.
                </span>
              </li>
            </ul>
          </Section>

          <Section
            id="getting-started"
            icon={Zap}
            title="Getting started"
            subtitle="From sign-in to first completed order."
            accent="bg-emerald-500/10 text-emerald-600"
          >
            <div className="space-y-5">
              <div className="rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                  POS flow at a glance
                </p>
                <p className="text-sm font-medium">
                  Sign in <span className="text-muted-foreground">→</span> Open POS <span className="text-muted-foreground">→</span> Add items <span className="text-muted-foreground">→</span> Review cart <span className="text-muted-foreground">→</span> Place order <span className="text-muted-foreground">→</span> Check reports
                </p>
              </div>
              <Step n={1} title="Sign in">
                Open the login page, use your account credentials, and proceed to
                the dashboard.
              </Step>
              <Step n={2} title="Confirm backend is connected">
                On login and dashboard, ensure system data is loading correctly
                before training staff.
              </Step>
              <Step n={3} title="Prepare catalog">
                Add categories and products first so POS has items ready for
                checkout.
              </Step>
              <Step n={4} title="Run a test order">
                Create one sample order to verify tax, totals, and reporting are
                working as expected.
              </Step>
            </div>
          </Section>

          <Section
            id="dashboard"
            icon={LayoutDashboard}
            title="Dashboard"
            subtitle="Live business snapshot for daily operations."
            accent="bg-sky-500/10 text-sky-600"
          >
            <ul className="space-y-3 text-sm">
              <li>Monitor today revenue, sales count, and average sale metrics.</li>
              <li>Use the 7-day chart to spot trends quickly.</li>
              <li>Check hourly activity to identify peak periods.</li>
              <li>Use quick actions to create category, add products, or open reports.</li>
              <li>Review recent sales without leaving the page.</li>
            </ul>
          </Section>

          <Section
            id="products"
            icon={Boxes}
            title="Products & categories"
            subtitle="Build a clean, searchable catalog for faster checkout."
            accent="bg-indigo-500/10 text-indigo-600"
          >
            <div className="space-y-5">
              <Step n={1} title="Create categories">
                Add category names and optional category images to improve POS
                scanning speed.
              </Step>
              <Step n={2} title="Add products">
                Each product should have a name and price. Add category and
                image when available.
              </Step>
              <Step n={3} title="Maintain product quality">
                Edit outdated prices/names and remove products that are no
                longer sold.
              </Step>
              <Step n={4} title="Use search & category filters">
                In POS, staff can find products instantly by typing or selecting
                category chips.
              </Step>
            </div>
          </Section>

          <Section
            id="sales"
            icon={ShoppingCart}
            title="Running sales in POS"
            subtitle="Optimized for quick transactions and clear receipts."
            accent="bg-green-500/10 text-green-600"
          >
            <div className="space-y-5">
              <Step n={1} title="Open POS and add products">
                Click products to push them into the live cart.
              </Step>
              <Step n={2} title="Adjust quantity">
                Use plus and minus controls on each cart line.
              </Step>
              <Step n={3} title="Capture customer context">
                Add recipient/customer name and optional note.
              </Step>
              <Step n={4} title="Review totals">
                Confirm subtotal, VAT (18%), and final total before checkout.
              </Step>
              <Step n={5} title="Place order and print if needed">
                Click <b>Place Order</b> to save sale. Use print for hardcopy
                confirmation.
              </Step>
            </div>
          </Section>

          <Section
            id="sales-history"
            icon={Receipt}
            title="Sales history"
            subtitle="Track all transactions and audit activity quickly."
            accent="bg-amber-500/10 text-amber-600"
          >
            <ul className="space-y-3 text-sm">
              <li>Filter by Today, This Week, This Month, or All Time.</li>
              <li>Inspect customer, notes, item list, totals, and timestamps.</li>
              <li>Use history to validate disputed receipts and team activity.</li>
            </ul>
          </Section>

          <Section
            id="reports"
            icon={BarChart3}
            title="Reports & exports"
            subtitle="Generate insights and share records externally."
            accent="bg-violet-500/10 text-violet-600"
          >
            <ul className="space-y-3 text-sm">
              <li>Select preset or custom date ranges and generate reports.</li>
              <li>Review total revenue, sale count, average sale, and top products.</li>
              <li>Use heatmap blocks to understand busy business hours.</li>
              <li>Download CSV for accounting and print formatted reports.</li>
            </ul>
          </Section>

          <Section
            id="settings"
            icon={KeyRound}
            title="Settings & tutorial"
            subtitle="Customize experience and train new users faster."
            accent="bg-cyan-500/10 text-cyan-600"
          >
            <ul className="space-y-3 text-sm">
              <li>Switch between light and dark theme.</li>
              <li>Replay guided tour anytime for onboarding refresh.</li>
              <li>Reset local settings if user preferences become inconsistent.</li>
              <li>
                Keep this guide as the standard onboarding document while you
                enforce role-based page limits for non-admin staff.
              </li>
            </ul>
          </Section>

          <Section
            id="faq"
            icon={LifeBuoy}
            title="FAQ"
            subtitle="Common questions from new staff and supervisors."
            accent="bg-rose-500/10 text-rose-600"
          >
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1">
                <AccordionTrigger>Why is VAT already included at checkout?</AccordionTrigger>
                <AccordionContent>
                  The system calculates VAT automatically at 18% from subtotal
                  and adds it to the final total.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger>Why can old sales show old prices?</AccordionTrigger>
                <AccordionContent>
                  Sale records keep a snapshot of item name and price at the time
                  of transaction so historical records remain accurate.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger>Print does not open. What should I do?</AccordionTrigger>
                <AccordionContent>
                  Allow popups in your browser for this POS domain, then retry
                  print or report preview.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger>Is everything only stored in browser local storage?</AccordionTrigger>
                <AccordionContent>
                  No. Products, categories, sales, and reports come from backend
                  APIs. Local storage is mainly for session and UI preferences.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger>How should we train new staff fastest?</AccordionTrigger>
                <AccordionContent>
                  Start with Getting Started and Running Sales in POS, then cover
                  Sales History and Reports after they can complete a checkout in
                  one uninterrupted flow.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          <div className="rounded-2xl border border-border bg-linear-to-br from-primary/10 to-background p-6 text-center">
            <Search className="mx-auto h-6 w-6 text-primary" />
            <p className="mt-2 font-semibold">Guide complete</p>
            <p className="text-sm text-muted-foreground">
              Keep this page as the standard training reference for all staff.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button onClick={downloadGuidePdf} className="gap-2 shadow-glow">
                <Download className="h-4 w-4" /> Download .pdf
              </Button>
              <Button variant="outline" onClick={() => window.print()} className="gap-2">
                <Printer className="h-4 w-4" /> Print
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
