// src/components/ui/markdown.tsx
import React from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";

interface MarkdownProps {
  content: string;
  className?: string;
  sanitize?: boolean;
}

export const Markdown: React.FC<MarkdownProps> = ({
  content,
  className = "",
  sanitize = true,
}) => {
  // Plugins configuration
  const plugins = [remarkGfm];
  const rehypePlugins = sanitize 
    ? [rehypeSanitize, rehypeRaw] 
    : [rehypeRaw];

  // Process HTML content mixed with Markdown
  // First detect if the content is likely HTML by checking for tags
  const isHtmlContent = /<[^>]*>/.test(content);

  if (isHtmlContent) {
    // For HTML content, use dangerouslySetInnerHTML but apply sanitization
    return (
      <div 
        className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  // For markdown content, use ReactMarkdown
  return (
    <ReactMarkdown
      className={`prose prose-sm max-w-none dark:prose-invert ${className}`}
      remarkPlugins={plugins}
      rehypePlugins={rehypePlugins}
    >
      {content}
    </ReactMarkdown>
  );
};