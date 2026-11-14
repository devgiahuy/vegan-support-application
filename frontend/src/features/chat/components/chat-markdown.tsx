import Markdown, { type Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

const components: Components = {
  h1: ({ children }) => (
    <h3 className="mb-3 mt-6 text-lg font-semibold text-balance first:mt-0">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mb-3 mt-6 text-base font-semibold text-balance first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mb-2 mt-5 text-base font-semibold text-balance first:mt-0">{children}</h4>
  ),
  h4: ({ children }) => (
    <h5 className="mb-2 mt-4 text-sm font-semibold text-balance first:mt-0">{children}</h5>
  ),
  p: ({ children }) => <p className="my-3 text-pretty first:mt-0 last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="my-3 list-disc space-y-2 pl-5 marker:text-primary first:mt-0 last:mb-0">
      {children}
    </ul>
  ),
  ol: ({ children, start }) => (
    <ol
      start={start}
      className="my-3 list-decimal space-y-2 pl-5 marker:font-medium marker:text-primary first:mt-0 last:mb-0"
    >
      {children}
    </ol>
  ),
  li: ({ children }) => <li className="pl-1 [&>p]:my-1 [&>ul]:mt-2 [&>ol]:mt-2">{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-4 border-l border-primary/50 pl-4 text-muted-foreground">
      {children}
    </blockquote>
  ),
  hr: () => <Separator className="my-5" />,
  a: ({ children, href }) =>
    href ? (
      <a
        href={href}
        target={/^https?:/i.test(href) ? '_blank' : undefined}
        rel="noopener noreferrer"
        className="rounded-sm text-primary underline underline-offset-4 decoration-primary/40 hover:decoration-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        {children}
      </a>
    ) : (
      <span>{children}</span>
    ),
  // Generated image URLs are not fetched automatically from untrusted assistant text.
  img: ({ alt }) => <span className="text-muted-foreground">{alt}</span>,
  pre: ({ children }) => (
    <pre
      tabIndex={0}
      aria-label="Đoạn mã trong câu trả lời"
      className="my-4 max-w-full overflow-x-auto rounded-xl border bg-muted/50 p-4 text-xs leading-relaxed focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&>code]:whitespace-pre [&>code]:bg-transparent [&>code]:p-0"
    >
      {children}
    </pre>
  ),
  code: ({ children, className }) => (
    <code className={cn('rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]', className)}>
      {children}
    </code>
  ),
  table: ({ children }) => (
    <div className="my-4 max-w-full min-w-0 space-y-2">
      <div className="overflow-hidden rounded-xl border">
        <Table
          tabIndex={0}
          aria-label="Bảng trong câu trả lời, có thể cuộn ngang"
          className="min-w-[28rem] text-sm leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
        >
          {children}
        </Table>
      </div>
      <p className="text-xs text-muted-foreground sm:hidden">Vuốt ngang bảng để xem đầy đủ.</p>
    </div>
  ),
  thead: ({ children }) => <TableHeader className="bg-muted/60">{children}</TableHeader>,
  tbody: ({ children }) => <TableBody>{children}</TableBody>,
  tr: ({ children }) => <TableRow className="hover:bg-transparent">{children}</TableRow>,
  th: ({ children, style }) => (
    <TableHead
      scope="col"
      style={style}
      className="h-auto px-3 py-3 align-top whitespace-normal font-semibold sm:px-4"
    >
      {children}
    </TableHead>
  ),
  td: ({ children, style }) => (
    <TableCell style={style} className="px-3 py-3 align-top whitespace-normal tabular-nums sm:px-4">
      {children}
    </TableCell>
  ),
};

/** Safe CommonMark/GFM rendering shared by streamed and persisted answers. */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  return (
    <div
      className={cn(
        'min-w-0 max-w-full text-sm leading-7 text-foreground break-words [overflow-wrap:anywhere]',
        className
      )}
    >
      <Markdown remarkPlugins={[remarkGfm]} components={components} skipHtml>
        {content}
      </Markdown>
    </div>
  );
}
