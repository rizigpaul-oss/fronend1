import { useEffect, useRef } from "react";
import { stripDisplayMarkup } from "@/utils/plainText";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  onFocus?: () => void;
};

/**
 * Multiline plain-text input without browser autofill/suggestion dropdowns.
 * Uses contentEditable instead of <textarea> so Chrome/Edge won't inject saved entries.
 */
export function PlainTextEditor({
  value,
  onChange,
  placeholder,
  className,
  onFocus,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const skipSyncRef = useRef(false);

  useEffect(() => {
    if (skipSyncRef.current) {
      skipSyncRef.current = false;
      return;
    }
    const el = ref.current;
    if (!el) return;
    const current = el.textContent ?? "";
    if (current !== value) {
      el.textContent = value;
    }
  }, [value]);

  const emitChange = (raw: string) => {
    const cleaned = stripDisplayMarkup(raw);
    skipSyncRef.current = true;
    onChange(cleaned);
    const el = ref.current;
    if (el && el.textContent !== cleaned) {
      el.textContent = cleaned;
      skipSyncRef.current = false;
    }
  };

  return (
    <div
      ref={ref}
      role="textbox"
      aria-multiline="true"
      aria-label={placeholder}
      contentEditable
      suppressContentEditableWarning
      translate="no"
      spellCheck={false}
      data-lpignore="true"
      data-1p-ignore="true"
      data-ms-editor="false"
      data-form-type="other"
      onFocus={onFocus}
      onInput={() => emitChange(ref.current?.textContent ?? "")}
      onPaste={(e) => {
        e.preventDefault();
        const pasted = stripDisplayMarkup(
          e.clipboardData.getData("text/plain")
        );
        const sel = window.getSelection();
        if (!sel || sel.rangeCount === 0) {
          emitChange((ref.current?.textContent ?? "") + pasted);
          return;
        }
        sel.deleteFromDocument();
        sel.getRangeAt(0).insertNode(document.createTextNode(pasted));
        sel.collapseToEnd();
        emitChange(ref.current?.textContent ?? "");
      }}
      data-placeholder={placeholder}
      className={cn(
        "outline-none whitespace-pre-wrap break-words [overflow-wrap:anywhere]",
        "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/50 empty:before:pointer-events-none",
        className
      )}
    />
  );
}
