import { FiCheck, FiX } from "react-icons/fi";

type Props = {
  suggestion: string;
  approvedText: string | null;
  onApprove: () => void;
  onDismiss: () => void;
  labels: {
    suggested: string;
    approved: string;
    approve: string;
    dismiss: string;
  };
};

export function TranslationSuggestionBar({
  suggestion,
  approvedText,
  onApprove,
  onDismiss,
  labels,
}: Props) {
  const showPending = suggestion && suggestion !== approvedText;

  if (!showPending && !approvedText) return null;

  return (
    <div className="mt-3 shrink-0 space-y-2 border-t border-white/[0.06] pt-3">
      {showPending && (
        <div className="rounded-xl border border-ksl-blue/20 bg-ksl-blue/[0.06] p-3">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-[0.12em] text-ksl-blue/80">
            {labels.suggested}
          </p>
          <p className="mb-2.5 text-[14px] leading-snug text-white/90 break-words">
            {suggestion}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onApprove}
              className="inline-flex items-center gap-1 rounded-lg bg-ksl-blue px-3 py-1.5 text-[12px] font-medium text-white hover:bg-ksl-blue/90"
            >
              <FiCheck className="text-xs" />
              {labels.approve}
            </button>
            <button
              type="button"
              onClick={onDismiss}
              className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-1.5 text-[12px] font-medium text-white/60 hover:bg-white/[0.05] hover:text-white/80"
            >
              <FiX className="text-xs" />
              {labels.dismiss}
            </button>
          </div>
        </div>
      )}
      {approvedText && (
        <p className="text-[12px] text-ksl-yellow/80">
          {labels.approved}:{" "}
          <span className="text-white/85">{approvedText}</span>
        </p>
      )}
    </div>
  );
}
