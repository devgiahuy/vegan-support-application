import * as React from 'react';
import { cn } from '@/lib/utils';

interface ChatMarkdownProps {
  content: string;
  className?: string;
}

/**
 * Phân tích và render cú pháp Markdown cơ bản an toàn bằng các React Node thuần túy
 * (không dùng dangerouslySetInnerHTML, không phụ thuộc thư viện ngoài).
 * Hỗ trợ: Tiêu đề (h2-h4), in đậm (**), in nghiêng (*), danh sách gạch đầu dòng/đánh số,
 * khối trích dẫn (>), code inline (`) và khối code (```).
 */
export function ChatMarkdown({ content, className }: ChatMarkdownProps) {
  const blocks = React.useMemo(() => parseMarkdownBlocks(content), [content]);

  return (
    <div className={cn('space-y-3 text-sm leading-relaxed text-foreground break-words', className)}>
      {blocks.map((block, idx) => (
        <React.Fragment key={idx}>{renderBlock(block, idx)}</React.Fragment>
      ))}
    </div>
  );
}

type BlockType =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'h4'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code-block'; language?: string; code: string }
  | { type: 'paragraph'; text: string };

function parseMarkdownBlocks(raw: string): BlockType[] {
  if (!raw || raw.trim().length === 0) return [];

  const lines = raw.split(/\r?\n/);
  const blocks: BlockType[] = [];
  let currentList: { type: 'bullet' | 'numbered'; items: string[] } | null = null;
  let currentParagraph: string[] = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', text: currentParagraph.join(' ') });
      currentParagraph = [];
    }
  };

  const flushList = () => {
    if (currentList) {
      if (currentList.type === 'bullet') {
        blocks.push({ type: 'bullet-list', items: currentList.items });
      } else {
        blocks.push({ type: 'numbered-list', items: currentList.items });
      }
      currentList = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Khối code ```
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        flushParagraph();
        flushList();
        inCodeBlock = true;
        codeLang = trimmed.slice(3).trim();
        codeLines = [];
      } else {
        blocks.push({ type: 'code-block', language: codeLang, code: codeLines.join('\n') });
        inCodeBlock = false;
        codeLines = [];
        codeLang = '';
      }
      continue;
    }

    if (inCodeBlock) {
      codeLines.push(line);
      continue;
    }

    // Dòng trống
    if (trimmed.length === 0) {
      flushParagraph();
      flushList();
      continue;
    }

    // Tiêu đề
    if (trimmed.startsWith('#### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h4', text: trimmed.replace(/^####\s+/, '') });
      continue;
    }
    if (trimmed.startsWith('### ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h3', text: trimmed.replace(/^###\s+/, '') });
      continue;
    }
    if (trimmed.startsWith('## ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'h2', text: trimmed.replace(/^##\s+/, '') });
      continue;
    }

    // Khối trích dẫn (Blockquote)
    if (trimmed.startsWith('> ')) {
      flushParagraph();
      flushList();
      blocks.push({ type: 'blockquote', text: trimmed.replace(/^>\s*/, '') });
      continue;
    }

    // Danh sách gạch đầu dòng (- hoặc *)
    const bulletMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'bullet') {
        flushList();
        currentList = { type: 'bullet', items: [bulletMatch[1]] };
      } else {
        currentList.items.push(bulletMatch[1]);
      }
      continue;
    }

    // Danh sách đánh số (1., 2., ...)
    const numberedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (numberedMatch) {
      flushParagraph();
      if (!currentList || currentList.type !== 'numbered') {
        flushList();
        currentList = { type: 'numbered', items: [numberedMatch[1]] };
      } else {
        currentList.items.push(numberedMatch[1]);
      }
      continue;
    }

    // Dòng thông thường -> gom vào paragraph
    flushList();
    currentParagraph.push(trimmed);
  }

  flushParagraph();
  flushList();
  if (inCodeBlock && codeLines.length > 0) {
    blocks.push({ type: 'code-block', language: codeLang, code: codeLines.join('\n') });
  }

  return blocks;
}

function renderBlock(block: BlockType, key: React.Key): React.ReactNode {
  switch (block.type) {
    case 'h2':
      return (
        <h3
          key={key}
          className="mt-4 text-base font-semibold text-foreground tracking-tight first:mt-0"
        >
          {renderInline(block.text)}
        </h3>
      );
    case 'h3':
      return (
        <h4
          key={key}
          className="mt-3 text-sm font-semibold text-foreground tracking-tight first:mt-0"
        >
          {renderInline(block.text)}
        </h4>
      );
    case 'h4':
      return (
        <h5
          key={key}
          className="mt-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground first:mt-0"
        >
          {renderInline(block.text)}
        </h5>
      );
    case 'bullet-list':
      return (
        <ul key={key} className="my-2 space-y-1.5 pl-4 list-disc marker:text-primary">
          {block.items.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ul>
      );
    case 'numbered-list':
      return (
        <ol
          key={key}
          className="my-2 space-y-1.5 pl-4 list-decimal marker:text-primary marker:font-medium"
        >
          {block.items.map((item, idx) => (
            <li key={idx} className="text-sm leading-relaxed">
              {renderInline(item)}
            </li>
          ))}
        </ol>
      );
    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="my-3 border-l-3 border-primary/70 bg-primary/5 py-2 pl-3.5 pr-3 text-sm italic text-foreground/90 rounded-r-lg"
        >
          {renderInline(block.text)}
        </blockquote>
      );
    case 'code-block':
      return (
        <pre
          key={key}
          className="my-3 overflow-x-auto rounded-xl bg-muted/90 p-3.5 text-xs font-mono text-foreground border border-border/70"
        >
          <code>{block.code}</code>
        </pre>
      );
    case 'paragraph':
      return (
        <p key={key} className="text-sm leading-relaxed">
          {renderInline(block.text)}
        </p>
      );
  }
}

/**
 * Xử lý các định dạng inline: **in đậm**, *in nghiêng*, `code`
 */
function renderInline(text: string): React.ReactNode {
  if (!text) return null;

  // Tách text theo các token: `code`, **bold**, *italic*
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g);

  return tokens.map((part, idx) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={idx}
          className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs text-primary font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={idx} className="font-semibold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={idx} className="italic text-foreground/90">
          {part.slice(1, -1)}
        </em>
      );
    }
    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}
