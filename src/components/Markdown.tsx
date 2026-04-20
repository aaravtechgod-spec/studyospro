import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ children }: { children: string }) {
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
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
