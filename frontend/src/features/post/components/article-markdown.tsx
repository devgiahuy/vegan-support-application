import * as React from 'react';
import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

export interface ArticleMarkdownProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-2xl sm:text-3xl font-bold text-foreground mt-8 mb-4 scroll-mt-20">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-xl sm:text-2xl font-bold text-foreground mt-8 mb-3 scroll-mt-20 flex items-center gap-2">
      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
      <span>{children}</span>
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-lg sm:text-xl font-semibold text-foreground mt-6 mb-2 scroll-mt-20">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-base sm:text-lg font-semibold text-foreground mt-4 mb-2">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="text-base sm:text-lg leading-relaxed text-muted-foreground my-4 text-pretty">
      {children}
    </p>
  ),
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  ul: ({ children }) => (
    <ul className="list-disc list-outside space-y-2 my-4 text-base sm:text-lg leading-relaxed text-muted-foreground pl-6 marker:text-primary">
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol
      start={start}
      className="list-decimal list-outside space-y-2 my-4 text-base sm:text-lg leading-relaxed text-muted-foreground pl-6 marker:font-semibold marker:text-primary"
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 leading-relaxed [&>p]:my-1">{children}</li>,
  blockquote: ({ children }) => (
    <blockquote className="my-6 border-l-4 border-primary pl-5 italic text-muted-foreground bg-primary/5 py-4 rounded-r-2xl font-medium text-base sm:text-lg">
      {children}
    </blockquote>
  ),
  table: ({ children }) => (
    <div className="my-6 overflow-x-auto rounded-xl border border-border/80 shadow-2xs">
      <table className="w-full text-sm text-left">{children}</table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="bg-muted/60 text-xs uppercase font-semibold text-muted-foreground border-b border-border/80">
      {children}
    </thead>
  ),
  tbody: ({ children }) => <tbody className="divide-y divide-border/60">{children}</tbody>,
  tr: ({ children }) => <tr className="hover:bg-muted/30 transition-colors">{children}</tr>,
  th: ({ children }) => <th className="px-4 py-3 font-semibold text-foreground">{children}</th>,
  td: ({ children }) => <td className="px-4 py-3 text-muted-foreground">{children}</td>,
  code: ({ children, className }) => (
    <code
      className={cn(
        'rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground',
        className
      )}
    >
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="my-4 max-w-full overflow-x-auto rounded-xl border bg-muted/50 p-4 text-xs leading-relaxed font-mono">
      {children}
    </pre>
  ),
  hr: () => <hr className="my-8 border-border/80" />,
  a: ({ children, href }) => (
    <a
      href={href}
      target={href && /^https?:/i.test(href) ? '_blank' : undefined}
      rel={href && /^https?:/i.test(href) ? 'noopener noreferrer' : undefined}
      className="text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary"
    >
      {children}
    </a>
  ),
};

/**
 * Hiển thị nội dung bài viết định dạng Markdown chuẩn (CommonMark + GFM):
 * hỗ trợ tiêu đề h1-h4, danh sách có thứ tự / không thứ tự, in đậm, in nghiêng, bảng, trích dẫn.
 */
export function ArticleMarkdown({ content, className }: ArticleMarkdownProps) {
  if (!content) return null;

  return (
    <div className={cn('article-markdown max-w-none', className)}>
      <Markdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </Markdown>
    </div>
  );
}
