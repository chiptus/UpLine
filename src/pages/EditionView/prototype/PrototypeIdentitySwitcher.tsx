import { useEffect, useState } from "react";
import "./festival-v2-identity.css";

// PROTOTYPE — throwaway switcher for #320's decided identity. Delete with the
// rest of src/pages/EditionView/prototype/ once the verdict is captured.

const VARIANTS = [
  "current",
  "festival-dark",
  "festival-light",
  "hybrid-dark",
] as const;
export type IdentityVariant = (typeof VARIANTS)[number];

const LABELS: Record<IdentityVariant, string> = {
  current: "Current identity",
  "festival-dark": "Festival v2 — dark",
  "festival-light": "Festival v2 — light (soft borders)",
  "hybrid-dark": "Hybrid — dark (coral on neutral)",
};

export function useIdentityVariant(): IdentityVariant {
  const [variant, setVariant] = useState(readVariant);

  useEffect(() => {
    function onChange() {
      setVariant(readVariant());
    }
    window.addEventListener("proto-identity-change", onChange);
    window.addEventListener("popstate", onChange);
    return () => {
      window.removeEventListener("proto-identity-change", onChange);
      window.removeEventListener("popstate", onChange);
    };
  }, []);

  return variant;
}

export function identityClass(variant: IdentityVariant) {
  if (variant === "festival-dark") return "proto-festival-v2";
  if (variant === "festival-light") return "proto-festival-v2 proto-light";
  if (variant === "hybrid-dark") return "proto-festival-v2 proto-hybrid";
  return "";
}

export function PrototypeIdentitySwitcher() {
  const variant = useIdentityVariant();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
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
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (import.meta.env.PROD) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 76,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: "#111",
        color: "#fff",
        borderRadius: 999,
        padding: "8px 14px",
        fontSize: 13,
        fontFamily: "system-ui, sans-serif",
        boxShadow: "0 6px 24px rgba(0,0,0,0.4)",
        border: "1px solid rgba(255,255,255,0.25)",
      }}
    >
      <button
        onClick={() => cycle(-1)}
        style={arrowStyle}
        aria-label="Previous identity variant"
      >
        ←
      </button>
      <span style={{ minWidth: 200, textAlign: "center" }}>
        PROTOTYPE · {LABELS[variant]}
      </span>
      <button
        onClick={() => cycle(1)}
        style={arrowStyle}
        aria-label="Next identity variant"
      >
        →
      </button>
    </div>
  );
}

const arrowStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.15)",
  color: "#fff",
  border: "none",
  borderRadius: 999,
  width: 26,
  height: 26,
  cursor: "pointer",
};

function readVariant(): IdentityVariant {
  const v = new URLSearchParams(window.location.search).get("identity");
  return (VARIANTS as readonly string[]).includes(v ?? "")
    ? (v as IdentityVariant)
    : "current";
}

function cycle(dir: number) {
  const current = readVariant();
  const next =
    VARIANTS[
      (VARIANTS.indexOf(current) + dir + VARIANTS.length) % VARIANTS.length
    ];
  const url = new URL(window.location.href);
  if (next === "current") url.searchParams.delete("identity");
  else url.searchParams.set("identity", next);
  window.history.replaceState(null, "", url);
  window.dispatchEvent(new Event("proto-identity-change"));
}
