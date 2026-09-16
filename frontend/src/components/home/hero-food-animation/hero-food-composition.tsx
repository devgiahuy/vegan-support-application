import * as React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from 'remotion';
import { FoodBowlCeramic } from './components/food-bowl-ceramic';
import {
  AvocadoVector,
  ChickpeasVector,
  TomatoVector,
  CarrotVector,
  GreensVector,
} from './components/ingredients-vectors';
import { CompletedBuddhaBowl } from './components/completed-buddha-bowl';
import { EnergyConnections } from './components/energy-connections';
import { HERO_ANIMATION_CONFIG, INGREDIENTS_CONFIG, PHASES } from './hero-food-constants';

export const HeroFoodComposition: React.FC = () => {
  const frame = useCurrentFrame();

  // ---------------------------------------------------------------------------
  // 1. TÔ GỐM SỨ BAN ĐẦU (Empty Ceramic Bowl)
  // ---------------------------------------------------------------------------
  // Floating nhấp nhô nhẹ nhàng
  const idleFloatY = Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 1.5) * 4;

  // Lần xoay thứ 1 (Phase 2: frame 25 -> 65): xoay 360 độ
  const firstRotation = interpolate(
    frame,
    [PHASES.PHASE_2_FIRST_ROTATION.start, PHASES.PHASE_2_FIRST_ROTATION.end],
    [0, 360],
    {
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // Lần xoay thứ 2 (Phase 5: frame 151 -> 175): xoay 90 độ chuẩn bị hợp nhất
  const secondRotation = interpolate(
    frame,
    [PHASES.PHASE_5_SECOND_ROTATION.start, PHASES.PHASE_5_SECOND_ROTATION.end],
    [0, 90],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const totalBowlRotation = firstRotation + secondRotation;

  // Độ mờ của tô gốm ban đầu (chuyển sang món hoàn chỉnh ở Phase 6->7 và hồi lại ở Phase 9)
  const emptyBowlOpacity = interpolate(frame, [185, 195, 236, 240], [1, 0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---------------------------------------------------------------------------
  // 2. CÁC NGUYÊN LIỆU (5 Ingredients Reveal & Orbit & Convergence)
  // ---------------------------------------------------------------------------
  const connectionOpacity = interpolate(frame, [85, 110, 150, 172], [0, 0.85, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Render từng nguyên liệu
  const renderIngredientComponent = (id: string) => {
    switch (id) {
      case 'avocado':
        return <AvocadoVector size={110} />;
      case 'chickpeas':
        return <ChickpeasVector size={105} />;
      case 'tomato':
        return <TomatoVector size={105} />;
      case 'carrot':
        return <CarrotVector size={110} />;
      case 'greens':
        return <GreensVector size={115} />;
      default:
        return null;
    }
  };

  return (
    <AbsoluteFill
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        backgroundColor: 'transparent',
      }}
    >
      {/* Hào quang nền xanh ngọc dịu dàng */}
      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(21,128,61,0.12) 0%, rgba(13,148,136,0.06) 55%, transparent 75%)',
          transform: `scale(${1 + Math.sin(frame * 0.05) * 0.04})`,
        }}
      />

      {/* Đường nối năng lượng thực vật (Phase 3 & 4) */}
      <EnergyConnections progress={frame / 240} opacity={connectionOpacity} />

      {/* =========================================================
          TÔ GỐM SỨ BAN ĐẦU
          ========================================================= */}
      <div
        style={{
          position: 'absolute',
          transform: `translateY(${idleFloatY}px) rotate(${totalBowlRotation}deg)`,
          opacity: emptyBowlOpacity,
          display: emptyBowlOpacity > 0 ? 'block' : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <FoodBowlCeramic size={330} />
      </div>

      {/* =========================================================
          5 NGUYÊN LIỆU (BUNG RA -> QUỸ ĐẠO -> HỘI TỤ)
          ========================================================= */}
      {INGREDIENTS_CONFIG.map((ing, idx) => {
        const revealStart = PHASES.PHASE_3_INGREDIENT_REVEAL.start + ing.delayFrames;
        const revealEnd = revealStart + 26;

        // 1. Khoảng cách từ tâm
        let currentDistance = 0;
        let ingOpacity = 0;
        let ingScale = 0;
        let floatAngle = (ing.angle * Math.PI) / 180;

        if (frame < revealStart) {
          // Chưa xuất hiện
          currentDistance = 0;
          ingOpacity = 0;
          ingScale = 0;
        } else if (frame <= revealEnd) {
          // Đang bung ra từ lòng tô
          currentDistance = interpolate(frame, [revealStart, revealEnd], [30, ing.distance], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          ingOpacity = interpolate(frame, [revealStart, revealStart + 10], [0, 1], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          ingScale = interpolate(
            frame,
            [revealStart, revealEnd - 6, revealEnd],
            [0.2, ing.scale * 1.15, ing.scale],
            {
              easing: Easing.bezier(0.34, 1.56, 0.64, 1),
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            }
          );
        } else if (frame <= PHASES.PHASE_4_INGREDIENT_ORBIT.end) {
          // Quỹ đạo nhấp nhô nhẹ nhàng
          const orbitTime = frame - PHASES.PHASE_4_INGREDIENT_ORBIT.start;
          floatAngle += Math.sin(orbitTime * 0.07 + idx * 1.2) * 0.05;
          currentDistance = ing.distance + Math.cos(orbitTime * 0.09 + idx) * 8;
          ingOpacity = 1;
          ingScale = ing.scale + Math.sin(orbitTime * 0.08 + idx) * 0.03;
        } else if (frame <= PHASES.PHASE_6_CONVERGENCE.end) {
          // Chuẩn bị và hội tụ xoáy về tâm tô
          const convStart = PHASES.PHASE_6_CONVERGENCE.start;
          const convEnd = PHASES.PHASE_6_CONVERGENCE.end;

          // Xoay thêm góc theo vòng xoáy
          const vortexAngleOffset = interpolate(frame, [convStart, convEnd], [0, 1.2], {
            easing: Easing.in(Easing.quad),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          floatAngle += vortexAngleOffset;

          currentDistance = interpolate(frame, [convStart, convEnd], [ing.distance, 15], {
            easing: Easing.bezier(0.7, 0, 0.84, 0),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          ingScale = interpolate(frame, [convStart, convEnd], [ing.scale, 0.15], {
            easing: Easing.bezier(0.7, 0, 0.84, 0),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
          ingOpacity = interpolate(frame, [convEnd - 6, convEnd], [1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });
        } else {
          // Đã hội tụ xong
          currentDistance = 0;
          ingOpacity = 0;
          ingScale = 0;
        }

        if (ingOpacity <= 0.01) return null;

        // Tọa độ tính từ tâm 350, 350
        const posX = 350 + Math.cos(floatAngle) * currentDistance - 50;
        const posY = 350 + Math.sin(floatAngle) * currentDistance - 50;

        return (
          <div
            key={ing.id}
            style={{
              position: 'absolute',
              left: `${posX}px`,
              top: `${posY}px`,
              opacity: ingOpacity,
              transform: `scale(${ingScale}) rotate(${ing.rotationOffset}deg)`,
              transformOrigin: 'center center',
              willChange: 'transform, opacity, left, top',
            }}
          >
            {renderIngredientComponent(ing.id)}
          </div>
        );
      })}

      {/* =========================================================
          MÓN ĂN HOÀN CHỈNH: RAINBOW BUDDHA BOWL (Phase 7 & 8)
          ========================================================= */}
      {frame >= 194 &&
        (() => {
          const dishOpacity = interpolate(frame, [195, 202, 236, 240], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const dishScale = interpolate(frame, [195, 206, 218], [0.78, 1.05, 1.0], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const dishFloat = Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 1.5) * 3.5;

          return (
            <div
              style={{
                position: 'absolute',
                transform: `translateY(${dishFloat}px) scale(${dishScale})`,
                opacity: dishOpacity,
                willChange: 'transform, opacity',
              }}
            >
              <CompletedBuddhaBowl size={330} />
            </div>
          );
        })()}
    </AbsoluteFill>
  );
};
