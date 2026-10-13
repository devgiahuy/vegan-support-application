import * as React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

import { cn } from '@/lib/utils';

/** Ảnh đại diện tròn; không có ảnh hoặc ảnh lỗi thì hiện chữ cái đầu của tên. */
export function UserAvatar({
  name,
  uri,
  size = 32,
  className,
}: {
  name: string;
  uri?: string | null;
  size?: number;
  className?: string;
}) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(uri) && !failed;

  return (
    <View
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className={cn('items-center justify-center overflow-hidden bg-primary/10', className)}>
      {showImage ? (
        <Image
          source={{ uri: uri as string }}
          style={{ width: size, height: size }}
          contentFit="cover"
          onError={() => setFailed(true)}
          accessibilityLabel={name}
        />
      ) : (
        <Text style={{ fontSize: Math.round(size * 0.4) }} className="font-bold text-primary">
          {name.trim().charAt(0).toUpperCase() || '?'}
        </Text>
      )}
    </View>
  );
}
