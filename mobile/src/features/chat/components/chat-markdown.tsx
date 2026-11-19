import * as React from 'react';
import { Text, View } from 'react-native';

import { cn } from '@/lib/utils';

type Block =
  | { type: 'heading'; level: 2 | 3 | 4; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'blockquote'; text: string }
  | { type: 'code-block'; code: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'hr' }
  | { type: 'paragraph'; text: string };

const BULLET = /^[-*•]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;
const HORIZONTAL_RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const TABLE_SEP_CELL = /^:?[-—–]{2,}:?$/;

function splitTableRow(line: string): string[] {
  const trimmed = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  return trimmed.split('|').map((cell) => cell.trim());
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes('|') && splitTableRow(trimmed).length >= 2;
}

function isTableSeparator(line: string): boolean {
  if (!line.includes('|')) return false;
  const cells = splitTableRow(line);
  return cells.length >= 2 && cells.every((cell) => TABLE_SEP_CELL.test(cell));
}

function stripInlineSyntax(text: string): string {
  return text.replace(/(\*\*|`|\*)/g, '').trim();
}

/** Tách Markdown cơ bản (bao gồm bảng và đường phân cách) thành các khối — không dùng HTML, không thư viện ngoài. */
function parseBlocks(raw: string): Block[] {
  if (raw.trim().length === 0) return [];
  const lines = raw.split(/\r?\n/);
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

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
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

    if (HORIZONTAL_RULE.test(trimmed)) {
      flushAll();
      blocks.push({ type: 'hr' });
      continue;
    }

    // Bảng Markdown: dòng tiêu đề chứa `|` đi liền sau là dòng phân cách `|---|---|`.
    if (isTableRow(trimmed) && i + 1 < lines.length && isTableSeparator(lines[i + 1].trim())) {
      flushAll();
      const headers = splitTableRow(trimmed);
      const rows: string[][] = [];
      i += 1; // bỏ qua dòng phân cách
      while (i + 1 < lines.length && isTableRow(lines[i + 1].trim()) && !isTableSeparator(lines[i + 1].trim())) {
        i += 1;
        const cells = splitTableRow(lines[i].trim());
        while (cells.length < headers.length) cells.push('');
        rows.push(cells.slice(0, headers.length));
      }
      blocks.push({ type: 'table', headers, rows });
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
        <Text key={key} className="rounded bg-muted px-1 font-mono text-[13px]">
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

/**
 * Hiển thị bảng Markdown thân thiện trên màn hình điện thoại:
 * - Bảng ngắn gọn (<= 3 cột và ô ngắn <= 24 ký tự): dạng lưới có tiêu đề cột.
 * - Bảng mô tả dài (như thực đơn từng bữa) hoặc >= 4 cột: dạng danh sách thẻ có cấu trúc để không bị bóp chữ.
 */
function MarkdownTable({
  headers,
  rows,
  keyPrefix,
}: {
  headers: string[];
  rows: string[][];
  keyPrefix: string;
}) {
  const maxCellLen = React.useMemo(() => {
    let max = 0;
    for (const h of headers) max = Math.max(max, stripInlineSyntax(h).length);
    for (const row of rows) {
      for (const cell of row) max = Math.max(max, stripInlineSyntax(cell).length);
    }
    return max;
  }, [headers, rows]);

  const useCompactGrid = headers.length <= 3 && maxCellLen <= 24;

  if (useCompactGrid) {
    return (
      <View className="overflow-hidden rounded-xl border border-border bg-background">
        <View className="flex-row border-b border-border bg-muted/70 px-2.5 py-2">
          {headers.map((header, colIndex) => (
            <Text
              key={`${keyPrefix}-h-${colIndex}`}
              className={cn(
                'flex-1 text-xs font-bold text-foreground',
                colIndex === headers.length - 1 ? 'text-right' : ''
              )}>
              {renderInline(header, `${keyPrefix}-h-${colIndex}`)}
            </Text>
          ))}
        </View>
        {rows.map((row, rowIndex) => (
          <View
            key={`${keyPrefix}-r-${rowIndex}`}
            className={cn(
              'flex-row px-2.5 py-2',
              rowIndex > 0 ? 'border-t border-border' : '',
              rowIndex % 2 === 1 ? 'bg-muted/20' : ''
            )}>
            {row.map((cell, colIndex) => (
              <Text
                key={`${keyPrefix}-c-${rowIndex}-${colIndex}`}
                className={cn(
                  'flex-1 text-xs leading-snug text-foreground',
                  colIndex === headers.length - 1 ? 'text-right font-medium' : ''
                )}>
                {renderInline(cell, `${keyPrefix}-c-${rowIndex}-${colIndex}`)}
              </Text>
            ))}
          </View>
        ))}
      </View>
    );
  }

  const useThreeColHighlight =
    headers.length === 3 &&
    rows.every((row) => stripInlineSyntax(row[2] ?? '').length <= 24);

  return (
    <View className="overflow-hidden rounded-xl border border-border bg-background">
      {headers.length > 0 ? (
        <View className="border-b border-border bg-muted/60 px-3 py-1.5">
          <Text className="text-[11px] font-semibold text-muted-foreground">
            {headers.map((h) => stripInlineSyntax(h)).filter(Boolean).join(' · ')}
          </Text>
        </View>
      ) : null}

      {rows.map((row, rowIndex) => {
        const primary = row[0] ?? '';
        const isSummaryRow =
          rowIndex === rows.length - 1 &&
          /^(tổng|total)/i.test(stripInlineSyntax(primary));

        if (useThreeColHighlight) {
          const detail = row[1] ?? '';
          const metric = row[2] ?? '';
          return (
            <View
              key={`${keyPrefix}-r-${rowIndex}`}
              className={cn(
                'gap-1 px-3 py-2.5',
                rowIndex > 0 ? 'border-t border-border' : '',
                isSummaryRow ? 'bg-primary/5' : ''
              )}>
              <View className="flex-row items-center justify-between gap-2">
                <Text className="flex-1 text-sm font-semibold text-foreground">
                  {renderInline(primary, `${keyPrefix}-p-${rowIndex}`)}
                </Text>
                {metric.length > 0 ? (
                  <View className="rounded-full bg-primary/10 px-2.5 py-0.5">
                    <Text className="text-xs font-semibold text-primary">
                      {renderInline(metric, `${keyPrefix}-m-${rowIndex}`)}
                    </Text>
                  </View>
                ) : null}
              </View>
              {detail.length > 0 ? (
                <Text selectable className="text-sm leading-relaxed text-foreground">
                  {renderInline(detail, `${keyPrefix}-d-${rowIndex}`)}
                </Text>
              ) : null}
            </View>
          );
        }

        return (
          <View
            key={`${keyPrefix}-r-${rowIndex}`}
            className={cn(
              'gap-1 px-3 py-2.5',
              rowIndex > 0 ? 'border-t border-border' : '',
              isSummaryRow ? 'bg-primary/5' : ''
            )}>
            {primary.length > 0 ? (
              <Text className="text-sm font-semibold text-foreground">
                {renderInline(primary, `${keyPrefix}-p-${rowIndex}`)}
              </Text>
            ) : null}
            {row.slice(1).map((cell, offset) => {
              if (!cell) return null;
              const colLabel = stripInlineSyntax(headers[offset + 1] ?? '');
              return (
                <Text key={`${keyPrefix}-f-${rowIndex}-${offset}`} selectable className="text-xs leading-relaxed text-foreground">
                  {colLabel ? <Text className="font-semibold text-muted-foreground">{colLabel}: </Text> : null}
                  {renderInline(cell, `${keyPrefix}-f-${rowIndex}-${offset}`)}
                </Text>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

/** Render nội dung trợ lý AI (Markdown cơ bản + bảng mobile) — tương đương `ChatMarkdown` của web. */
export function ChatMarkdown({ content, className }: { content: string; className?: string }) {
  const blocks = React.useMemo(() => parseBlocks(content), [content]);

  return (
    <View className={cn('gap-2.5', className)}>
      {blocks.map((block, index) => {
        const key = `b${index}`;
        switch (block.type) {
          case 'heading':
            return (
              <Text key={key} className={cn('pt-0.5 text-foreground', HEADING_CLASS[block.level])}>
                {renderInline(block.text, key)}
              </Text>
            );
          case 'hr':
            return <View key={key} className="my-1 h-px bg-border" />;
          case 'table':
            return (
              <MarkdownTable
                key={key}
                headers={block.headers}
                rows={block.rows}
                keyPrefix={key}
              />
            );
          case 'bullet-list':
          case 'numbered-list':
            return (
              <View key={key} className="gap-1.5">
                {block.items.map((item, itemIndex) => (
                  <View key={`${key}-${itemIndex}`} className="flex-row items-start gap-1.5">
                    <Text
                      className={cn(
                        'w-4 text-sm leading-relaxed',
                        block.type === 'bullet-list' ? 'text-center font-bold text-primary' : 'font-semibold text-muted-foreground'
                      )}>
                      {block.type === 'bullet-list' ? '•' : `${itemIndex + 1}.`}
                    </Text>
                    <Text selectable className="flex-1 text-sm leading-relaxed text-foreground">
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
