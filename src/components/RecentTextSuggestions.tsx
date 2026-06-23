import type { TextSuggestion } from "@/utils/textSuggestions";

type Props = {
  items: TextSuggestion[];
  onSelect: (text: string) => void;
  label: string;
};

export function RecentTextSuggestions({ items, onSelect, label }: Props) {
  if (!items.length) return null;

  return (
    <div className="shrink-0 pt-1" role="region" aria-label={label}>
      <div className="flex max-h-20 flex-wrap gap-1.5 overflow-y-auto custom-scrollbar">
        {items.map((s) => (
          <button
            key={s.text}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => onSelect(s.text)}
            className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-left text-[12px] text-white/75 transition-colors hover:border-ksl-blue/30 hover:bg-ksl-blue/10 hover:text-white"
          >
            <span className="truncate">{s.text}</span>
            {s.count > 1 && (
              <span className="shrink-0 text-[10px] tabular-nums text-white/35">
                {s.count}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
