import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

function SignedImage({ path, alt }: { path: string; alt?: string }) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    supabase.storage.from("note-images").createSignedUrl(path, 3600).then(({ data }) => {
      if (!cancelled) setUrl(data?.signedUrl ?? null);
    });
    return () => { cancelled = true; };
  }, [path]);
  if (!url) return <span className="text-muted-foreground text-xs">[loading image…]</span>;
  return <img src={url} alt={alt ?? ""} loading="lazy" />;
}

export default function Markdown({ children }: { children: string }) {
  // Normalize math delimiters and rewrite legacy public note-image URLs to tokens.
  const normalized = children
    .replace(/\\\[(.+?)\\\]/gs, (_, e) => `$$${e}$$`)
    .replace(/\\\((.+?)\\\)/gs, (_, e) => `$${e}$`)
    .replace(/https?:\/\/[^\s)]+\/storage\/v1\/object\/public\/note-images\/([^\s)]+)/g, "note-image:$1");

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
        components={{
          img: ({ src, alt }) => {
            const s = String(src ?? "");
            if (s.startsWith("note-image:")) {
              return <SignedImage path={s.slice("note-image:".length)} alt={alt} />;
            }
            return <img src={s} alt={alt ?? ""} loading="lazy" />;
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}
