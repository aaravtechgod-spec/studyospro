import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

export default function Markdown({ children }: { children: string }) {
  // Normalize common AI math delimiters so remark-math picks them up:
  // \( ... \) -> $...$ ; \[ ... \] -> $$...$$
  const normalized = children
    .replace(/\\\[(.+?)\\\]/gs, (_, e) => `$$${e}$$`)
    .replace(/\\\((.+?)\\\)/gs, (_, e) => `$${e}$`);

  return (
    <div className="prose prose-invert prose-sm max-w-none
      prose-headings:font-display prose-headings:tracking-tight
      prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
      prose-p:my-2 prose-li:my-0.5
      prose-code:bg-surface-2 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-primary prose-code:before:content-none prose-code:after:content-none
      prose-pre:bg-surface-2 prose-pre:border prose-pre:border-border
      prose-img:rounded-md prose-img:border prose-img:border-border
      prose-a:text-primary prose-a:no-underline hover:prose-a:underline
      prose-strong:text-foreground
      prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground
      prose-table:text-xs">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
