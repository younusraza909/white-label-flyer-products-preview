"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
//
/* ─── Types ──────────────────────────────────────────────────────────── */
interface Product {
  id: number;
  flyer_product_id: string;
  image_url: string;
  product_white_label_image: string;
  name: string;
  is_accepted: boolean | null;
  comments: string;
  reviewed_at: string | null;
}

type StatusFilter = "all" | "accepted" | "rejected" | "pending";

function matchesStatusFilter(product: Product, filter: StatusFilter): boolean {
  switch (filter) {
    case "accepted":
      return product.is_accepted === true;
    case "rejected":
      return product.is_accepted === false;
    case "pending":
      return product.is_accepted === null;
    default:
      return true;
  }
}

const FILTER_LABELS: Record<StatusFilter, string> = {
  all: "All",
  accepted: "Approved",
  rejected: "Rejected",
  pending: "Pending",
};

/* ─── Token ──────────────────────────────────────────────────────────── */
const T =
  "transition-[background-color,border-color,box-shadow,transform,opacity] duration-200 ease-out";

/* ════════════════════════════════════════════════════════════════════════
   STAT CARD  — stretched full width, left-accent bar, 2026 glass look
════════════════════════════════════════════════════════════════════════ */
const STAT_CFG = {
  blue: {
    accent: "#2196f3",
    glow: "rgba(33,150,243,0.18)",
    bg: "rgba(33,150,243,0.07)",
    border: "rgba(33,150,243,0.2)",
    text: "#60b8ff",
  },
  green: {
    accent: "#4caf50",
    glow: "rgba(76,175,80,0.18)",
    bg: "rgba(76,175,80,0.07)",
    border: "rgba(76,175,80,0.2)",
    text: "#81c784",
  },
  red: {
    accent: "#f44336",
    glow: "rgba(244,67,54,0.18)",
    bg: "rgba(244,67,54,0.07)",
    border: "rgba(244,67,54,0.2)",
    text: "#ef5350",
  },
  yellow: {
    accent: "#ffc107",
    glow: "rgba(255,193,7,0.18)",
    bg: "rgba(255,193,7,0.07)",
    border: "rgba(255,193,7,0.2)",
    text: "#ffd54f",
  },
} as const;

function StatCard({
  label,
  subtitle,
  value,
  color,
  active,
  onClick,
}: {
  label: string;
  subtitle: string;
  value: number;
  color: keyof typeof STAT_CFG;
  active: boolean;
  onClick: () => void;
}) {
  const c = STAT_CFG[color];
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "relative overflow-hidden rounded-xl p-4 text-left",
        T,
        "group cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,150,243,0.45)]",
        active && "scale-[1.01]",
      )}
      style={{
        background: active ? c.bg : "rgba(255,255,255,0.02)",
        border: `0.5px solid ${active ? c.accent : c.border}`,
        boxShadow: active
          ? `inset 0 1px 0 rgba(255,255,255,0.08), 0 0 16px ${c.glow}`
          : `inset 0 1px 0 rgba(255,255,255,0.05)`,
      }}
    >
      {/* left accent stripe */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
        style={{ background: c.accent, boxShadow: `0 0 8px ${c.glow}` }}
      />
      {/* subtle inner glow on hover */}
      <div
        className={cn(
          "absolute inset-0 rounded-xl",
          active ? "opacity-100" : "opacity-0 group-hover:opacity-100",
        )}
        style={{
          background: `radial-gradient(ellipse at 30% 50%, ${c.glow}, transparent 70%)`,
        }}
      />
      <div className="relative w-full">
        <p
          className="w-full text-center text-[28px] font-[600] leading-none tabular-nums"
          style={{ color: c.text }}
        >
          {value.toLocaleString()}
        </p>
        <p
          className="mt-2 text-center text-[10px] font-bold uppercase tracking-[0.8px]"
          style={{ color: active ? c.text : "rgba(255,255,255,0.35)" }}
        >
          {subtitle}
        </p>
      </div>
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   IMAGE PANEL  — labeled card, absolute-positioned image
════════════════════════════════════════════════════════════════════════ */
function ImagePanel({
  label,
  emoji,
  subtitle,
  src,
  alt,
}: {
  label: string;
  emoji: string;
  subtitle: string;
  src?: string;
  alt: string;
}) {
  const [broken, setBroken] = useState(false);
  const [imgReady, setImgReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const hasSrc = Boolean(src && src.trim() !== "");
  const showImg = hasSrc && !broken;
  const showLoader = showImg && !imgReady;

  useEffect(() => {
    setBroken(false);
    setImgReady(false);

    // If image is already complete (cached), set ready immediately
    if (imgRef.current?.complete) {
      setImgReady(true);
    }
  }, [src]);

  return (
    <div
      className={cn(
        /* min-w-0 + basis-0: flex row otherwise shrinks panel to ~0 width when children are all position:absolute */
        "relative flex min-w-0 basis-0 flex-1 flex-col overflow-hidden rounded-xl",
        "border-[0.5px] border-[rgba(255,255,255,0.09)]",
        T,
        "hover:border-[rgba(255,255,255,0.16)]",
      )}
      style={{ background: "rgba(13,18,40,0.85)" }}
      aria-busy={showLoader}
    >
      {/* image area — fills panel; in-flow sizing so absolute layers get a real width/height */}
      <div className="relative min-h-0 w-full min-w-0 flex-1">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,#131d30_0%,#0d1220_100%)]" />
        {showImg ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={imgRef}
              key={src}
              src={src}
              alt={alt}
              className={cn(
                "absolute inset-0 h-full w-full object-contain p-3 duration-300",
                imgReady ? "opacity-100" : "opacity-0",
              )}
              onLoad={() => setImgReady(true)}
              onError={() => {
                setBroken(true);
                setImgReady(true);
              }}
            />

            {showLoader && (
              <div
                className="absolute inset-0 z-10 flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#131d30_0%,#0d1220_100%)]"
                aria-live="polite"
                aria-label="Loading image"
              >
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <Loader2
                    className="h-8 w-8 shrink-0 animate-spin text-[#2196f3]"
                    aria-hidden
                  />
                  <span className="block max-w-[90%] text-[11px] text-[rgba(255,255,255,0.4)]">
                    Loading image…
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-[rgba(255,255,255,0.35)]">
            <span className="text-[2rem] leading-none opacity-60" aria-hidden>
              {emoji}
            </span>
            <span className="text-[11px]">
              {broken ? "Image failed to load" : "No image available"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   NAV BUTTON
════════════════════════════════════════════════════════════════════════ */
function NavBtn({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-bold",
        "bg-[rgba(255,255,255,0.07)] border-[0.5px] border-[rgba(255,255,255,0.1)] text-[rgba(255,255,255,0.65)]",
        T,
        "hover:bg-[rgba(255,255,255,0.12)] hover:border-[rgba(255,255,255,0.2)] hover:text-white",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(33,150,243,0.45)]",
        "active:scale-[0.96] disabled:opacity-30 disabled:cursor-not-allowed",
      )}
    >
      {children}
    </button>
  );
}

/* ════════════════════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════════════════ */
export default function ReviewPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentIndex, setIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState("");
  const commentRef = useRef<HTMLTextAreaElement>(null);

  const filteredProducts = useMemo(
    () => products.filter((p) => matchesStatusFilter(p, statusFilter)),
    [products, statusFilter],
  );

  /* fetch */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data);

          // Restore progress from localStorage
          const saved = localStorage.getItem("flyer_review_index");
          if (saved) {
            const idx = parseInt(saved, 10);
            if (idx >= 0 && idx < data.length) {
              setIdx(idx);
              setComment(data[idx]?.comments || "");
            } else {
              setComment(data[0]?.comments || "");
            }
          } else {
            setComment(data[0]?.comments || "");
          }
        }
      } catch (err) {
        console.error("Fetch failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* Persist progress to localStorage */
  useEffect(() => {
    if (filteredProducts.length > 0) {
      localStorage.setItem("flyer_review_index", currentIndex.toString());
    }
  }, [currentIndex, filteredProducts.length]);

  const changeFilter = useCallback(
    (filter: StatusFilter) => {
      setStatusFilter(filter);
      setIdx(0);
      const next = products.filter((p) => matchesStatusFilter(p, filter));
      setComment(next[0]?.comments || "");
    },
    [products],
  );

  const cur = filteredProducts[currentIndex];

  /* stats */
  const stats = (() => {
    let accepted = 0,
      rejected = 0;
    for (const p of products) {
      if (p.is_accepted === true) accepted++;
      if (p.is_accepted === false) rejected++;
    }
    const reviewed = accepted + rejected;
    return {
      reviewed,
      accepted,
      rejected,
      pending: products.length - reviewed,
    };
  })();

  /* save */
  const saveReview = useCallback(
    async (isAccepted: boolean) => {
      if (!cur || saving) return;
      setSaving(true);
      const payload = {
        id: cur.id,
        flyer_product_id: cur.flyer_product_id,
        is_accepted: isAccepted,
        comments: comment,
      };
      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updatedProducts = products.map((p) =>
            p.id === cur.id
              ? {
                  ...p,
                  is_accepted: isAccepted,
                  comments: comment,
                  reviewed_at: new Date().toISOString(),
                }
              : p,
          );
          setProducts(updatedProducts);

          const nextFiltered = updatedProducts.filter((p) =>
            matchesStatusFilter(p, statusFilter),
          );
          const savedStillAtIndex = nextFiltered[currentIndex]?.id === cur.id;
          let nextIndex = currentIndex;
          if (savedStillAtIndex && currentIndex < nextFiltered.length - 1) {
            nextIndex = currentIndex + 1;
          } else if (currentIndex >= nextFiltered.length) {
            nextIndex = Math.max(0, nextFiltered.length - 1);
          }
          setIdx(nextIndex);
          setComment(nextFiltered[nextIndex]?.comments || "");
        }
      } catch (err) {
        console.error("Save failed", err);
      } finally {
        setSaving(false);
      }
    },
    [cur, currentIndex, comment, saving, products, statusFilter],
  );

  /* navigate */
  const navigate = useCallback(
    (dir: "next" | "prev") => {
      setIdx((prev) => {
        const next =
          dir === "next"
            ? Math.min(prev + 1, filteredProducts.length - 1)
            : Math.max(prev - 1, 0);
        if (next !== prev) setComment(filteredProducts[next]?.comments || "");
        return next;
      });
    },
    [filteredProducts],
  );

  /* keyboard */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (document.activeElement === commentRef.current) {
        if (e.key === "Escape") commentRef.current?.blur();
        return;
      }
      switch (e.key) {
        case "ArrowRight":
          e.preventDefault();
          navigate("next");
          break;
        case "ArrowLeft":
          e.preventDefault();
          navigate("prev");
          break;
        case "a":
        case "A":
          e.preventDefault();
          saveReview(true);
          break;
        case "s":
        case "S":
          e.preventDefault();
          saveReview(false);
          break;
        case "c":
        case "C":
          e.preventDefault();
          commentRef.current?.focus();
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate, saveReview]);

  /* ── loading / empty ── */
  if (loading)
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#080c20]">
        <div className="flex items-center gap-3 text-[rgba(255,255,255,0.5)]">
          <Loader2
            className="h-5 w-5 animate-spin text-[#2196f3]"
            aria-hidden
          />
          <span className="text-sm tracking-wide">Loading products…</span>
        </div>
      </div>
    );

  if (!products.length)
    return (
      <div className="flex h-dvh w-full items-center justify-center bg-[#080c20]">
        <p className="text-sm text-[rgba(255,255,255,0.4)]">
          No products found.
        </p>
      </div>
    );

  const filterEmpty = filteredProducts.length === 0;

  /* derived */
  const pct = filterEmpty
    ? 0
    : Math.round(((currentIndex + 1) / filteredProducts.length) * 100);
  const daysAgo = cur?.reviewed_at
    ? Math.floor((Date.now() - new Date(cur.reviewed_at).getTime()) / 864e5)
    : null;

  const STATUS = {
    accepted: {
      bg: "rgba(76,175,80,0.12)",
      border: "rgba(76,175,80,0.3)",
      dot: "#4caf50",
      text: "#81c784",
      label: "Previously Accepted",
    },
    rejected: {
      bg: "rgba(244,67,54,0.12)",
      border: "rgba(244,67,54,0.3)",
      dot: "#f44336",
      text: "#ef5350",
      label: "Previously Rejected",
    },
    pending: {
      bg: "rgba(255,193,7,0.12)",
      border: "rgba(255,193,7,0.3)",
      dot: "#ffc107",
      text: "#ffd54f",
      label: "Not yet reviewed",
    },
  } as const;
  const sk =
    cur?.is_accepted === true
      ? "accepted"
      : cur?.is_accepted === false
        ? "rejected"
        : "pending";
  const ss = STATUS[sk];

  /* ══════════════════════════════════════════════════════════════════════
     RENDER  — h-dvh, flex-col, overflow-hidden
     Only the image row is flex-1; everything else is shrink-0.
  ════════════════════════════════════════════════════════════════════════ */
  return (
    <main
      className="flex h-dvh max-h-dvh flex-col overflow-hidden font-sans text-white"
      style={{
        background:
          "linear-gradient(160deg, #080c20 0%, #0d1530 50%, #0a1228 100%)",
      }}
    >
      {/* ── HEADER ───────────────────────────────────────────────────── */}
      <header
        className="shrink-0 px-6 pt-3 pb-3"
        style={{
          borderBottom: "0.5px solid rgba(255,255,255,0.07)",
          background: "rgba(8,12,32,0.7)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          boxShadow:
            "0 1px 0 rgba(255,255,255,0.04), 0 4px 24px rgba(0,0,0,0.3)",
        }}
      >
        {/* Stat cards — clickable filters, full width, always 4 columns */}
        <div className="grid grid-cols-4 gap-2.5">
          <StatCard
            label="Reviewed"
            subtitle={`All`}
            value={stats.reviewed}
            color="blue"
            active={statusFilter === "all"}
            onClick={() => changeFilter("all")}
          />
          <StatCard
            label="Accepted"
            subtitle={`Approved`}
            value={stats.accepted}
            color="green"
            active={statusFilter === "accepted"}
            onClick={() => changeFilter("accepted")}
          />
          <StatCard
            label="Rejected"
            subtitle={`Rejected`}
            value={stats.rejected}
            color="red"
            active={statusFilter === "rejected"}
            onClick={() => changeFilter("rejected")}
          />
          <StatCard
            label="Pending"
            subtitle={`Pending`}
            value={stats.pending}
            color="yellow"
            active={statusFilter === "pending"}
            onClick={() => changeFilter("pending")}
          />
        </div>
      </header>

      {/* ── CONTENT ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 flex-col px-6 pt-3 pb-3 gap-2.5">
        {filterEmpty ? (
          <div className="flex flex-1 items-center justify-center rounded-xl border-[0.5px] border-[rgba(255,255,255,0.07)] bg-[rgba(255,255,255,0.02)]">
            <p className="text-sm text-[rgba(255,255,255,0.4)]">
              No{" "}
              {statusFilter === "all"
                ? "products"
                : `${FILTER_LABELS[statusFilter].toLowerCase()} products`}{" "}
              to show.
            </p>
          </div>
        ) : (
          <>
            {/* ── Meta bar: product IDs (left) + progress (right) ── */}
            <div
              className="shrink-0 flex items-center justify-between rounded-xl px-4 py-2.5"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "0.5px solid rgba(255,255,255,0.07)",
              }}
            >
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.4)] mb-0.5">
                    Product ID
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-[#60b8ff]">
                    {cur.flyer_product_id}
                  </p>
                </div>
                <div className="h-6 w-px bg-[rgba(255,255,255,0.08)]" />
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.4)] mb-0.5">
                    Database ID
                  </p>
                  <p className="font-mono text-[13px] font-semibold text-[#60b8ff]">
                    #{cur.id}
                  </p>
                </div>
              </div>

              {/* progress */}
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-medium tabular-nums text-[rgba(255,255,255,0.45)]">
                  {currentIndex + 1}{" "}
                  <span className="text-[rgba(255,255,255,0.25)]">/</span>{" "}
                  {filteredProducts.length}
                </span>
                <div
                  className="h-[5px] w-[160px] overflow-hidden rounded-full"
                  style={{ background: "rgba(255,255,255,0.08)" }}
                >
                  <div
                    className="h-full rounded-full transition-[width] duration-500 ease-out"
                    style={{
                      width: `${pct}%`,
                      background:
                        "linear-gradient(90deg,#2196f3 0%,#00bfa5 60%,#4caf50 100%)",
                      boxShadow: "0 0 6px rgba(33,150,243,0.5)",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ── Image panels — flex-1 absorbs all leftover height ── */}
            <div className="flex min-h-0 min-w-0 w-full flex-1 gap-3">
              <ImagePanel
                label="Original Image"
                emoji="🖼️"
                subtitle="image_url · Product photo"
                src={cur.image_url}
                alt="Product photo"
              />
              <ImagePanel
                label="White Label Image"
                emoji="📄"
                subtitle="product_white_label_image · Branded version"
                src={cur.product_white_label_image}
                alt="White label"
              />
            </div>

            {/* ── Status badge ── */}
            <div
              className={cn(
                "shrink-0 flex items-center gap-3 rounded-xl px-4 py-2.5",
                T,
              )}
              style={{ background: ss.bg, border: `0.5px solid ${ss.border}` }}
            >
              <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
                  style={{ background: ss.dot }}
                />
                <span
                  className="relative inline-flex h-2.5 w-2.5 rounded-full"
                  style={{ background: ss.dot }}
                />
              </span>
              <span
                className="flex-1 text-[13px] font-semibold"
                style={{ color: ss.text }}
              >
                {ss.label}
              </span>
              {daysAgo !== null && (
                <span className="text-[11px] text-[rgba(255,255,255,0.4)]">
                  Reviewed {daysAgo} day{daysAgo === 1 ? "" : "s"} ago
                </span>
              )}
            </div>

            {/* ── Comment ── */}
            <div className="shrink-0">
              <label
                htmlFor="review-comment"
                className="mb-1.5 block text-[9px] font-bold uppercase tracking-[1.2px] text-[rgba(255,255,255,0.4)]"
              >
                Add comment
              </label>
              <textarea
                id="review-comment"
                ref={commentRef}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Sample comment about the product review..."
                rows={2}
                className={cn(
                  "w-full resize-none rounded-xl px-3.5 py-2.5 text-[13px] leading-snug",
                  "placeholder:text-[rgba(255,255,255,0.38)]",
                  T,
                  "focus:outline-none focus:ring-2 focus:ring-[rgba(33,150,243,0.35)]",
                )}
                style={{
                  color: "#ffffff",
                  caretColor: "#ffffff",
                  background: "rgba(255,255,255,0.05)",
                  border: "0.5px solid rgba(255,255,255,0.1)",
                  boxShadow: "inset 0 1px 3px rgba(0,0,0,0.25)",
                }}
              />
            </div>

            {/* ── Accept / Reject ── */}
            <div className="grid shrink-0 grid-cols-2 gap-3">
              {/* Accept */}
              <button
                type="button"
                onClick={() => saveReview(true)}
                disabled={saving}
                className={cn(
                  "relative overflow-hidden flex items-center justify-center gap-2 rounded-xl py-[20px] text-[13px] font-semibold uppercase tracking-[0.8px]",
                  T,
                  "hover:shadow-[0_0_18px_rgba(76,175,80,0.25)] active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(76,175,80,0.4)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(76,175,80,0.22) 0%, rgba(56,142,60,0.18) 100%)",
                  border: "0.5px solid rgba(76,175,80,0.45)",
                  color: "#81c784",
                }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <span aria-hidden>✓</span>
                )}
                <span>Accept (A)</span>
              </button>

              {/* Reject */}
              <button
                type="button"
                onClick={() => saveReview(false)}
                disabled={saving}
                className={cn(
                  "relative overflow-hidden flex items-center justify-center gap-2 rounded-xl py-3 text-[13px] font-semibold uppercase tracking-[0.8px]",
                  T,
                  "hover:shadow-[0_0_18px_rgba(244,67,54,0.25)] active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(244,67,54,0.4)]",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                )}
                style={{
                  background:
                    "linear-gradient(135deg, rgba(244,67,54,0.22) 0%, rgba(183,28,28,0.18) 100%)",
                  border: "0.5px solid rgba(244,67,54,0.45)",
                  color: "#ef9a9a",
                }}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <span aria-hidden>✕</span>
                )}
                <span>Reject (S)</span>
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
