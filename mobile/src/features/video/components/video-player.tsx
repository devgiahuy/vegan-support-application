import * as React from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { WebView } from 'react-native-webview';
import { CirclePlay } from 'lucide-react-native';

import { PrimaryButton } from '@/components/ui/primary-button';
import { useIconColors } from '@/lib/theme-colors';
import { cn } from '@/lib/utils';
import { buildFileVideoHtml, buildYoutubeEmbedHtml, resolveVideoEmbed } from '../utils/video-embed';

const YOUTUBE_ORIGIN = 'https://www.youtube-nocookie.com';

/**
 * Phát video ngay trong app (đồng bộ `video-player.tsx` của web): link YouTube nhúng qua `youtube-nocookie`,
 * video tải lên phát bằng thẻ <video>. Dùng WebView nên chạy được trong Expo Go; trên web dùng iframe/video của trình duyệt.
 * Khi không phát được (link hỏng, mất mạng) thì hiện thông báo kèm nút mở bằng trình duyệt.
 */
export function VideoPlayer({
  videoUrl,
  provider,
  posterUrl,
  title = 'Trình phát video',
  className,
}: {
  videoUrl: string;
  provider?: string;
  posterUrl?: string;
  title?: string;
  className?: string;
}) {
  const colors = useIconColors();
  const embed = React.useMemo(() => resolveVideoEmbed(videoUrl, provider), [videoUrl, provider]);
  // Lưu URL đã lỗi (thay vì cờ boolean) để đổi sang video khác thì tự thử lại, không cần effect đặt lại state.
  const [failedUrl, setFailedUrl] = React.useState<string | null>(null);
  const failed = failedUrl === videoUrl;

  const html = React.useMemo(() => {
    if (embed.kind === 'youtube') return buildYoutubeEmbedHtml(embed.embedUrl, title);
    if (embed.kind === 'file') return buildFileVideoHtml(embed.url, posterUrl);
    return '';
  }, [embed, posterUrl, title]);

  const externalUrl = embed.kind === 'youtube' ? embed.watchUrl : embed.kind === 'file' ? embed.url : null;
  const openExternal = () => {
    if (externalUrl) void WebBrowser.openBrowserAsync(externalUrl).catch(() => undefined);
  };

  const frame = cn('aspect-video w-full overflow-hidden rounded-2xl bg-black', className);

  if (embed.kind === 'invalid' || failed) {
    return (
      <View className={cn('aspect-video w-full items-center justify-center gap-2 rounded-2xl bg-muted p-5', className)}>
        <CirclePlay size={36} color={colors.mutedForeground} strokeWidth={1.25} />
        <Text className="text-center text-sm font-semibold text-foreground">
          {embed.kind === 'invalid' ? 'Video không khả dụng hoặc liên kết bị lỗi' : 'Không phát được video trong app'}
        </Text>
        <Text className="text-center text-xs text-muted-foreground">
          {embed.kind === 'invalid' ? 'Đường dẫn video này không phát được. Vui lòng thử nội dung khác.' : 'Kiểm tra kết nối mạng hoặc mở video bằng trình duyệt.'}
        </Text>
        {externalUrl ? <PrimaryButton label="Mở bằng trình duyệt" variant="outline" className="h-10 px-4" onPress={openExternal} /> : null}
      </View>
    );
  }

  if (Platform.OS === 'web') {
    return (
      <View className={frame}>
        {embed.kind === 'youtube'
          ? React.createElement('iframe', {
              src: embed.embedUrl,
              title,
              allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share',
              allowFullScreen: true,
              style: { width: '100%', height: '100%', border: 0 },
            })
          : React.createElement('video', {
              src: embed.kind === 'file' ? embed.url : undefined,
              poster: posterUrl,
              controls: true,
              playsInline: true,
              style: { width: '100%', height: '100%', objectFit: 'contain', backgroundColor: '#000' },
            })}
      </View>
    );
  }

  return (
    <View className={frame}>
      <WebView
        originWhitelist={['https://*', 'about:*']}
        source={embed.kind === 'youtube' ? { html, baseUrl: YOUTUBE_ORIGIN } : { html }}
        style={{ flex: 1, backgroundColor: '#000' }}
        javaScriptEnabled
        domStorageEnabled
        allowsInlineMediaPlayback
        allowsFullscreenVideo
        mediaPlaybackRequiresUserAction
        setSupportMultipleWindows={false}
        nestedScrollEnabled
        startInLoadingState
        renderLoading={() => (
          <View className="absolute inset-0 items-center justify-center bg-black">
            <ActivityIndicator color="#ffffff" />
          </View>
        )}
        // Chỉ cho trang nhúng tự tải bên trong; mọi điều hướng khung chính ra ngoài (quảng cáo, liên kết) đều bị chặn.
        onShouldStartLoadWithRequest={(request) =>
          request.isTopFrame === false ||
          request.url.startsWith('about:') ||
          request.url.startsWith(YOUTUBE_ORIGIN) ||
          request.url === (embed.kind === 'file' ? embed.url : '')
        }
        onError={() => setFailedUrl(videoUrl)}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400 && embed.kind === 'file') setFailedUrl(videoUrl);
        }}
        accessibilityLabel={title}
      />
    </View>
  );
}
