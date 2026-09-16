import * as React from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, Easing, Img, staticFile } from 'remotion';
import { EnergyConnections } from './components/energy-connections';
import { HERO_ANIMATION_CONFIG, INGREDIENTS_CONFIG, PHASES } from './hero-food-constants';

export const HeroFoodComposition: React.FC = () => {
  const frame = useCurrentFrame();

  // ---------------------------------------------------------------------------
  // 1. TÔ GỖ TỰ NHIÊN BAN ĐẦU (Wooden Bowl)
  // ---------------------------------------------------------------------------
  // Nhấp nhô nhẹ nhàng
  const idleFloatY = Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 1.5) * 4;

  // Lần xoay thứ 1 (Phase 2: frame 25 -> 65): xoay 360 độ tạo động lực
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

  // Lần xoay thứ 2 (Phase 5: frame 151 -> 175): xoay nhẹ chuẩn bị hội tụ
  const secondRotation = interpolate(
    frame,
    [PHASES.PHASE_5_SECOND_ROTATION.start, PHASES.PHASE_5_SECOND_ROTATION.end],
    [0, 75],
    {
      easing: Easing.bezier(0.4, 0, 0.2, 1),
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  const totalBowlRotation = firstRotation + secondRotation;

  // Độ mờ của tô gỗ rỗng ban đầu (chuyển giao sang món hoàn chỉnh ở Phase 6->7)
  const emptyBowlOpacity = interpolate(frame, [185, 195, 236, 240], [1, 0, 0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // ---------------------------------------------------------------------------
  // 2. KẾT NỐI NĂNG LƯỢNG THỰC VẬT (Phase 3 & 4)
  // ---------------------------------------------------------------------------
  const connectionOpacity = interpolate(frame, [85, 110, 150, 172], [0, 0.85, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

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
      {/* Vầng hào quang mầm xanh thanh nhẹ phía sau */}
      <div
        style={{
          position: 'absolute',
          width: 480,
          height: 480,
          borderRadius: '50%',
          background:
            'radial-gradient(circle, rgba(21,128,61,0.14) 0%, rgba(13,148,136,0.06) 55%, transparent 75%)',
          transform: `scale(${1 + Math.sin(frame * 0.05) * 0.04})`,
        }}
      />

      {/* Đường nối năng lượng thực vật (Phase 3 & 4) */}
      <EnergyConnections progress={frame / 240} opacity={connectionOpacity} />

      {/* =========================================================
          TÔ GỖ BAN ĐẦU (FOOD PHOTOGRAPHY BOWL)
          ========================================================= */}
      <div
        style={{
          position: 'absolute',
          width: 340,
          height: 340,
          transform: `translate3d(0, ${idleFloatY}px, 0) rotate(${totalBowlRotation}deg)`,
          opacity: emptyBowlOpacity,
          display: emptyBowlOpacity > 0 ? 'block' : 'none',
          willChange: 'transform, opacity',
        }}
      >
        <Img
          src={staticFile('hero/optimized/bowl.webp')}
          alt="Tô gỗ tự nhiên"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            filter: 'drop-shadow(0 14px 24px rgba(15, 23, 42, 0.22))',
          }}
        />
      </div>

      {/* =========================================================
          5 NGUYÊN LIỆU THỰC TẾ (BƠ, ĐẬU HŨ, CÀ CHUA, CÀ RỐT, XÀ LÁCH)
          Toàn bộ chuyển động sử dụng translate3d (Compositor-only)
          ========================================================= */}
      {INGREDIENTS_CONFIG.map((ing, idx) => {
        const revealStart = PHASES.PHASE_3_INGREDIENT_REVEAL.start + ing.delayFrames;
        const revealEnd = revealStart + 26;

        let currentDistance = 0;
        let ingOpacity = 0;
        let ingScale = 0;
        let floatAngle = (ing.angle * Math.PI) / 180;

        if (frame < revealStart) {
          currentDistance = 0;
          ingOpacity = 0;
          ingScale = 0;
        } else if (frame <= revealEnd) {
          // Bung ra từ lòng tô
          currentDistance = interpolate(frame, [revealStart, revealEnd], [25, ing.distance], {
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
          // Hội tụ xoáy ốc về tâm tô
          const convStart = PHASES.PHASE_6_CONVERGENCE.start;
          const convEnd = PHASES.PHASE_6_CONVERGENCE.end;

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
          currentDistance = 0;
          ingOpacity = 0;
          ingScale = 0;
        }

        if (ingOpacity <= 0.01) return null;

        // Tọa độ lệch tâm (offset) từ 0, 0
        const offsetX = Math.cos(floatAngle) * currentDistance;
        const offsetY = Math.sin(floatAngle) * currentDistance;

        return (
          <div
            key={ing.id}
            style={{
              position: 'absolute',
              width: ing.size,
              height: ing.size,
              opacity: ingOpacity,
              transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${ingScale}) rotate(${ing.rotationOffset}deg)`,
              willChange: 'transform, opacity',
            }}
          >
            <Img
              src={staticFile(ing.file)}
              alt={ing.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                filter: 'drop-shadow(0 8px 16px rgba(15, 23, 42, 0.18))',
              }}
            />
          </div>
        );
      })}

      {/* =========================================================
          MÓN ĂN HOÀN CHỈNH: RAINBOW BUDDHA BOWL (FOOD PHOTOGRAPHY)
          ========================================================= */}
      {frame >= 194 &&
        (() => {
          const dishOpacity = interpolate(frame, [195, 202, 236, 240], [0, 1, 1, 0], {
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const dishScale = interpolate(frame, [195, 206, 218], [0.85, 1.05, 1.0], {
            easing: Easing.bezier(0.16, 1, 0.3, 1),
            extrapolateLeft: 'clamp',
            extrapolateRight: 'clamp',
          });

          const dishFloat = Math.sin((frame / HERO_ANIMATION_CONFIG.FPS) * Math.PI * 1.5) * 3.5;

          return (
            <div
              style={{
                position: 'absolute',
                width: 340,
                height: 340,
                transform: `translate3d(0, ${dishFloat}px, 0) scale(${dishScale})`,
                opacity: dishOpacity,
                willChange: 'transform, opacity',
              }}
            >
              <Img
                src={staticFile('hero/optimized/completed-dish.webp')}
                alt="Tô Rainbow Buddha Bowl hoàn chỉnh"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  filter: 'drop-shadow(0 16px 28px rgba(15, 23, 42, 0.25))',
                }}
              />
            </div>
          );
        })()}
    </AbsoluteFill>
  );
};
