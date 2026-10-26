import * as React from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CalendarDays, ChevronLeft, ChevronRight, X } from 'lucide-react-native';

import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';

const WEEKDAYS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateString(year: number, month: number, day: number): string {
  return `${year}-${pad(month)}-${pad(day)}`;
}

/** Ngày hôm nay theo giờ địa phương của thiết bị, dạng `YYYY-MM-DD`. */
export function todayString(): string {
  const now = new Date();
  return toDateString(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

function parseDate(value: string): { year: number; month: number; day: number } | null {
  const match = DATE_PATTERN.exec(value);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]), Number(match[3])];
  const check = new Date(Date.UTC(year, month - 1, day));
  return check.getUTCFullYear() === year && check.getUTCMonth() === month - 1 && check.getUTCDate() === day
    ? { year, month, day }
    : null;
}

function formatDisplay(value: string): string {
  const parsed = parseDate(value);
  return parsed ? `${pad(parsed.day)}/${pad(parsed.month)}/${parsed.year}` : value;
}

/** Lưới các ô của một tháng, bắt đầu từ Thứ hai; ô trống là `null`. */
function buildMonthCells(year: number, month: number): (number | null)[] {
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7; // 0 = Thứ hai
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells: (number | null)[] = Array.from({ length: firstWeekday }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(day);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

interface CalendarCardProps {
  value?: string;
  title: string;
  minDate?: string;
  maxDate?: string;
  onSelect: (value: string) => void;
  onClear?: () => void;
  onClose: () => void;
}

/** Thân lịch; chỉ được mount khi hộp mở nên tháng hiển thị luôn khởi tạo theo ngày đang chọn. */
function CalendarCard({ value, title, minDate, maxDate, onSelect, onClear, onClose }: CalendarCardProps) {
  const colors = useIconColors();
  const initial = parseDate(value ?? '') ?? parseDate(todayString());
  const [view, setView] = React.useState({ year: initial?.year ?? 2026, month: initial?.month ?? 1 });

  const cells = React.useMemo(() => buildMonthCells(view.year, view.month), [view.year, view.month]);
  const today = todayString();

  const shiftMonth = (delta: number) => {
    setView((current) => {
      const index = current.year * 12 + (current.month - 1) + delta;
      return { year: Math.floor(index / 12), month: (index % 12) + 1 };
    });
  };

  const isDisabled = (date: string) => (minDate !== undefined && date < minDate) || (maxDate !== undefined && date > maxDate);

  return (
      <Pressable onPress={() => undefined} className="gap-3 rounded-3xl border border-border bg-background p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-base font-bold text-foreground">{title}</Text>
          <Pressable accessibilityLabel="Đóng" onPress={onClose} hitSlop={8} className="h-9 w-9 items-center justify-center">
            <X size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between">
          <Pressable
            accessibilityLabel="Tháng trước"
            onPress={() => shiftMonth(-1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ChevronLeft size={18} color={colors.foreground} />
          </Pressable>
          <Text className="text-sm font-semibold text-foreground">
            Tháng {view.month} / {view.year}
          </Text>
          <Pressable
            accessibilityLabel="Tháng sau"
            onPress={() => shiftMonth(1)}
            className="h-10 w-10 items-center justify-center rounded-full bg-muted">
            <ChevronRight size={18} color={colors.foreground} />
          </Pressable>
        </View>

        <View className="flex-row">
          {WEEKDAYS.map((label) => (
            <Text key={label} className="flex-1 text-center text-[11px] font-semibold text-muted-foreground">
              {label}
            </Text>
          ))}
        </View>

        <View className="flex-row flex-wrap">
          {cells.map((day, index) => {
            if (day === null) return <View key={`blank-${index}`} className="h-11 w-[14.2857%]" />;
            const date = toDateString(view.year, view.month, day);
            const selected = date === value;
            const disabled = isDisabled(date);
            return (
              <View key={date} className="h-11 w-[14.2857%] items-center justify-center">
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={formatDisplay(date)}
                  accessibilityState={{ selected, disabled }}
                  disabled={disabled}
                  onPress={() => {
                    onSelect(date);
                    onClose();
                  }}
                  className={cn(
                    'h-10 w-10 items-center justify-center rounded-full',
                    selected ? 'bg-primary' : date === today ? 'border border-primary' : '',
                    disabled ? 'opacity-30' : ''
                  )}>
                  <Text className={cn('text-sm', selected ? 'font-bold text-primary-foreground' : 'text-foreground')}>
                    {day}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        <View className="flex-row gap-2">
          {!isDisabled(today) ? (
            <Pressable
              onPress={() => {
                onSelect(today);
                onClose();
              }}
              className="h-11 flex-1 items-center justify-center rounded-xl border border-input">
              <Text className="text-sm font-semibold text-foreground">Hôm nay</Text>
            </Pressable>
          ) : null}
          {onClear && value ? (
            <Pressable
              onPress={() => {
                onClear();
                onClose();
              }}
              className="h-11 flex-1 items-center justify-center rounded-xl border border-destructive/40">
              <Text className="text-sm font-semibold text-destructive">Xóa ngày</Text>
            </Pressable>
          ) : null}
        </View>
      </Pressable>
  );
}

/**
 * Hộp chọn ngày dạng lịch tháng (không cần module native). Trả về `YYYY-MM-DD` qua `onSelect`;
 * `onClear` chỉ hiện khi truyền vào.
 */
export function DatePickerModal({
  visible,
  title = 'Chọn ngày',
  ...rest
}: Omit<CalendarCardProps, 'title'> & { visible: boolean; title?: string }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={rest.onClose}>
      <Pressable accessibilityLabel="Đóng lịch" onPress={rest.onClose} className="flex-1 justify-center bg-black/50 px-5">
        <SafeAreaView>{visible ? <CalendarCard title={title} {...rest} /> : null}</SafeAreaView>
      </Pressable>
    </Modal>
  );
}

/**
 * Ô chọn ngày: hiển thị `dd/mm/yyyy`, bấm để mở lịch. `value` rỗng = chưa chọn. Truyền `clearable` để cho phép xóa.
 */
export function DateField({
  label,
  value,
  onChange,
  clearable = false,
  placeholder = 'Chọn ngày',
  minDate,
  maxDate,
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  clearable?: boolean;
  placeholder?: string;
  minDate?: string;
  maxDate?: string;
  error?: string;
}) {
  const colors = useIconColors();
  const [open, setOpen] = React.useState(false);

  return (
    <View>
      <Text className="mb-1.5 text-xs font-bold uppercase text-muted-foreground">{label}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDisplay(value) : placeholder}`}
        onPress={() => setOpen(true)}
        className={cn(
          'h-12 flex-row items-center gap-2 rounded-2xl border bg-card px-3.5',
          error ? 'border-destructive' : 'border-input'
        )}>
        <CalendarDays size={16} color={colors.mutedForeground} />
        <Text className={cn('flex-1 text-sm', value ? 'text-foreground' : 'text-muted-foreground')}>
          {value ? formatDisplay(value) : placeholder}
        </Text>
      </Pressable>
      {error ? <Text className="mt-1 text-xs text-destructive">{error}</Text> : null}
      <DatePickerModal
        visible={open}
        value={value}
        title={label}
        minDate={minDate}
        maxDate={maxDate}
        onSelect={onChange}
        onClear={clearable ? () => onChange('') : undefined}
        onClose={() => setOpen(false)}
      />
    </View>
  );
}
