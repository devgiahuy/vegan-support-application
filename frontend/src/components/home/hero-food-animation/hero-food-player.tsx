'use client';

import * as React from 'react';
import { Player } from '@remotion/player';
import { HeroFoodComposition } from './hero-food-composition';
import { CompletedBuddhaBowl } from './components/completed-buddha-bowl';
import { HERO_ANIMATION_CONFIG } from './hero-food-constants';

export interface HeroFoodPlayerProps {
  className?: string;
}

export function HeroFoodPlayer({ className = '' }: HeroFoodPlayerProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const listener = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, []);

  // Nếu người dùng bật giảm chuyển động, hiển thị món ăn hoàn chỉnh tĩnh
  if (prefersReducedMotion) {
    return (
      <div
        className={`relative flex h-full w-full items-center justify-center ${className}`}
        aria-label="Minh họa món ăn chay Rainbow Buddha Bowl"
      >
        <CompletedBuddhaBowl size={340} />
      </div>
    );
  }

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <Player
        component={HeroFoodComposition}
        durationInFrames={HERO_ANIMATION_CONFIG.TOTAL_FRAMES}
        compositionWidth={HERO_ANIMATION_CONFIG.COMPOSITION_WIDTH}
        compositionHeight={HERO_ANIMATION_CONFIG.COMPOSITION_HEIGHT}
        fps={HERO_ANIMATION_CONFIG.FPS}
        autoPlay
        loop
        controls={false}
        clickToPlay={false}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
