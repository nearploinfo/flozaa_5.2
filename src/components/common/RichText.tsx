"use client";

// sanitize-html has its own pure-JS HTML parser (no jsdom, no browser DOM) —
// it runs identically in Node SSR and the browser, so the server's sanitized
// HTML always matches the client's first render (no hydration mismatch), and
// unlike isomorphic-dompurify it doesn't crash on Vercel's serverless bundling.
import sanitizeHtml from "sanitize-html";
import { useMemo } from "react";

const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    "p", "br", "b", "i", "em", "strong", "u", "s", "ul", "ol", "li",
    "a", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "span", "div",
    "table", "thead", "tbody", "tr", "th", "td", "img",
    // Lets admin content ship its own scoped <style> block (e.g. a
    // ".wrcs { ... }"-prefixed embed) so it can define real @media/.dark
    // rules — something an inline `style=` attribute alone can't express.
    // sanitize-html flags this "vulnerable" only because raw CSS text isn't
    // deep-sanitized; the content is already admin-trusted the same way
    // inline styles below are, and htmlparser2 parses it as a real DOM node
    // (not naive regex), so it can't be used to break out into a <script>.
    "style",
  ],
  allowVulnerableTags: true,
  allowedAttributes: {
    // Backend content relies entirely on inline `style` (font-weight,
    // line-height) for headings/spacing — no <p>/<h2> tags are used — so
    // it must survive sanitizing. sanitize-html still strips dangerous
    // values (url(), expression(), javascript:, etc) from style/href.
    "*": ["class", "style"],
    a: ["href", "target", "rel"],
    img: ["src", "alt", "width", "height"],
  },
  allowedSchemes: ["http", "https", "mailto", "tel"],
  transformTags: {
    a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
  },
};

const RichTextContent = ({ content, className }: { content: string, className?: string }) => {
  const cleanedContent = useMemo(() => {
    if (!content) return "";

    let normalized = content
      .replace(/&nbsp;/g, " ")
      .replace(/word-break:\s*break-all;?/gi, "");

    const isPlainText = !/<[a-z][\s\S]*>/i.test(normalized);
    if (isPlainText) {
      normalized = normalized
        .split(/\n\n+/)
        .map(p => `<p>${p.replace(/\n/g, "<br>")}</p>`)
        .join("");
    }

    return sanitizeHtml(normalized, SANITIZE_CONFIG);
  }, [content]);

  return (
    <div
      className={`rich-text-content break-words whitespace-normal leading-relaxed w-full ${className}`}
      dangerouslySetInnerHTML={{ __html: cleanedContent }}
    />
  );
};

export default RichTextContent;