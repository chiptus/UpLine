/**
 * PROTOTYPE — throwaway. Not linked from any nav; visit /prototype/active-scope directly.
 * Answers: does the "scope pin lives in Settings, header dropdown is a transient
 * override" model (from the #124/#122/#125 grill session) feel right?
 * Delete this whole route once a variant wins or the question is answered.
 *
 * Mock data only — no Supabase calls. State lives in memory (useState), reset on reload.
 */
import {
  createFileRoute,
  notFound,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  Star,
  X,
  Users,
  Globe,
  User as UserIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const searchSchema = z.object({
  variant: z.enum(["A", "B", "C"]).catch("A"),
});

export const Route = createFileRoute("/prototype/active-scope")({
  component: ActiveScopePrototype,
  validateSearch: searchSchema,
  beforeLoad: () => {
    if (import.meta.env.PROD) throw notFound();
  },
});

type Scope =
  | { kind: "group"; id: string; name: string }
  | { kind: "everyone" }
  | { kind: "me" };

const MOCK_GROUPS = [
  { id: "g1", name: "Desert Crew" },
  { id: "g2", name: "Berlin Squad" },
];

function scopeKey(s: Scope) {
  return s.kind === "group" ? `group:${s.id}` : s.kind;
}

function scopeLabel(s: Scope) {
  if (s.kind === "group") return s.name;
  if (s.kind === "everyone") return "Everyone";
  return "Me";
}

function scopeIcon(s: Scope) {
  if (s.kind === "group") return Users;
  if (s.kind === "everyone") return Globe;
  return UserIcon;
}

const ALL_SCOPES: Scope[] = [
  ...MOCK_GROUPS.map((g) => ({
    kind: "group" as const,
    id: g.id,
    name: g.name,
  })),
  { kind: "everyone" },
  { kind: "me" },
];

// Shared mock state: pinned (Settings) scope + current (header override) scope.
function useMockScopeState() {
  const [pinned, setPinned] = useState<Scope>({
    kind: "group",
    id: "g1",
    name: "Desert Crew",
  });
  const [current, setCurrent] = useState<Scope>(pinned);

  function selectScope(s: Scope) {
    setCurrent(s);
  }
  function returnToDefault() {
    setCurrent(pinned);
  }
  function pinScope(s: Scope) {
    setPinned(s);
    setCurrent(s);
  }

  const isOverridden = scopeKey(current) !== scopeKey(pinned);

  return {
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    pinScope,
  };
}

function ActiveScopePrototype() {
  const { variant } = useSearch({ from: "/prototype/active-scope" });
  const navigate = useNavigate({ from: "/prototype/active-scope" });
  const state = useMockScopeState();

  function setVariant(v: "A" | "B" | "C") {
    navigate({ search: { variant: v } });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="border-b p-4 text-sm text-muted-foreground">
        Prototype — Active Group / Scope switcher · fake header + fake settings,
        no real data
      </div>

      {variant === "A" && <VariantA state={state} />}
      {variant === "B" && <VariantB state={state} />}
      {variant === "C" && <VariantC state={state} />}

      <PrototypeSwitcher
        variants={[
          { key: "A", label: "Star-marked dropdown" },
          { key: "B", label: "Two-row split" },
          { key: "C", label: "Segmented + drawer" },
        ]}
        current={variant}
        onChange={setVariant}
      />
    </div>
  );
}

type ScopeState = ReturnType<typeof useMockScopeState>;

/* ---------------- Variant A ----------------
 * Standard header dropdown. Pinned entry gets a star + "default" label inline.
 * "x return to default" pill appears next to the trigger when overridden.
 * Settings mocked as a simple card below.
 */
function VariantA({ state }: { state: ScopeState }) {
  const {
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    pinScope,
  } = state;
  const Icon = scopeIcon(current);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4">
        <span className="text-sm font-medium mr-2">Header:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Icon className="h-4 w-4" />
              {scopeLabel(current)}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Viewing scope</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {ALL_SCOPES.map((s) => {
              const ItemIcon = scopeIcon(s);
              const isPinned = scopeKey(s) === scopeKey(pinned);
              const isActive = scopeKey(s) === scopeKey(current);
              return (
                <DropdownMenuItem
                  key={scopeKey(s)}
                  onClick={() => selectScope(s)}
                  className={cn(
                    "flex items-center gap-2",
                    isActive && "bg-accent",
                  )}
                >
                  <ItemIcon className="h-4 w-4" />
                  <span className="flex-1">{scopeLabel(s)}</span>
                  {isPinned && (
                    <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {isOverridden && (
          <Button
            variant="ghost"
            size="sm"
            onClick={returnToDefault}
            className="gap-1 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
            back to {scopeLabel(pinned)}
          </Button>
        )}
      </div>

      <SettingsCard pinned={pinned} onPin={pinScope} />
    </div>
  );
}

/* ---------------- Variant B ----------------
 * Two-row split: top row = "Your default" (pinned, always shown, click to jump straight
 * back — no dropdown needed for the common case). Second row = "Browse" dropdown for
 * everything else. Tests whether separating "go to default" from "explore" reads clearer
 * than one merged list.
 */
function VariantB({ state }: { state: ScopeState }) {
  const {
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    pinScope,
  } = state;
  const PinnedIcon = scopeIcon(pinned);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="space-y-2 rounded-lg border bg-muted/30 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Your default
          </span>
          <Button
            size="sm"
            variant={isOverridden ? "outline" : "default"}
            onClick={returnToDefault}
            className="gap-2"
          >
            <PinnedIcon className="h-4 w-4" />
            {scopeLabel(pinned)}
            {!isOverridden && <Badge className="ml-1">active</Badge>}
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-xs uppercase tracking-wide text-muted-foreground">
            Browse
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                Currently: {scopeLabel(current)}
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              {ALL_SCOPES.map((s) => {
                const ItemIcon = scopeIcon(s);
                return (
                  <DropdownMenuItem
                    key={scopeKey(s)}
                    onClick={() => selectScope(s)}
                    className="flex items-center gap-2"
                  >
                    <ItemIcon className="h-4 w-4" />
                    {scopeLabel(s)}
                    {scopeKey(s) === scopeKey(pinned) && (
                      <span className="ml-auto text-xs text-muted-foreground">
                        default
                      </span>
                    )}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsCard pinned={pinned} onPin={pinScope} />
    </div>
  );
}

/* ---------------- Variant C ----------------
 * Segmented control for the pinned group vs "other" (Everyone/Me/other groups) tucked
 * behind a single "More" affordance — tests whether making the group-pinned case the
 * primary, always-visible control (matching "centralize around your crew") beats a
 * generic dropdown outright, at the cost of one extra click to reach Everyone/Me.
 */
function VariantC({ state }: { state: ScopeState }) {
  const {
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    pinScope,
  } = state;
  const [moreOpen, setMoreOpen] = useState(false);
  const others = ALL_SCOPES.filter((s) => scopeKey(s) !== scopeKey(pinned));

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="inline-flex rounded-md border p-1">
          <button
            onClick={returnToDefault}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              !isOverridden
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {scopeLabel(pinned)}
          </button>
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium transition-colors",
              isOverridden
                ? "bg-primary text-primary-foreground"
                : "hover:bg-muted",
            )}
          >
            {isOverridden ? scopeLabel(current) : "More"}
            <ChevronDown className="ml-1 inline h-3.5 w-3.5 opacity-70" />
          </button>
        </div>

        {moreOpen && (
          <div className="mt-2 flex flex-wrap gap-2">
            {others.map((s) => {
              const ItemIcon = scopeIcon(s);
              return (
                <Button
                  key={scopeKey(s)}
                  size="sm"
                  variant={
                    scopeKey(s) === scopeKey(current) ? "secondary" : "outline"
                  }
                  onClick={() => {
                    selectScope(s);
                    setMoreOpen(false);
                  }}
                  className="gap-1.5"
                >
                  <ItemIcon className="h-3.5 w-3.5" />
                  {scopeLabel(s)}
                </Button>
              );
            })}
          </div>
        )}
      </div>

      <SettingsCard pinned={pinned} onPin={pinScope} />
    </div>
  );
}

function SettingsCard({
  pinned,
  onPin,
}: {
  pinned: Scope;
  onPin: (s: Scope) => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <h3 className="mb-1 text-sm font-semibold">Settings (mock)</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Your default scope — what you see every time you open the app.
      </p>
      <div className="flex flex-wrap gap-2">
        {ALL_SCOPES.map((s) => {
          const ItemIcon = scopeIcon(s);
          const isPinned = scopeKey(s) === scopeKey(pinned);
          return (
            <button
              key={scopeKey(s)}
              onClick={() => onPin(s)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                isPinned
                  ? "border-primary bg-primary/10 font-medium"
                  : "hover:bg-muted",
              )}
            >
              <ItemIcon className="h-3.5 w-3.5" />
              {scopeLabel(s)}
              {isPinned && (
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PrototypeSwitcher({
  variants,
  current,
  onChange,
}: {
  variants: { key: "A" | "B" | "C"; label: string }[];
  current: "A" | "B" | "C";
  onChange: (v: "A" | "B" | "C") => void;
}) {
  const idx = variants.findIndex((v) => v.key === current);

  function cycle(dir: 1 | -1) {
    const next = variants[(idx + dir + variants.length) % variants.length];
    onChange(next.key);
  }

  useEffect(() => {
    if (import.meta.env.PROD) return;

    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") cycle(-1);
      if (e.key === "ArrowRight") cycle(1);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [idx, variants, onChange]);

  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border bg-foreground px-3 py-2 text-background shadow-lg">
      <button
        onClick={() => cycle(-1)}
        className="p-1"
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-40 text-center text-xs font-medium">
        {current} — {variants[idx]?.label}
      </span>
      <button
        onClick={() => cycle(1)}
        className="p-1"
        aria-label="Next variant"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
