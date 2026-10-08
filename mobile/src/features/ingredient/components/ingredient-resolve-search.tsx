import * as React from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { CheckCircle2, ScanSearch } from 'lucide-react-native';

import { ResolutionMatch } from '@/common/enums';
import { EmptyState, ErrorState, LoadingState } from '@/components/shared/state-views';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { useIngredientResolveQuery } from '../queries/ingredient.queries';
import type { ResolvedIngredient } from '../types/ingredient.model';

const MIN_LENGTH = 2;

function CandidateRow({
  candidate,
  selected,
  emphasized,
  onSelect,
}: {
  candidate: ResolvedIngredient;
  selected: boolean;
  emphasized: boolean;
  onSelect: () => void;
}) {
  const colors = useIconColors();
  return (
    <Pressable
      onPress={onSelect}
      className={cn(
        'gap-1.5 rounded-xl border p-3',
        selected || emphasized ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'
      )}>
      <View className="flex-row items-start justify-between gap-2">
        <View className="flex-1">
          <View className="flex-row items-center gap-1.5">
            {emphasized ? <CheckCircle2 size={14} color={colors.primary} /> : null}
            <Text className={cn('flex-1 text-sm font-semibold', emphasized ? 'text-primary' : 'text-foreground')}>
              {emphasized ? `Trùng khớp: ${candidate.canonicalName}` : candidate.canonicalName}
            </Text>
          </View>
          <Text className="mt-0.5 text-xs text-muted-foreground">
            {candidate.foodGroupLabel}
            {candidate.aliases.length > 0 ? ` · Còn gọi: ${candidate.aliases.map((alias) => alias.alias).join(', ')}` : ''}
          </Text>
        </View>
        <View className={cn('rounded-full px-2.5 py-1', selected ? 'bg-primary' : 'border border-border')}>
          <Text className={cn('text-[11px] font-semibold', selected ? 'text-primary-foreground' : 'text-foreground')}>
            {selected ? 'Đã chọn' : 'Chọn'}
          </Text>
        </View>
      </View>

      {candidate.dietCompatibilities.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5">
          {candidate.dietCompatibilities.map((entry) => (
            <View key={entry.label} className={cn('rounded-full px-2 py-0.5', entry.compatible ? 'bg-emerald-500/10' : 'bg-destructive/10')}>
              <Text className={cn('text-[11px] font-medium', entry.compatible ? 'text-emerald-700' : 'text-destructive')}>
                {entry.label}: {entry.compatible ? 'phù hợp' : 'không phù hợp'}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {candidate.allergenCodes.length > 0 ? (
        <Text className="text-[11px] text-muted-foreground">Nhóm dị ứng liên quan: {candidate.allergenCodes.join(', ')}</Text>
      ) : null}
      {candidate.traditionWarnings.map((warning) => (
        <Text key={warning} className="text-[11px] text-amber-700">
          Lưu ý truyền thống: {warning}
        </Text>
      ))}
    </Pressable>
  );
}

/**
 * Ô phân giải tên nguyên liệu: nhập tên (có/không dấu) → NONE / EXACT / AMBIGUOUS. Khi có nhiều ứng viên, người dùng
 * phải tự chọn, ứng dụng không chọn hộ. Chỉ gọi API khi đủ 2 ký tự (debounce 400ms).
 */
export function IngredientResolveSearch() {
  const colors = useIconColors();
  const [keyword, setKeyword] = React.useState('');
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const debounced = useDebouncedValue(keyword.trim(), 400);
  const active = debounced.length >= MIN_LENGTH;
  const { data, isLoading, isError, refetch } = useIngredientResolveQuery(debounced);
  const selected = data?.candidates.find((candidate) => candidate.id === selectedId) ?? null;

  return (
    <View className="gap-3">
      <View className="gap-1.5">
        <Text className="text-sm font-semibold text-foreground">Tên nguyên liệu cần phân giải</Text>
        <View className="h-12 flex-row items-center gap-2 rounded-2xl border border-input bg-card px-3.5">
          <ScanSearch size={16} color={colors.mutedForeground} />
          <TextInput
            value={keyword}
            onChangeText={(value) => {
              setKeyword(value);
              setSelectedId(null);
            }}
            maxLength={160}
            autoCapitalize="none"
            placeholder="Nhập tên, vd: dau phong, đậu, xyzabc..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 text-sm text-foreground"
          />
        </View>
        <Text className="text-xs text-muted-foreground">Nhập ít nhất {MIN_LENGTH} ký tự để phân giải.</Text>
      </View>

      {active && isLoading ? <LoadingState message="Đang phân giải..." /> : null}
      {active && isError ? <ErrorState title="Không phân giải được." onRetry={() => void refetch()} /> : null}

      {active && !isLoading && !isError && data ? (
        data.match === ResolutionMatch.NONE || data.candidates.length === 0 ? (
          <EmptyState
            title="Không trùng khớp nguyên liệu nào."
            description="Không tìm thấy nguyên liệu khớp với từ khóa đã nhập. Hãy thử từ khóa khác (có hoặc không dấu)."
          />
        ) : (
          <View className="gap-2">
            {data.match === ResolutionMatch.AMBIGUOUS ? (
              <Text className="text-sm text-muted-foreground">
                Tìm thấy {data.candidates.length} ứng viên cho &quot;{data.query}&quot; — vui lòng chọn đúng nguyên liệu:
              </Text>
            ) : null}
            {data.candidates.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                selected={candidate.id === selectedId}
                emphasized={data.match === ResolutionMatch.EXACT && data.candidates.length === 1}
                onSelect={() => setSelectedId(candidate.id)}
              />
            ))}
          </View>
        )
      ) : null}

      {selected ? (
        <View className="rounded-xl border border-primary/40 bg-primary/5 p-3">
          <Text className="text-sm text-foreground">
            Đã chọn: <Text className="font-bold text-primary">{selected.canonicalName}</Text> ({selected.foodGroupLabel})
          </Text>
        </View>
      ) : null}
    </View>
  );
}
