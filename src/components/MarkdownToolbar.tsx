import { RefObject } from "react";
import { Bold, Italic, Heading1, Heading2, List, ListOrdered, Quote, Code, Link as LinkIcon, Sigma } from "lucide-react";

type Props = {
  textareaRef: RefObject<HTMLTextAreaElement>;
  value: string;
  onChange: (v: string) => void;
};

function wrap(value: string, ta: HTMLTextAreaElement, before: string, after = before, placeholder = "text") {
  const start = ta.selectionStart, end = ta.selectionEnd;
  const sel = value.slice(start, end) || placeholder;
  const next = value.slice(0, start) + before + sel + after + value.slice(end);
  return { next, caret: start + before.length + sel.length + after.length };
}

function linePrefix(value: string, ta: HTMLTextAreaElement, prefix: string) {
  const start = ta.selectionStart, end = ta.selectionEnd;
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const before = value.slice(0, lineStart);
  const block = value.slice(lineStart, end);
  const updated = block.split("\n").map(l => prefix + l).join("\n");
  const next = before + updated + value.slice(end);
  return { next, caret: end + prefix.length };
}

export default function MarkdownToolbar({ textareaRef, value, onChange }: Props) {
  const apply = (fn: (ta: HTMLTextAreaElement) => { next: string; caret: number }) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const { next, caret } = fn(ta);
    onChange(next);
    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(caret, caret); });
  };

  const Btn = ({ title, onClick, children }: any) => (
    <button type="button" onClick={onClick} title={title}
      className="p-1.5 rounded hover:bg-surface-3 text-muted-foreground hover:text-foreground">
      {children}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-0.5 bg-surface-2 border border-border rounded-md px-1 py-1">
      <Btn title="Bold (Ctrl+B)" onClick={() => apply(ta => wrap(value, ta, "**", "**", "bold"))}><Bold className="w-3.5 h-3.5" /></Btn>
      <Btn title="Italic (Ctrl+I)" onClick={() => apply(ta => wrap(value, ta, "*", "*", "italic"))}><Italic className="w-3.5 h-3.5" /></Btn>
      <Btn title="H1" onClick={() => apply(ta => linePrefix(value, ta, "# "))}><Heading1 className="w-3.5 h-3.5" /></Btn>
      <Btn title="H2" onClick={() => apply(ta => linePrefix(value, ta, "## "))}><Heading2 className="w-3.5 h-3.5" /></Btn>
      <Btn title="Bulleted list" onClick={() => apply(ta => linePrefix(value, ta, "- "))}><List className="w-3.5 h-3.5" /></Btn>
      <Btn title="Numbered list" onClick={() => apply(ta => linePrefix(value, ta, "1. "))}><ListOrdered className="w-3.5 h-3.5" /></Btn>
      <Btn title="Quote" onClick={() => apply(ta => linePrefix(value, ta, "> "))}><Quote className="w-3.5 h-3.5" /></Btn>
      <Btn title="Code" onClick={() => apply(ta => wrap(value, ta, "`", "`", "code"))}><Code className="w-3.5 h-3.5" /></Btn>
      <Btn title="Link" onClick={() => apply(ta => wrap(value, ta, "[", "](https://)", "text"))}><LinkIcon className="w-3.5 h-3.5" /></Btn>
      <Btn title="Math (LaTeX)" onClick={() => apply(ta => wrap(value, ta, "$", "$", "x^2"))}><Sigma className="w-3.5 h-3.5" /></Btn>
    </div>
  );
}
