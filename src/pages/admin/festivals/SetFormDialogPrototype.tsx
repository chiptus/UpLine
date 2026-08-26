// PROTOTYPE — throwaway. Wayfinder ticket #399: type selector + conditional artist picker.
// Three variants of the create/edit set form, switchable via ?variant=A|B|C on the
// admin sets route. Submit is stubbed (logs the payload, no mutation).
import { useMemo, useState, useEffect, useCallback } from "react";
import { useArtistsQuery } from "@/api/artists/useArtists";
import { FestivalSet } from "@/api/sets/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { MultiSelect } from "@/components/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  Music,
  Wrench,
  Drama,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

type SetType = "music" | "workshop" | "performance" | "other";

const SET_TYPES: {
  value: SetType;
  label: string;
  icon: typeof Music;
  hint: string;
}[] = [
  {
    value: "music",
    label: "Music",
    icon: Music,
    hint: "DJ or live set by one or more artists",
  },
  {
    value: "workshop",
    label: "Workshop",
    icon: Wrench,
    hint: "Class, talk or hands-on session",
  },
  {
    value: "performance",
    label: "Performance",
    icon: Drama,
    hint: "Theatre, circus, dance…",
  },
  {
    value: "other",
    label: "Other",
    icon: Sparkles,
    hint: "Anything else on the schedule",
  },
];

interface PrototypeProps {
  isOpen: boolean;
  onClose: () => void;
  editingSet: FestivalSet | null;
}

interface SharedState {
  setType: SetType | null;
  artistIds: string[];
  name: string;
  description: string;
}

function useSharedState(editingSet: FestivalSet | null, isOpen: boolean) {
  const [state, setState] = useState<SharedState>({
    setType: null,
    artistIds: [],
    name: "",
    description: "",
  });
  useEffect(() => {
    if (isOpen) {
      setState({
        setType: editingSet ? "music" : null,
        artistIds: editingSet?.artists?.map((a) => a.id) || [],
        name: editingSet?.name || "",
        description: editingSet?.description || "",
      });
    }
  }, [isOpen, editingSet]);
  return [state, setState] as const;
}

function CommonFields({
  state,
  patch,
  namePlaceholder,
}: {
  state: SharedState;
  patch: (p: Partial<SharedState>) => void;
  namePlaceholder: string;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label>Name</Label>
        <Input
          placeholder={namePlaceholder}
          value={state.name}
          onChange={(e) => patch({ name: e.target.value })}
        />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea
          placeholder="Description..."
          rows={2}
          value={state.description}
          onChange={(e) => patch({ description: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start Time</Label>
          <Input type="datetime-local" />
        </div>
        <div className="space-y-2">
          <Label>End Time</Label>
          <Input type="datetime-local" />
        </div>
      </div>
    </>
  );
}

function ArtistPicker({
  state,
  patch,
  label,
  placeholder,
}: {
  state: SharedState;
  patch: (p: Partial<SharedState>) => void;
  label: string;
  placeholder: string;
}) {
  const { data: artists = [] } = useArtistsQuery();
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <MultiSelect
        options={artists.map((a) => ({ id: a.id, name: a.name }))}
        value={state.artistIds}
        onValueChange={(artistIds) => patch({ artistIds })}
        placeholder={placeholder}
        searchPlaceholder="Search artists..."
        emptyMessage="No artists found."
      />
    </div>
  );
}

function FooterButtons({
  onClose,
  state,
  disabled,
}: {
  onClose: () => void;
  state: SharedState;
  disabled?: boolean;
}) {
  return (
    <div className="flex justify-end gap-2 pt-2">
      <Button type="button" variant="outline" onClick={onClose}>
        Cancel
      </Button>
      <Button
        type="button"
        disabled={disabled}
        onClick={() => {
          console.log("PROTOTYPE submit", state);
          onClose();
        }}
      >
        Create
      </Button>
    </div>
  );
}

// Variant A — "Type-first wizard": full-screen step 1 picks the type via icon
// cards; step 2 is the form, with the artist picker rendered ONLY for music.
function VariantA({ isOpen, onClose, editingSet }: PrototypeProps) {
  const [state, setState] = useSharedState(editingSet, isOpen);
  const patch = useCallback(
    (p: Partial<SharedState>) => setState((s) => ({ ...s, ...p })),
    [setState],
  );
  const [step, setStep] = useState<1 | 2>(1);
  useEffect(() => {
    if (isOpen) setStep(editingSet ? 2 : 1);
  }, [isOpen, editingSet]);
  const typeMeta = SET_TYPES.find((t) => t.value === state.setType);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {step === 1 ? "What kind of set?" : `New ${typeMeta?.label} Set`}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Pick the type first — it shapes the rest of the form."
              : "Fill in the details."}
          </DialogDescription>
        </DialogHeader>
        {step === 1 ? (
          <div className="grid grid-cols-2 gap-3">
            {SET_TYPES.map(({ value, label, icon: Icon, hint }) => (
              <button
                key={value}
                type="button"
                className="flex flex-col items-start gap-2 rounded-lg border p-4 text-left hover:border-accent hover:bg-accent/10 transition-colors"
                onClick={() => {
                  patch({ setType: value });
                  setStep(2);
                }}
              >
                <Icon className="h-6 w-6 text-accent" />
                <span className="font-medium">{label}</span>
                <span className="text-xs text-muted-foreground">{hint}</span>
              </button>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setStep(1)}
            >
              <ArrowLeft className="h-3 w-3" />
              {typeMeta?.label} — change type
            </button>
            {state.setType === "music" && (
              <ArtistPicker
                state={state}
                patch={patch}
                label="Artists in Set"
                placeholder="Select artists for this set..."
              />
            )}
            <CommonFields
              state={state}
              patch={patch}
              namePlaceholder={
                state.setType === "music"
                  ? "Auto-generated from artists, or type your own"
                  : `e.g. ${state.setType === "workshop" ? "Morning Yoga Flow" : state.setType === "performance" ? "Fire Show" : "Sunrise Ceremony"}`
              }
            />
            <FooterButtons onClose={onClose} state={state} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Variant B — "Inline select": one flat form; type is a required Select at the
// top; the artist picker is always visible but degrades to optional with
// non-music copy.
function VariantB({ isOpen, onClose, editingSet }: PrototypeProps) {
  const [state, setState] = useSharedState(editingSet, isOpen);
  const patch = useCallback(
    (p: Partial<SharedState>) => setState((s) => ({ ...s, ...p })),
    [setState],
  );
  const isMusic = state.setType === "music";
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
          <DialogDescription>
            One form for every kind of set — the type just relabels the artist
            picker.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>
              Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={state.setType ?? undefined}
              onValueChange={(v) => patch({ setType: v as SetType })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a type..." />
              </SelectTrigger>
              <SelectContent>
                {SET_TYPES.map(({ value, label, icon: Icon }) => (
                  <SelectItem key={value} value={value}>
                    <span className="flex items-center gap-2">
                      <Icon className="h-4 w-4" /> {label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ArtistPicker
            state={state}
            patch={patch}
            label={isMusic ? "Artists in Set" : "Artists (optional)"}
            placeholder={
              isMusic
                ? "Select artists for this set..."
                : "Link facilitators/performers if they exist as artists..."
            }
          />
          <CommonFields
            state={state}
            patch={patch}
            namePlaceholder="e.g. Shpongle Live Set"
          />
          <FooterButtons
            onClose={onClose}
            state={state}
            disabled={!state.setType}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Variant C — "Segmented tabs + adaptive layout": type as a segmented control
// pinned at the top; music leads with the artist picker (as today), non-music
// leads with name/description and tucks the picker behind a collapsible.
function VariantC({ isOpen, onClose, editingSet }: PrototypeProps) {
  const [state, setState] = useSharedState(editingSet, isOpen);
  const patch = useCallback(
    (p: Partial<SharedState>) => setState((s) => ({ ...s, ...p })),
    [setState],
  );
  const [showPicker, setShowPicker] = useState(false);
  const isMusic = state.setType === "music";
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Set</DialogTitle>
          <DialogDescription>
            The type tab reorders the form: music is artist-first, everything
            else is name-first.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-4 rounded-lg border p-1 gap-1">
            {SET_TYPES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                className={cn(
                  "flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                  state.setType === value
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-muted",
                )}
                onClick={() => patch({ setType: value })}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
          {!state.setType ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Pick a type above to start.
            </p>
          ) : (
            <>
              {isMusic && (
                <ArtistPicker
                  state={state}
                  patch={patch}
                  label="Artists in Set"
                  placeholder="Select artists for this set..."
                />
              )}
              <CommonFields
                state={state}
                patch={patch}
                namePlaceholder={
                  isMusic
                    ? "Auto-generated from artists"
                    : "e.g. Morning Yoga Flow"
                }
              />
              {!isMusic && (
                <div className="rounded-lg border p-3">
                  {showPicker ? (
                    <ArtistPicker
                      state={state}
                      patch={patch}
                      label="Linked artists (optional)"
                      placeholder="Link facilitators/performers..."
                    />
                  ) : (
                    <button
                      type="button"
                      className="text-sm text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPicker(true)}
                    >
                      + Link artists (optional)
                    </button>
                  )}
                </div>
              )}
              <FooterButtons onClose={onClose} state={state} />
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const VARIANTS = {
  A: { component: VariantA, name: "Type-first wizard" },
  B: { component: VariantB, name: "Inline select" },
  C: { component: VariantC, name: "Segmented tabs" },
} as const;

type VariantKey = keyof typeof VARIANTS;

function readVariant(): VariantKey | null {
  if (import.meta.env.PROD) return null;
  const v = new URLSearchParams(window.location.search).get("variant");
  return v && v in VARIANTS ? (v as VariantKey) : null;
}

export function usePrototypeVariant(): VariantKey | null {
  const [variant, setVariant] = useState<VariantKey | null>(readVariant);
  useEffect(() => {
    function onPopState() {
      setVariant(readVariant());
    }
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);
  return variant;
}

export function SetFormDialogPrototype({
  variant,
  ...props
}: PrototypeProps & { variant: VariantKey }) {
  const Component = VARIANTS[variant].component;
  return (
    <>
      <Component {...props} />
      <PrototypeSwitcher current={variant} />
    </>
  );
}

function PrototypeSwitcher({ current }: { current: VariantKey }) {
  const keys = Object.keys(VARIANTS) as VariantKey[];
  const idx = keys.indexOf(current);
  const go = useCallback((next: VariantKey) => {
    const url = new URL(window.location.href);
    url.searchParams.set("variant", next);
    window.history.replaceState(null, "", url);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }, []);
  const prev = keys[(idx - 1 + keys.length) % keys.length];
  const next = keys[(idx + 1) % keys.length];
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (
        t.tagName === "INPUT" ||
        t.tagName === "TEXTAREA" ||
        t.isContentEditable
      )
        return;
      if (e.key === "ArrowLeft") go(prev);
      if (e.key === "ArrowRight") go(next);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, prev, next]);
  const meta = useMemo(() => VARIANTS[current], [current]);
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-2 rounded-full bg-foreground text-background px-3 py-1.5 shadow-lg text-sm">
      <button
        type="button"
        onClick={() => go(prev)}
        aria-label="Previous variant"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="font-mono">
        {current} ({meta.name})
      </span>
      <button type="button" onClick={() => go(next)} aria-label="Next variant">
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
