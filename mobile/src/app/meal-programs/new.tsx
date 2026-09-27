import * as React from 'react';
import { Alert, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';
import { SiteScreen } from '@/components/layout/site-screen';
import { PrimaryButton } from '@/components/ui/primary-button';
import { TextField } from '@/components/ui/text-field';
import { useCreateMealProgramMutation } from '@/features/meal-program/queries/meal-program.queries';
import type { MealProgramGoalDto } from '@/features/meal-program/types/meal-program.dto';
import { getApiErrorMessage } from '@/lib/api-error';

export default function NewMealProgramScreen() {
  const router = useRouter();
  const mutation = useCreateMealProgramMutation();
  const [title, setTitle] = React.useState('Lo trinh an chay 4 tuan');
  const [startDate, setStartDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [horizonWeeks, setHorizonWeeks] = React.useState('4');
  const [goal, setGoal] = React.useState<MealProgramGoalDto>('MAINTAIN');

  const submit = async () => {
    const weeks = Math.trunc(Number(horizonWeeks));
    if (!title.trim() || !startDate.trim() || weeks < 2 || weeks > 12) {
      Alert.alert('Du lieu chua hop le', 'Nhap tieu de, ngay bat dau va so tuan trong khoang 2-12.');
      return;
    }
    try {
      const created = await mutation.mutateAsync({ title, startDate, horizonWeeks: weeks, goal });
      Alert.alert('Da tao chuong trinh', 'Backend dang tao cac tuan va phan tich.');
      router.replace(`/meal-programs/${created.id}` as Href);
    } catch (error) {
      Alert.alert('Khong tao duoc', getApiErrorMessage(error));
    }
  };

  return (
    <SiteScreen>
      <View className="gap-5 px-5 pt-4">
        <Text className="text-2xl font-extrabold text-foreground">Tao chuong trinh an nhieu tuan</Text>
        <TextField label="Tieu de" value={title} onChangeText={setTitle} />
        <TextField label="Ngay bat dau" value={startDate} onChangeText={setStartDate} placeholder="YYYY-MM-DD" />
        <TextField label="So tuan" value={horizonWeeks} onChangeText={setHorizonWeeks} keyboardType="numeric" />
        <View className="flex-row gap-2">
          {(['MAINTAIN', 'LOSE', 'GAIN'] as const).map((item) => (
            <PrimaryButton
              key={item}
              label={item === 'MAINTAIN' ? 'Duy tri' : item === 'LOSE' ? 'Giam' : 'Tang'}
              variant={goal === item ? 'primary' : 'outline'}
              className="flex-1"
              onPress={() => setGoal(item)}
            />
          ))}
        </View>
        <PrimaryButton label="Tao chuong trinh" loading={mutation.isPending} onPress={() => void submit()} />
      </View>
    </SiteScreen>
  );
}
