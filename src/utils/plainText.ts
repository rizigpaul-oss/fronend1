/**
 * Strip HTML/XML-like tags and entities from user-visible plain text.
 * Blocks browser autofill junk (e.g. "<keycap>") and API HTML fragments.
 */
export function stripDisplayMarkup(text: string): string {
  if (!text) return "";
  return (
    text
      // <tag>, </tag>, < keycap >, <br/>, etc.
      .replace(/<\s*\/?\s*[\w.-]+(?:\s+[^>]*)?\s*\/?>/gi, "")
      // leftover angle brackets from broken tags
      .replace(/<[^>]*>/g, "")
      .replace(/&lt;\s*\/?\s*[\w.-]+(?:\s+[^&]*)?\s*&gt;/gi, "")
      .replace(/&lt;[^&]*&gt;/gi, "")
      // named / numeric entities (keep plain text only)
      .replace(/&(?:#x?[0-9a-f]+|[a-z][a-z0-9]+);/gi, "")
      .replace(/\s{2,}/g, " ")
      .trim()
  );
}
