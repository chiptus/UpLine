/**
 * PROTOTYPE — throwaway. Not linked from any nav; visit /prototype/active-scope directly.
 * Answers: does the "two settings (active group + active scope), compact mobile-first
 * dropdown grouped groups-then-everyone/me" model feel right?
 * Delete this whole route once a variant wins or the question is answered.
 *
 * Mock data only — no Supabase calls. State lives in memory (useState), reset on reload.
 */
import {
  createFileRoute,
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
});

type ScopeKind = "group" | "everyone" | "me";

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

function groupScope(id: string): Scope {
  const g = MOCK_GROUPS.find((g) => g.id === id) ?? MOCK_GROUPS[0];
  return { kind: "group", id: g.id, name: g.name };
}

/**
 * Two independent settings, per the model:
 * - activeGroupId: "Active group" — which of your groups, regardless of scope.
 * - pinnedKind: "Active scope" — group / everyone / me. When "group", the
 *   pinned scope resolves through activeGroupId.
 * `current` is the header's transient, session-only override of the pinned scope.
 */
function useMockScopeState() {
  const [activeGroupId, setActiveGroupId] = useState(MOCK_GROUPS[0].id);
  const [pinnedKind, setPinnedKind] = useState<ScopeKind>("group");

  const pinned: Scope =
    pinnedKind === "group" ? groupScope(activeGroupId) : { kind: pinnedKind };

  const [current, setCurrent] = useState<Scope>(pinned);

  function selectScope(s: Scope) {
    setCurrent(s);
  }
  function returnToDefault() {
    setCurrent(pinned);
  }
  function setActiveGroup(id: string) {
    setActiveGroupId(id);
    if (pinnedKind === "group") setCurrent(groupScope(id));
  }
  function setPinnedScope(kind: ScopeKind) {
    setPinnedKind(kind);
    setCurrent(kind === "group" ? groupScope(activeGroupId) : { kind });
  }

  const isOverridden = scopeKey(current) !== scopeKey(pinned);

  return {
    activeGroupId,
    pinned,
    current,
    isOverridden,
    selectScope,
    returnToDefault,
    setActiveGroup,
    setPinnedScope,
  };
}

type ScopeState = ReturnType<typeof useMockScopeState>;

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

/**
 * Shared dropdown body. WINNER (per user verdict): the pinned scope always
 * sits first — starred, at the top — so reverting to it never requires
 * hunting through the list. Ordered:
 *   pinned scope (starred)
 *   -------
 *   remaining groups
 *   ----
 *   remaining of everyone/me
 * Kept intentionally compact/flat (no nested submenus) for mobile.
 */
function ScopeMenuBody({
  pinned,
  current,
  onSelect,
}: {
  pinned: Scope;
  current: Scope;
  onSelect: (s: Scope) => void;
}) {
  function Row({ s }: { s: Scope }) {
    const ItemIcon = scopeIcon(s);
    const isPinned = scopeKey(s) === scopeKey(pinned);
    const isActive = scopeKey(s) === scopeKey(current);
    return (
      <DropdownMenuItem
        onClick={() => onSelect(s)}
        className={cn("flex items-center gap-2", isActive && "bg-accent")}
      >
        <ItemIcon className="h-4 w-4" />
        <span className="flex-1">{scopeLabel(s)}</span>
        {isPinned && (
          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
        )}
      </DropdownMenuItem>
    );
  }

  const otherGroups = MOCK_GROUPS.filter(
    (g) => !(pinned.kind === "group" && pinned.id === g.id),
  ).map((g): Scope => ({ kind: "group", id: g.id, name: g.name }));
  const otherScopes = (["everyone", "me"] as const)
    .filter((kind) => pinned.kind !== kind)
    .map((kind): Scope => ({ kind }));

  return (
    <>
      <Row s={pinned} />
      <DropdownMenuSeparator />
      {otherGroups.map((s) => (
        <Row key={scopeKey(s)} s={s} />
      ))}
      {otherGroups.length > 0 && otherScopes.length > 0 && (
        <DropdownMenuSeparator />
      )}
      {otherScopes.map((s) => (
        <Row key={scopeKey(s)} s={s} />
      ))}
    </>
  );
}

/* ---------------- Variant A ----------------
 * Standard, compact header dropdown. Trigger shows current scope only (small footprint
 * on mobile). "x back to default" pill appears next to the trigger when overridden.
 */
function VariantA({ state }: { state: ScopeState }) {
  const { pinned, current, isOverridden, selectScope, returnToDefault } = state;
  const Icon = scopeIcon(current);

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6">
      <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-4">
        <span className="text-sm font-medium mr-2">Header:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Icon className="h-3.5 w-3.5" />
              {scopeLabel(current)}
              <ChevronDown className="h-3.5 w-3.5 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <ScopeMenuBody
              pinned={pinned}
              current={current}
              onSelect={selectScope}
            />
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

      <SettingsCard state={state} />
    </div>
  );
}

/* ---------------- Variant B ----------------
 * Two-row split: top row = "Your default" (pinned, always shown, click to jump straight
 * back — no dropdown needed for the common case). Second row = compact dropdown for
 * everything else, same grouped ordering as variant A.
 */
function VariantB({ state }: { state: ScopeState }) {
  const { pinned, current, isOverridden, selectScope, returnToDefault } = state;
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
              <Button variant="ghost" size="sm" className="gap-1.5">
                {scopeLabel(current)}
                <ChevronDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <ScopeMenuBody
                pinned={pinned}
                current={current}
                onSelect={selectScope}
              />
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <SettingsCard state={state} />
    </div>
  );
}

/* ---------------- Variant C ----------------
 * Segmented control for the pinned group vs "other" (Everyone/Me/other groups) tucked
 * behind a single "More" affordance — makes the group-pinned case the primary,
 * always-visible control, at the cost of one extra tap to reach Everyone/Me.
 */
function VariantC({ state }: { state: ScopeState }) {
  const { pinned, current, isOverridden, selectScope, returnToDefault } = state;
  const [moreOpen, setMoreOpen] = useState(false);
  const otherGroups = MOCK_GROUPS.filter(
    (g) => !(pinned.kind === "group" && pinned.id === g.id),
  ).map((g): Scope => ({ kind: "group", id: g.id, name: g.name }));
  const others: Scope[] = [
    ...otherGroups,
    { kind: "everyone" },
    { kind: "me" },
  ];

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

      <SettingsCard state={state} />
    </div>
  );
}

/**
 * Mocked Settings section — two independent controls per the model:
 * "Active group" (which group, always settable) and "Active scope"
 * (group / everyone / me — determines what the pin resolves to).
 */
function SettingsCard({ state }: { state: ScopeState }) {
  const { activeGroupId, pinned, setActiveGroup, setPinnedScope } = state;

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-sm font-semibold">Settings (mock)</h3>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Active group — which of your groups
        </p>
        <div className="flex flex-wrap gap-2">
          {MOCK_GROUPS.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGroup(g.id)}
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                activeGroupId === g.id
                  ? "border-primary bg-primary/10 font-medium"
                  : "hover:bg-muted",
              )}
            >
              <Users className="h-3.5 w-3.5" />
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Active scope — your default steady-state view
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { kind: "group" as const, label: "Group" },
            { kind: "everyone" as const, label: "Everyone" },
            { kind: "me" as const, label: "Me" },
          ].map((opt) => {
            const isPinned = pinned.kind === opt.kind;
            return (
              <button
                key={opt.kind}
                onClick={() => setPinnedScope(opt.kind)}
                className={cn(
                  "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm",
                  isPinned
                    ? "border-primary bg-primary/10 font-medium"
                    : "hover:bg-muted",
                )}
              >
                {opt.label}
                {isPinned && (
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                )}
              </button>
            );
          })}
        </div>
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
