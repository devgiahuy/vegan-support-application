import * as React from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code-block'; code: string }
  | { type: 'paragraph'; text: string };

const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

/** Tách Markdown cơ bản thành các khối — an toàn, không dùng HTML và không phụ thuộc thư viện ngoài. */
function parseBlocks(raw: string): Block[] {
  if (raw.trim().length === 0) return [];
  const blocks: Block[] = [];
  let paragraph: string[] = [];
  let list: { type: 'bullet-list' | 'numbered-list'; items: string[] } | null = null;
  let quote: string[] = [];
  let inCode = false;
  let codeLines: string[] = [];

  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', text: paragraph.join(' ') });
    paragraph = [];
  };
  const flushList = () => {
    if (list) blocks.push(list);
    list = null;
  };
  const flushQuote = () => {
    if (quote.length > 0) blocks.push({ type: 'blockquote', text: quote.join(' ') });
    quote = [];
  };
  const flushAll = () => {
    flushParagraph();
    flushList();
    flushQuote();
  };

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (trimmed.startsWith('```')) {
      if (inCode) {
        blocks.push({ type: 'code-block', code: codeLines.join('\n') });
        inCode = false;
        codeLines = [];
      } else {
        flushAll();
        inCode = true;
      }
      continue;
    }
    if (inCode) {
      codeLines.push(line);
      continue;
    }
    if (trimmed.length === 0) {
      flushAll();
      continue;
    }

    const heading = /^(#{1,6})\s+(.*)$/.exec(trimmed);
    if (heading) {
      flushAll();
      const depth = heading[1].length;
      blocks.push({ type: 'heading', level: depth <= 2 ? 2 : depth === 3 ? 3 : 4, text: heading[2] });
      continue;
    }

    if (trimmed.startsWith('>')) {
      flushParagraph();
      flushList();
      quote.push(trimmed.replace(/^>\s?/, ''));
      continue;
    }

    const bullet = BULLET.exec(trimmed);
    const numbered = bullet ? null : NUMBERED.exec(trimmed);
    if (bullet || numbered) {
      flushParagraph();
      flushQuote();
      const type = bullet ? 'bullet-list' : 'numbered-list';
      if (!list || list.type !== type) {
        flushList();
        list = { type, items: [] };
      }
      list.items.push((bullet ?? numbered)![1]);
      continue;
    }

    flushList();
    flushQuote();
    paragraph.push(trimmed);
  }

  if (inCode) blocks.push({ type: 'code-block', code: codeLines.join('\n') });
  flushAll();
  return blocks;
}

/** In đậm (**), in nghiêng (*), code inline (`) — trả về các Text lồng nhau. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${index++}`;
    if (token.startsWith('**')) {
      nodes.push(
        <Text key={key} className="font-bold">
          {token.slice(2, -2)}
        </Text>
      );
    } else if (token.startsWith('`')) {
      nodes.push(
        <Text key={key} className="bg-muted font-mono text-[13px]">
          {token.slice(1, -1)}
        </Text>
      );
    } else {
      nodes.push(
        <Text key={key} className="italic">
          {token.slice(1, -1)}
        </Text>
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

const HEADING_CLASS: Record<2 | 3 | 4, string> = {
  2: 'text-base font-bold',
  3: 'text-[15px] font-bold',
  4: 'text-sm font-semibold',
};

/** Render nội dung trợ lý AI (Markdown cơ bản) cho mobile — tương đương `ChatMarkdown` của web. */
export function ChatMarkdown({ content, className }: { content: string; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <View className={cn('gap-2.5', className)}>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
          case 'heading':
            return (
              <Text key={key} className={cn('text-foreground', HEADING_CLASS[block.level])}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'bullet-list':
          case 'numbered-list':
            return (
              <View key={key} className="gap-1">
                {block.items.map((item, itemIndex) => (
                  <View key={`${key}-${itemIndex}`} className="flex-row gap-2">
                    <Text className="w-5 text-sm text-muted-foreground">
                      {block.type === 'bullet-list' ? '•' : `${itemIndex + 1}.`}
                    </Text>
                    <Text className="flex-1 text-sm leading-relaxed text-foreground">
                      {renderInline(item, `${key}-${itemIndex}`)}
                    </Text>
                  </View>
                ))}
              </View>
            );
          case 'blockquote':
            return (
              <View key={key} className="border-l-2 border-primary/40 pl-3">
                <Text className="text-sm italic leading-relaxed text-muted-foreground">{renderInline(block.text, key)}</Text>
              </View>
            );
          case 'code-block':
            return (
              <View key={key} className="rounded-lg bg-muted p-2.5">
                <Text selectable className="font-mono text-xs leading-relaxed text-foreground">
                  {block.code}
                </Text>
              </View>
            );
          default:
            return (
              <Text key={key} selectable className="text-sm leading-relaxed text-foreground">
                {renderInline(block.text, key)}
              </Text>
            );
        }
      })}
    </View>
  );
}
