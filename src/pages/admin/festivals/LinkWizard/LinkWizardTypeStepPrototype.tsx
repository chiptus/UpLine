// PROTOTYPE — throwaway. Wayfinder ticket #422: missing-type backfill step
// inside the LinkWizard. Three variants of how a per-SET type step integrates
// into a wizard whose queue is per-ARTIST, switchable via ?variant=A|B|C on
// /prototype-link-wizard-types. All data is mocked in memory; "Save" just
// mutates local state so the queues visibly shrink. Remove after decision.
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  ChevronLeft,
  ChevronRight,
  LinkIcon,
  Music,
  Wrench,
  Drama,
  Sparkles,
  Tag,
  CheckCircle2,
} from "lucide-react";

type SetType = "music" | "workshop" | "performance" | "other";

const SET_TYPES: { value: SetType; label: string; icon: typeof Music }[] = [
  { value: "music", label: "Music", icon: Music },
  { value: "workshop", label: "Workshop", icon: Wrench },
  { value: "performance", label: "Performance", icon: Drama },
  { value: "other", label: "Other", icon: Sparkles },
];

interface MockSet {
  id: string;
  name: string;
  stage: string;
  time: string;
  setType: SetType | null;
  artistIds: string[];
}

interface MockArtist {
  id: string;
  name: string;
  spotifyUrl: string | null;
  soundcloudUrl: string | null;
}

const INITIAL_SETS: MockSet[] = [
  {
    id: "s1",
    name: "Kaya Sol",
    stage: "Main Stage",
    time: "Fri 22:00",
    setType: "music",
    artistIds: ["a1"],
  },
  {
    id: "s2",
    name: "Deep Roots b2b Mоколо",
    stage: "Forest",
    time: "Sat 01:00",
    setType: null,
    artistIds: ["a2", "a3"],
  },
  {
    id: "s3",
    name: "Morning Yoga Flow",
    stage: "Healing Area",
    time: "Sat 08:00",
    setType: null,
    artistIds: [],
  },
  {
    id: "s4",
    name: "Fire Ceremony",
    stage: "Fire Circle",
    time: "Sat 21:00",
    setType: null,
    artistIds: [],
  },
  {
    id: "s5",
    name: "Nomi Perez",
    stage: "Beach",
    time: "Sun 17:00",
    setType: "music",
    artistIds: ["a4"],
  },
  {
    id: "s6",
    name: "Contact Improv Jam",
    stage: "Healing Area",
    time: "Sun 11:00",
    setType: null,
    artistIds: ["a5"],
  },
];

const INITIAL_ARTISTS: MockArtist[] = [
  {
    id: "a1",
    name: "Kaya Sol",
    spotifyUrl: null,
    soundcloudUrl: "https://soundcloud.com/kayasol",
  },
  { id: "a2", name: "Deep Roots", spotifyUrl: null, soundcloudUrl: null },
  {
    id: "a3",
    name: "Mokolo",
    spotifyUrl: "https://open.spotify.com/artist/x",
    soundcloudUrl: null,
  },
  { id: "a4", name: "Nomi Perez", spotifyUrl: null, soundcloudUrl: null },
  { id: "a5", name: "Ella Moves", spotifyUrl: null, soundcloudUrl: null },
];

function useMockData() {
  const [sets, setSets] = useState(INITIAL_SETS);
  const [artists, setArtists] = useState(INITIAL_ARTISTS);

  const artistsMissingLinks = artists.filter(
    (a) => !a.spotifyUrl || !a.soundcloudUrl,
  );
  const untypedSets = sets.filter((s) => s.setType === null);

  function saveLinks(artistId: string, spotify: string, soundcloud: string) {
    setArtists((prev) =>
      prev.map((a) =>
        a.id === artistId
          ? {
              ...a,
              spotifyUrl: spotify || a.spotifyUrl,
              soundcloudUrl: soundcloud || a.soundcloudUrl,
            }
          : a,
      ),
    );
  }

  function saveType(setId: string, setType: SetType) {
    setSets((prev) =>
      prev.map((s) => (s.id === setId ? { ...s, setType } : s)),
    );
  }

  function setsOfArtist(artistId: string) {
    return sets.filter((s) => s.artistIds.includes(artistId));
  }

  return {
    sets,
    artists,
    artistsMissingLinks,
    untypedSets,
    saveLinks,
    saveType,
    setsOfArtist,
  };
}

type MockData = ReturnType<typeof useMockData>;

function TypePicker({
  value,
  onPick,
  size = "default",
}: {
  value: SetType | null;
  onPick: (t: SetType) => void;
  size?: "default" | "sm";
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SET_TYPES.map(({ value: v, label, icon: Icon }) => (
        <button
          key={v}
          type="button"
          className={cn(
            "flex items-center gap-1.5 rounded-md border font-medium",
            size === "sm" ? "px-2 py-1 text-xs" : "px-3 py-1.5 text-sm",
            value === v
              ? "bg-accent text-accent-foreground border-accent"
              : "hover:bg-muted",
          )}
          onClick={() => onPick(v)}
        >
          <Icon className={size === "sm" ? "h-3 w-3" : "h-4 w-4"} />
          {label}
        </button>
      ))}
    </div>
  );
}

function MockLinkFields({
  artist,
  spotify,
  soundcloud,
  onSpotify,
  onSoundcloud,
}: {
  artist: MockArtist;
  spotify: string;
  soundcloud: string;
  onSpotify: (v: string) => void;
  onSoundcloud: (v: string) => void;
}) {
  return (
    <div className="space-y-3">
      {!artist.spotifyUrl && (
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-sm font-medium">Spotify Candidates</p>
          <p className="text-xs text-muted-foreground">
            (candidate cards stubbed — paste a URL)
          </p>
          <Input
            placeholder="https://open.spotify.com/artist/…"
            value={spotify}
            onChange={(e) => onSpotify(e.target.value)}
          />
        </div>
      )}
      {!artist.soundcloudUrl && (
        <div className="rounded-lg border p-3 space-y-1">
          <p className="text-sm font-medium">SoundCloud Candidates</p>
          <p className="text-xs text-muted-foreground">
            (candidate cards stubbed — paste a URL)
          </p>
          <Input
            placeholder="https://soundcloud.com/…"
            value={soundcloud}
            onChange={(e) => onSoundcloud(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}

function StepNav({
  position,
  total,
  onPrev,
  onNext,
  onSave,
  saveLabel = "Save & Next",
}: {
  position: number;
  total: number;
  onPrev: () => void;
  onNext: () => void;
  onSave: () => void;
  saveLabel?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 pt-2">
      <Button variant="outline" onClick={onPrev} disabled={position <= 1}>
        <ChevronLeft className="h-4 w-4 mr-1" />
        Previous
      </Button>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2">
          {position} of {total}
        </span>
        <Button variant="ghost" onClick={onNext}>
          Skip
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
        <Button onClick={onSave}>{saveLabel}</Button>
      </div>
    </div>
  );
}

// Mirrors main's ArtistSetCard (set-info panel from #352): border-accent card
// with name, stage, time, co-performers — here with an optional embedded
// type picker when the set is untyped.
function SetContextCard({
  set,
  currentArtistId,
  artists,
  pendingType,
  onPickType,
}: {
  set: MockSet;
  currentArtistId?: string;
  artists: MockArtist[];
  pendingType?: SetType | null;
  onPickType?: (t: SetType) => void;
}) {
  const coPerformers = set.artistIds
    .filter((id) => id !== currentArtistId)
    .map((id) => artists.find((a) => a.id === id)?.name)
    .filter(Boolean);
  const untyped = set.setType === null;
  return (
    <div className="border-l-2 border-primary pl-4 py-2 space-y-2">
      <div>
        <h4 className="font-semibold text-sm">{set.name}</h4>
        <p className="text-xs text-muted-foreground">Stage: {set.stage}</p>
      </div>
      <div className="text-xs text-muted-foreground">{set.time}</div>
      {coPerformers.length > 0 && (
        <p className="text-xs text-muted-foreground">
          With: {coPerformers.join(", ")}
        </p>
      )}
      {untyped && onPickType ? (
        <div className="rounded-lg border border-dashed p-2 space-y-1.5">
          <p className="text-xs font-medium flex items-center gap-1">
            <Tag className="h-3.5 w-3.5" />
            This set has no type yet
          </p>
          <TypePicker
            size="sm"
            value={pendingType ?? null}
            onPick={onPickType}
          />
        </div>
      ) : (
        !untyped && (
          <Badge variant="outline" className="text-xs">
            {SET_TYPES.find((t) => t.value === set.setType)?.label}
          </Badge>
        )
      )}
    </div>
  );
}

function AllDone({ children }: { children: string }) {
  return (
    <p className="flex items-center gap-2 text-muted-foreground py-6 justify-center">
      <CheckCircle2 className="h-5 w-5 text-green-600" />
      {children}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Variant A — Mixed queue: link-items and type-items interleave in ONE queue.
// An artist whose set is also untyped gets a combined step (links + type
// together); 0-artist untyped sets appear as their own "set" items in the
// same one-by-one flow. One table below shows the whole mixed queue with a
// kind badge per row.
// ---------------------------------------------------------------------------

type QueueItem =
  | { kind: "artist"; artist: MockArtist; untypedSets: MockSet[] }
  | { kind: "set"; set: MockSet };

function VariantA({ data }: { data: MockData }) {
  const queue: QueueItem[] = useMemo(() => {
    const artistItems: QueueItem[] = data.artistsMissingLinks.map((artist) => ({
      kind: "artist",
      artist,
      untypedSets: data
        .setsOfArtist(artist.id)
        .filter((s) => s.setType === null),
    }));
    const coveredSetIds = new Set(
      artistItems.flatMap((i) =>
        i.kind === "artist" ? i.untypedSets.map((s) => s.id) : [],
      ),
    );
    const setItems: QueueItem[] = data.untypedSets
      .filter((s) => !coveredSetIds.has(s.id))
      .map((set) => ({ kind: "set", set }));
    return [...artistItems, ...setItems];
  }, [data]);

  const [cursor, setCursor] = useState(0);
  const idx = Math.min(cursor, Math.max(0, queue.length - 1));
  const item = queue[idx];

  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [pendingTypes, setPendingTypes] = useState<Record<string, SetType>>({});

  function resetInputs() {
    setSpotify("");
    setSoundcloud("");
    setPendingTypes({});
  }
  function goTo(i: number) {
    setCursor(Math.max(0, Math.min(i, queue.length - 1)));
    resetInputs();
  }
  function save() {
    if (!item) return;
    if (item.kind === "artist") {
      data.saveLinks(item.artist.id, spotify, soundcloud);
      for (const [setId, t] of Object.entries(pendingTypes)) {
        data.saveType(setId, t);
      }
    } else {
      const t = pendingTypes[item.set.id];
      if (t) data.saveType(item.set.id, t);
    }
    resetInputs();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard
            {item &&
              ` - ${item.kind === "artist" ? item.artist.name : item.set.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queue.length === 0 ? (
            <AllDone>Every artist has links and every set has a type.</AllDone>
          ) : (
            item && (
              <div className="space-y-4">
                {item.kind === "artist" ? (
                  <>
                    <Badge variant="secondary">Artist · missing links</Badge>
                    <MockLinkFields
                      artist={item.artist}
                      spotify={spotify}
                      soundcloud={soundcloud}
                      onSpotify={setSpotify}
                      onSoundcloud={setSoundcloud}
                    />
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base">
                          {item.artist.name} - Festival Set
                          {data.setsOfArtist(item.artist.id).length !== 1
                            ? "s"
                            : ""}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {data.setsOfArtist(item.artist.id).map((set) => (
                          <SetContextCard
                            key={set.id}
                            set={set}
                            currentArtistId={item.artist.id}
                            artists={data.artists}
                            pendingType={pendingTypes[set.id] ?? null}
                            onPickType={(t) =>
                              setPendingTypes((p) => ({ ...p, [set.id]: t }))
                            }
                          />
                        ))}
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  <>
                    <Badge variant="secondary">
                      Set · missing type · no linked artists
                    </Badge>
                    <SetContextCard
                      set={item.set}
                      artists={data.artists}
                      pendingType={pendingTypes[item.set.id] ?? null}
                      onPickType={(t) =>
                        setPendingTypes((p) => ({ ...p, [item.set.id]: t }))
                      }
                    />
                  </>
                )}
                <StepNav
                  position={idx + 1}
                  total={queue.length}
                  onPrev={() => goTo(idx - 1)}
                  onNext={() => goTo(idx + 1)}
                  onSave={save}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Remaining Items</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-sm">
            <tbody>
              {queue.map((q, i) => (
                <tr
                  key={q.kind === "artist" ? q.artist.id : q.set.id}
                  className={cn(
                    "border-b cursor-pointer hover:bg-muted/50",
                    i === idx && "bg-muted",
                  )}
                  onClick={() => goTo(i)}
                >
                  <td className="py-2 pr-2">
                    <Badge
                      variant={q.kind === "artist" ? "secondary" : "outline"}
                    >
                      {q.kind === "artist" ? "artist" : "set"}
                    </Badge>
                  </td>
                  <td className="py-2">
                    {q.kind === "artist" ? q.artist.name : q.set.name}
                  </td>
                  <td className="py-2 text-muted-foreground">
                    {q.kind === "artist"
                      ? [
                          !q.artist.spotifyUrl && "Spotify",
                          !q.artist.soundcloudUrl && "SoundCloud",
                          q.untypedSets.length > 0 && "set type",
                        ]
                          .filter(Boolean)
                          .join(", ")
                      : "set type"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant B — Two sections: the artist link queue stays exactly as today; a
// second card "Sets missing a type" sits below with an inline per-row type
// picker (batch feel, no step navigation). Nothing interleaves.
// ---------------------------------------------------------------------------

function VariantB({ data }: { data: MockData }) {
  const artists = data.artistsMissingLinks;
  const [cursor, setCursor] = useState(0);
  const idx = Math.min(cursor, Math.max(0, artists.length - 1));
  const artist = artists[idx];
  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");

  function goTo(i: number) {
    setCursor(Math.max(0, Math.min(i, artists.length - 1)));
    setSpotify("");
    setSoundcloud("");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard{artist && ` - ${artist.name}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {artists.length === 0 ? (
            <AllDone>All artists in this edition have both links set.</AllDone>
          ) : (
            artist && (
              <div className="space-y-4">
                <MockLinkFields
                  artist={artist}
                  spotify={spotify}
                  soundcloud={soundcloud}
                  onSpotify={setSpotify}
                  onSoundcloud={setSoundcloud}
                />
                <StepNav
                  position={idx + 1}
                  total={artists.length}
                  onPrev={() => goTo(idx - 1)}
                  onNext={() => goTo(idx + 1)}
                  onSave={() => {
                    data.saveLinks(artist.id, spotify, soundcloud);
                    setSpotify("");
                    setSoundcloud("");
                  }}
                />
              </div>
            )
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Sets missing a type
            {data.untypedSets.length > 0 && (
              <Badge variant="secondary">{data.untypedSets.length}</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data.untypedSets.length === 0 ? (
            <AllDone>Every set has a type.</AllDone>
          ) : (
            <div className="space-y-3">
              {data.untypedSets.map((set) => (
                <div
                  key={set.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">{set.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {set.stage} · {set.time} ·{" "}
                      {set.artistIds.length === 0
                        ? "no linked artists"
                        : `${set.artistIds.length} artist(s)`}
                    </p>
                  </div>
                  <TypePicker
                    size="sm"
                    value={null}
                    onPick={(t) => data.saveType(set.id, t)}
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Variant C — Piggyback + sweep: the artist queue is unchanged, but when the
// current artist belongs to an untyped set, a type banner rides along inside
// that step (answered inline, saved with the step). After the artist queue,
// the SAME one-by-one flow continues into a trailing sweep of the untyped
// sets nobody's artist step covered (the 0-artist ones).
// ---------------------------------------------------------------------------

function VariantC({ data }: { data: MockData }) {
  const artists = data.artistsMissingLinks;
  const artistSetIds = new Set(
    artists.flatMap((a) => data.setsOfArtist(a.id).map((s) => s.id)),
  );
  const sweepSets = data.untypedSets.filter((s) => !artistSetIds.has(s.id));
  const total = artists.length + sweepSets.length;

  const [cursor, setCursor] = useState(0);
  const idx = Math.min(cursor, Math.max(0, total - 1));
  const inSweep = idx >= artists.length;
  const artist = !inSweep ? artists[idx] : undefined;
  const sweepSet = inSweep ? sweepSets[idx - artists.length] : undefined;
  const untypedOfArtist = artist
    ? data.setsOfArtist(artist.id).filter((s) => s.setType === null)
    : [];

  const [spotify, setSpotify] = useState("");
  const [soundcloud, setSoundcloud] = useState("");
  const [pendingTypes, setPendingTypes] = useState<Record<string, SetType>>({});

  function goTo(i: number) {
    setCursor(Math.max(0, Math.min(i, total - 1)));
    setSpotify("");
    setSoundcloud("");
    setPendingTypes({});
  }

  function save() {
    if (artist) {
      data.saveLinks(artist.id, spotify, soundcloud);
      for (const [setId, t] of Object.entries(pendingTypes)) {
        data.saveType(setId, t);
      }
    } else if (sweepSet) {
      const t = pendingTypes[sweepSet.id];
      if (t) data.saveType(sweepSet.id, t);
    }
    setSpotify("");
    setSoundcloud("");
    setPendingTypes({});
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LinkIcon className="h-5 w-5" />
            Link Wizard{artist && ` - ${artist.name}`}
            {sweepSet && ` - ${sweepSet.name}`}
            {inSweep && <Badge variant="secondary">type sweep</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {total === 0 ? (
            <AllDone>Every artist has links and every set has a type.</AllDone>
          ) : (
            <div className="space-y-4">
              {artist && (
                <>
                  {untypedOfArtist.map((set) => (
                    <div
                      key={set.id}
                      className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2"
                    >
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Tag className="h-4 w-4" />
                        While you&apos;re here: &ldquo;{set.name}&rdquo; has no
                        type yet
                      </p>
                      <TypePicker
                        value={pendingTypes[set.id] ?? null}
                        onPick={(t) =>
                          setPendingTypes((p) => ({ ...p, [set.id]: t }))
                        }
                      />
                    </div>
                  ))}
                  <MockLinkFields
                    artist={artist}
                    spotify={spotify}
                    soundcloud={soundcloud}
                    onSpotify={setSpotify}
                    onSoundcloud={setSoundcloud}
                  />
                </>
              )}
              {sweepSet && (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-sm text-muted-foreground">
                    {sweepSet.stage} · {sweepSet.time} · no linked artists —
                    only its type is needed
                  </p>
                  <TypePicker
                    value={pendingTypes[sweepSet.id] ?? null}
                    onPick={(t) =>
                      setPendingTypes((p) => ({ ...p, [sweepSet.id]: t }))
                    }
                  />
                </div>
              )}
              <StepNav
                position={idx + 1}
                total={total}
                onPrev={() => goTo(idx - 1)}
                onNext={() => goTo(idx + 1)}
                onSave={save}
                saveLabel={inSweep ? "Save type & Next" : "Save & Next"}
              />
              {!inSweep && sweepSets.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  After the artists, {sweepSets.length} artist-less set(s) still
                  need a type — the wizard continues into them.
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Switcher plumbing (same pattern as the #399 prototype)
// ---------------------------------------------------------------------------

const VARIANTS = {
  A: { component: VariantA, name: "Mixed queue" },
  B: { component: VariantB, name: "Two sections" },
  C: { component: VariantC, name: "Piggyback + sweep" },
} as const;

type VariantKey = keyof typeof VARIANTS;

function readVariant(): VariantKey | null {
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

export function LinkWizardTypeStepPrototype({
  variant,
}: {
  variant: VariantKey;
}) {
  const data = useMockData();
  const Component = VARIANTS[variant].component;
  return (
    <>
      <Component data={data} key={variant} />
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
