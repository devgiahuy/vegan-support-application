import { useColorScheme } from 'nativewind';
import Svg, { G, Path, Rect } from 'react-native-svg';

/** Màu nền sơ đồ theo token `--accent`, `--secondary`, `--primary`, `--background`, `--border` của `global.css`. */
const PALETTE = {
  light: { accent: '#f1f5f0', secondary: '#e8f5e9', primary: '#2e7d32', background: '#ffffff', border: '#e5e9e4' },
  dark: { accent: '#1c3326', secondary: '#1b2e22', primary: '#66bb6a', background: '#0b1410', border: '#24382c' },
} as const;

const ROADS = 'M-30 150 L660 420 M-30 350 L650 90 M80 -40 L410 760 M390 -40 L220 760 M-30 620 L650 560';

/** Nền "bản đồ" minh họa (khối xanh, sông, đường) — đồng bộ khối `<svg>` của `map-fallback.tsx` trên web. */
export function MapBackdrop() {
  const { colorScheme } = useColorScheme();
  const colors = PALETTE[colorScheme === 'dark' ? 'dark' : 'light'];
  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 600 720"
      preserveAspectRatio="xMidYMid slice"
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}>
      <Rect width={600} height={720} fill={colors.accent} />
      <Rect x={55} y={150} width={135} height={180} rx={45} fill={colors.secondary} />
      <Rect x={370} y={440} width={190} height={160} rx={50} fill={colors.secondary} />
      <Path d="M-40 510 Q170 380 290 440 T650 240" fill="none" stroke={colors.primary} strokeOpacity={0.08} strokeWidth={65} />
      <G fill="none" stroke={colors.background} strokeWidth={18} strokeLinecap="round">
        <Path d={ROADS} />
        <Path d="M0 270 L600 290 M0 490 L600 470" strokeWidth={9} />
      </G>
      <G fill="none" stroke={colors.border} strokeWidth={1}>
        <Path d={ROADS} />
      </G>
    </Svg>
  );
}
