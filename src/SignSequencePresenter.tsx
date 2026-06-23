import { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiPause,
  FiPlay,
  FiRotateCcw,
} from "react-icons/fi";

type ItemMeta = { sourceIndex?: number };

export type SignPreviewItem =
  | ({
      kind: "letter";
      value: string;
      label: string;
      imageUrl: string | null;
    } & ItemMeta)
  | ({ kind: "space" } & ItemMeta)
  | ({ kind: "other"; value: string } & ItemMeta);

type Speed = "slow" | "normal" | "fast";

const BASE_MS: Record<Speed, number> = {
  slow: 1050,
  normal: 680,
  fast: 420,
};

function stepDurationMs(item: SignPreviewItem, speed: Speed): number {
  const base = BASE_MS[speed];
  if (item.kind === "space") return base + 320;
  if (item.kind === "letter") return base;
  return Math.round(base * 0.72);
}

type Props = {
  items: SignPreviewItem[];
  sourceSnapshot: string;
  note?: string;
};

export function SignSequencePresenter({
  items,
  sourceSnapshot,
  note,
}: Props) {
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<Speed>("normal");

  const len = items.length;
  const current = len > 0 ? items[Math.min(index, len - 1)] : null;
  const highlightCharIndex =
    current?.sourceIndex !== undefined ? current.sourceIndex : index;

  useEffect(() => {
    setIndex(0);
    setPlaying(len > 0);
  }, [items, len]);

  useEffect(() => {
    if (!playing || len === 0) return;
    const item = items[index];
    if (!item) return;
    const ms = stepDurationMs(item, speed);
    const id = window.setTimeout(() => {
      setIndex((i) => {
        if (i >= len - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, ms);
    return () => window.clearTimeout(id);
  }, [playing, index, items, len, speed]);

  const progress = len > 0 ? ((index + 1) / len) * 100 : 0;

  const goPrev = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const goNext = useCallback(() => {
    setPlaying(false);
    setIndex((i) => Math.min(len - 1, i + 1));
  }, [len]);

  const togglePlay = useCallback(() => {
    setPlaying((p) => {
      if (p) return false;
      if (len === 0) return false;
      if (index >= len - 1) {
        setIndex(0);
      }
      return true;
    });
  }, [len, index]);

  const restart = useCallback(() => {
    setIndex(0);
    setPlaying(len > 0);
  }, [len]);

  const caption = useMemo(() => {
    if (!current) return "";
    if (current.kind === "letter") return `Letter ${current.label}`;
    if (current.kind === "space") return "Word space";
    return `Symbol “${current.value}”`;
  }, [current]);

  if (len === 0) {
    return (
      <div className="flex min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 px-6 text-center">
        <p className="text-[13px] text-slate-400">
          Enter text and translate to play signs here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-2.5">
      {/* Sign stage */}
      <div
        className="sign-stage relative flex flex-none flex-col overflow-hidden rounded-xl border border-white/[0.06] bg-[#06080d]"
        aria-live="polite"
        aria-atomic="true"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_40%,hsla(var(--ksl-blue)/0.12),transparent)]"
          aria-hidden
        />
        <div className="relative flex flex-1 items-center justify-center p-3 md:p-4">
          {current?.kind === "letter" ? (
            <div
              key={index}
              className="sign-presenter-step flex h-full w-full items-center justify-center"
            >
              {current.imageUrl ? (
                <div
                  className="sign-image-canvas flex w-full max-w-sm items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-white to-slate-100 p-6 shadow-[0_12px_40px_rgba(0,0,0,0.45)] md:min-h-[220px] md:p-8"
                  role="img"
                  aria-label={`Sign for letter ${current.label}`}
                >
                  <img
                    src={current.imageUrl}
                    alt=""
                    aria-hidden
                    className="max-h-[min(200px,34vh)] w-full object-contain"
                    loading="lazy"
                  />
                </div>
              ) : (
                <div className="flex min-h-[200px] w-full max-w-sm items-center justify-center rounded-2xl border border-white/20 bg-gradient-to-b from-white to-slate-100 shadow-[0_12px_40px_rgba(0,0,0,0.45)]">
                  <span className="font-display text-6xl font-semibold tracking-tight text-slate-900">
                    {current.label}
                  </span>
                </div>
              )}
            </div>
          ) : current?.kind === "space" ? (
            <div
              key={`sp-${index}`}
              className="sign-presenter-step flex flex-col items-center justify-center gap-2 text-slate-400"
            >
              <span className="text-3xl font-light">|</span>
              <span className="text-[10px] font-medium uppercase tracking-[0.2em]">
                Space
              </span>
            </div>
          ) : current?.kind === "other" ? (
            <div
              key={`o-${index}`}
              className="sign-presenter-step flex items-center justify-center"
            >
              <span className="rounded-lg border border-slate-200 bg-white px-5 py-3 font-display text-3xl text-slate-800 shadow-sm">
                {current.value}
              </span>
            </div>
          ) : null}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-white/[0.02] px-4 py-2.5">
          <p className="text-[13px] font-medium text-white/85">{caption}</p>
          <span className="shrink-0 rounded-full bg-white/[0.06] px-2.5 py-0.5 text-[11px] tabular-nums text-white/45">
            {index + 1} / {len}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 border border-slate-200/50"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={len}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-ksl-blue to-sky-400 transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-1">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            disabled={index <= 0}
            aria-label="Previous"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
          >
            <FiChevronLeft className="text-lg" />
          </button>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playing ? "Pause" : "Play"}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#90DDF5] hover:bg-[#7cd0e8] text-[#0B252E] font-bold transition-transform active:scale-95 shadow-sm"
          >
            {playing ? (
              <FiPause className="text-base" />
            ) : (
              <FiPlay className="ml-0.5 text-base" />
            )}
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={index >= len - 1}
            aria-label="Next"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
          >
            <FiChevronRight className="text-lg" />
          </button>
          <button
            type="button"
            onClick={restart}
            aria-label="Restart"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <FiRotateCcw className="text-sm" />
          </button>
        </div>

        <label className="flex items-center gap-2 text-[11px] text-slate-500">
          <span className="hidden sm:inline font-medium">Pace</span>
          <select
            value={speed}
            onChange={(e) => setSpeed(e.target.value as Speed)}
            className="cursor-pointer rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[12px] text-slate-700 outline-none focus:border-[#90DDF5] focus:ring-1 focus:ring-[#90DDF5]"
          >
            <option value="slow">Slow</option>
            <option value="normal">Normal</option>
            <option value="fast">Fast</option>
          </select>
        </label>
      </div>

      {/* Source text strip — large readable letters as signs play */}
      <div className="shrink-0 rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
          Your text
        </p>
        <div className="max-h-28 overflow-auto whitespace-pre-wrap break-all text-[20px] font-semibold leading-[1.45] tracking-wide text-slate-800 md:text-[22px] custom-scrollbar">
          {Array.from(sourceSnapshot).map((ch, i) => (
            <span
              key={i}
              className={
                i === highlightCharIndex
                  ? "rounded-md bg-amber-100 text-amber-800 border border-amber-200 px-1 py-0.5 font-bold"
                  : ch === " "
                    ? "inline-block min-w-[0.4em]"
                    : undefined
              }
            >
              {ch === " " ? "\u00a0" : ch === "\n" ? "↵\n" : ch}
            </span>
          ))}
        </div>
      </div>

      {note ? (
        <p className="shrink-0 text-center text-[10px] leading-snug text-slate-400">
          {note}
        </p>
      ) : null}
    </div>
  );
}
