import { Alert, Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useConfirmMealProgramMutation, useMealProgramDetailQuery } from '@/features/meal-program/queries/meal-program.queries';
import { getApiErrorMessage } from '@/lib/api-error';

export default function MealProgramDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const programId = id ?? '';
  const { data: program, isLoading, isError, refetch } = useMealProgramDetailQuery(programId);
  const confirmMutation = useConfirmMealProgramMutation(programId);

  const confirm = async () => {
    if (!program) return;
    try {
      await confirmMutation.mutateAsync(program.version);
      Alert.alert('Da xac nhan', 'Chuong trinh da duoc khoa cau truc.');
    } catch (error) {
      Alert.alert('Khong xac nhan duoc', getApiErrorMessage(error));
    }
  };

  if (isLoading) {
    return (
      <SiteScreen>
        <View className="px-5 pt-8"><Text className="text-sm text-muted-foreground">Dang tai chuong trinh...</Text></View>
      </SiteScreen>
    );
  }

  if (isError || !program) {
    return (
      <SiteScreen>
        <View className="items-center px-5 pt-8">
          <Text className="font-bold text-foreground">Khong tim thay chuong trinh</Text>
          <PrimaryButton label="Thu lai" className="mt-4 w-full" onPress={() => void refetch()} />
        </View>
      </SiteScreen>
    );
  }

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View>
          <Text className="text-2xl font-extrabold text-foreground">{program.title}</Text>
          <Text className="mt-1 text-sm text-muted-foreground">
            {program.startDate} - {program.endDate || 'dang cap nhat'} · {program.goalLabel}
          </Text>
        </View>
        <View className="rounded-2xl border border-border bg-card p-4">
          <Text className="text-xs font-semibold uppercase text-muted-foreground">Trang thai</Text>
          <Text className="mt-1 text-xl font-bold text-primary">{program.statusLabel}</Text>
          <Text className="mt-2 text-sm text-muted-foreground">
            {program.readyWeeks}/{program.horizonWeeks} tuan san sang, {program.failedWeeks} tuan loi, {program.warningCount} canh bao phan tich.
          </Text>
        </View>
        <View className="gap-2">
          {program.weeks.length ? (
            program.weeks.map((week) => (
              <View key={week.id} className="rounded-2xl border border-border p-4">
                <Text className="font-bold text-foreground">Tuan {week.weekIndex + 1}</Text>
                <Text className="mt-1 text-sm text-muted-foreground">
                  Trang thai: {week.status}
                  {week.selectedAlternativeRank !== null ? ` · phuong an ${week.selectedAlternativeRank}` : ''}
                </Text>
              </View>
            ))
          ) : (
            <Text className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
              Backend chua tra chi tiet tuan hoac chuong trinh dang tao.
            </Text>
          )}
        </View>
        {program.status !== 'CONFIRMED' ? (
          <PrimaryButton label="Xac nhan chuong trinh" loading={confirmMutation.isPending} onPress={() => void confirm()} />
        ) : null}
      </View>
    </SiteScreen>
  );
}

