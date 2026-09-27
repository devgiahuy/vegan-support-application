import { Text, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { CalendarRange, Plus } from 'lucide-react-native';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { useMealProgramsQuery } from '@/features/meal-program/queries/meal-program.queries';
import { useIconColors } from '@/lib/theme-colors';

export default function MealProgramsScreen() {
  const colors = useIconColors();
  const { data, isLoading, isError, refetch } = useMealProgramsQuery({ limit: 20 });
  const programs = data?.items ?? [];

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-1">
            <Text className="text-2xl font-extrabold text-foreground">Chuong trinh an nhieu tuan</Text>
            <Text className="mt-1 text-sm text-muted-foreground">
              Tao lo trinh 2-12 tuan, theo doi trang thai sinh ke hoach va phan tich tich luy.
            </Text>
          </View>
          <Link href={'/meal-programs/new' as Href} asChild>
            <PrimaryButton label="Tao" icon={<Plus size={16} color={colors.primaryForeground} />} />
          </Link>
        </View>

        {isLoading ? (
          [1, 2, 3].map((item) => <View key={item} className="h-36 rounded-2xl border border-border bg-muted" />)
        ) : isError ? (
          <View className="items-center rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <Text className="font-semibold text-destructive">Khong tai duoc chuong trinh.</Text>
            <PrimaryButton label="Thu lai" variant="outline" className="mt-3 w-full" onPress={() => void refetch()} />
          </View>
        ) : programs.length === 0 ? (
          <View className="items-center rounded-2xl border border-dashed border-border p-8">
            <CalendarRange size={28} color={colors.primary} />
            <Text className="mt-3 text-center font-bold text-foreground">Chua co chuong trinh nao</Text>
            <Text className="mt-1 text-center text-sm text-muted-foreground">
              Bat dau bang lo trinh 2 tuan de backend tao cac phuong an moi tuan.
            </Text>
            <Link href={'/meal-programs/new' as Href} asChild>
              <PrimaryButton label="Tao chuong trinh" className="mt-4 w-full" />
            </Link>
          </View>
        ) : (
          programs.map((program) => (
            <Link key={program.id} href={`/meal-programs/${program.id}` as Href} asChild>
              <View className="rounded-2xl border border-border bg-card p-4">
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-base font-bold text-foreground">{program.title}</Text>
                    <Text className="mt-1 text-xs text-muted-foreground">
                      {program.startDate} - {program.endDate || 'dang tao'} · {program.goalLabel}
                    </Text>
                  </View>
                  <Text className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {program.statusLabel}
                  </Text>
                </View>
                <View className="mt-3 flex-row gap-2">
                  <Metric label="Tuan" value={String(program.horizonWeeks)} />
                  <Metric label="San sang" value={String(program.readyWeeks)} />
                  <Metric label="Can xu ly" value={String(program.failedWeeks + program.warningCount)} />
                </View>
              </View>
            </Link>
          ))
        )}
      </View>
    </SiteScreen>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 rounded-xl bg-muted/60 p-2.5">
      <Text className="text-[11px] text-muted-foreground">{label}</Text>
      <Text className="text-base font-bold text-foreground">{value}</Text>
    </View>
  );
}
