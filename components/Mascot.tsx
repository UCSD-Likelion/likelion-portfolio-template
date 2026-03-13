"use client";

import { useEffect, useRef, useState } from "react";

type Rect = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

function intersects(a: Rect, b: Rect) {
  return (
    a.left < b.right &&
    a.right > b.left &&
    a.top < b.bottom &&
    a.bottom > b.top
  );
}

export default function Mascot() {
  const [enabled, setEnabled] = useState(true);
  const ref = useRef<HTMLDivElement>(null);

  const x = useRef(120);
  const y = useRef(300);

  const vx = useRef(0);
  const vy = useRef(0);

  const facing = useRef<1 | -1>(1);
  const isOnGround = useRef(false);

  const jumpCount = useRef(0);
  const MAX_JUMPS = 4;

  const touchingWallLeft = useRef(false);
  const touchingWallRight = useRef(false);

  // double-tap dash tracking
  const lastRightTap = useRef(0);
  const lastLeftTap = useRef(0);
  const dashDirection = useRef<"left" | "right" | null>(null);

  const keys = useRef({
    ArrowLeft: false,
    ArrowRight: false,
  });

  const obstacleRects = useRef<DOMRect[]>([]);

  const SIZE = 40;
  const SPEED = 4;
  const DASH_SPEED = 10;
  const DOUBLE_TAP_DELAY = 250;
  const GRAVITY = 0.8;
  const JUMP_POWER = -13;
  const WALL_JUMP_X = 7;

  const collectObstacles = () => {
    const selector = "img, button, a, h1, h2, h3, p, svg";
    const elements = Array.from(document.querySelectorAll(selector));

    obstacleRects.current = elements
      .filter((el) => {
        if (ref.current && ref.current.contains(el)) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      })
      .map((el) => el.getBoundingClientRect());
  };

  useEffect(() => {
    collectObstacles();
    window.addEventListener("resize", collectObstacles);

    const interval = setInterval(() => {
      collectObstacles();
    }, 1000);

    return () => {
      window.removeEventListener("resize", collectObstacles);
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let frameId: number;

    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();

      // auto-repeat keydown 무시: 길게 누르는 걸 두 번 탭으로 인식하지 않기
      if ((e.key === "ArrowRight" || e.key === "ArrowLeft") && e.repeat) {
        return;
      }

      if (e.key === "ArrowRight") {
        // 두 번째 탭이면 dash 활성화
        if (now - lastRightTap.current < DOUBLE_TAP_DELAY) {
          dashDirection.current = "right";
        }
        lastRightTap.current = now;
        keys.current.ArrowRight = true;
      }

      if (e.key === "ArrowLeft") {
        if (now - lastLeftTap.current < DOUBLE_TAP_DELAY) {
          dashDirection.current = "left";
        }
        lastLeftTap.current = now;
        keys.current.ArrowLeft = true;
      }

      // jump / wall jump
      if (e.code === "Space") {
        e.preventDefault();

        // wall jump 우선
        if (!isOnGround.current && touchingWallLeft.current) {
          vy.current = JUMP_POWER;
          vx.current = WALL_JUMP_X;
          facing.current = 1;
          jumpCount.current = 1;
          dashDirection.current = null;
          return;
        }

        if (!isOnGround.current && touchingWallRight.current) {
          vy.current = JUMP_POWER;
          vx.current = -WALL_JUMP_X;
          facing.current = -1;
          jumpCount.current = 1;
          dashDirection.current = null;
          return;
        }

        // 일반 점프 / 연속 점프
        if (jumpCount.current < MAX_JUMPS) {
          vy.current = JUMP_POWER;
          isOnGround.current = false;
          jumpCount.current += 1;
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        keys.current.ArrowRight = false;

        // 오른쪽 dash 중인데 손 떼면 해제
        if (dashDirection.current === "right") {
          dashDirection.current = null;
        }
      }

      if (e.key === "ArrowLeft") {
        keys.current.ArrowLeft = false;

        // 왼쪽 dash 중인데 손 떼면 해제
        if (dashDirection.current === "left") {
          dashDirection.current = null;
        }
      }
    };

    const animate = () => {
      if (!ref.current) return;

      touchingWallLeft.current = false;
      touchingWallRight.current = false;

      const maxX = window.innerWidth - SIZE;
      const maxY = window.innerHeight - SIZE;

      // input
      let inputX = 0;

      const movingLeft = keys.current.ArrowLeft;
      const movingRight = keys.current.ArrowRight;

      const speedLeft =
        dashDirection.current === "left" && movingLeft ? DASH_SPEED : SPEED;
      const speedRight =
        dashDirection.current === "right" && movingRight ? DASH_SPEED : SPEED;

      if (movingLeft && !movingRight) {
        inputX = -speedLeft;
        facing.current = -1;
      } else if (movingRight && !movingLeft) {
        inputX = speedRight;
        facing.current = 1;
      } else {
        // 아무 방향키도 안 누르면 dash 해제
        if (!movingLeft && !movingRight) {
          dashDirection.current = null;
        }
      }

      // horizontal velocity
      if (isOnGround.current) {
        vx.current = inputX;
      } else {
        if (inputX !== 0) vx.current = inputX;
        vx.current *= 0.98;
      }

      // gravity
      vy.current += GRAVITY;

      // ---------- horizontal move ----------
      let nextX = x.current + vx.current;

      const horizontalRect: Rect = {
        left: nextX,
        right: nextX + SIZE,
        top: y.current,
        bottom: y.current + SIZE,
      };

      for (const rect of obstacleRects.current) {
        const obstacle: Rect = {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };

        if (intersects(horizontalRect, obstacle)) {
          if (vx.current > 0) {
            nextX = obstacle.left - SIZE;
            touchingWallRight.current = true;
          } else if (vx.current < 0) {
            nextX = obstacle.right;
            touchingWallLeft.current = true;
          }
          vx.current = 0;
          dashDirection.current = null;
        }
      }

      x.current = nextX;

      if (x.current < 0) {
        x.current = 0;
        touchingWallLeft.current = true;
        dashDirection.current = null;
      }
      if (x.current > maxX) {
        x.current = maxX;
        touchingWallRight.current = true;
        dashDirection.current = null;
      }

      // ---------- vertical move ----------
      let nextY = y.current + vy.current;
      isOnGround.current = false;

      const verticalRect: Rect = {
        left: x.current,
        right: x.current + SIZE,
        top: nextY,
        bottom: nextY + SIZE,
      };

      for (const rect of obstacleRects.current) {
        const obstacle: Rect = {
          left: rect.left,
          right: rect.right,
          top: rect.top,
          bottom: rect.bottom,
        };

        if (intersects(verticalRect, obstacle)) {
          // 위에 착지
          if (vy.current > 0 && y.current + SIZE <= obstacle.top + 10) {
            nextY = obstacle.top - SIZE;
            vy.current = 0;
            isOnGround.current = true;
            jumpCount.current = 0;
          }
          // 아래에서 머리 부딪힘
          else if (vy.current < 0 && y.current >= obstacle.bottom - 10) {
            nextY = obstacle.bottom;
            vy.current = 0;
          }
        }
      }

      y.current = nextY;

      // 바닥
      if (y.current >= maxY) {
        y.current = maxY;
        vy.current = 0;
        isOnGround.current = true;
        jumpCount.current = 0;
      }

      if (y.current < 0) {
        y.current = 0;
        vy.current = 0;
      }

      // ---------- animation ----------
      const isRunning = isOnGround.current && Math.abs(vx.current) > 0.5;
      const isDashingNow =
        (dashDirection.current === "left" && keys.current.ArrowLeft) ||
        (dashDirection.current === "right" && keys.current.ArrowRight);

      const bounce = isRunning
        ? Math.sin(performance.now() * 0.02) * (isDashingNow ? 6 : 4)
        : 0;

      let rotation = 0;
      if (!isOnGround.current) {
        rotation = vy.current < 0 ? -12 : 12;
      } else if (isDashingNow) {
        rotation = facing.current === 1 ? -8 : 8;
      }

      ref.current.style.transform = `
        translate(${x.current}px, ${y.current + bounce}px)
        scaleX(${-facing.current})
        rotate(${rotation}deg)
      `;
      ref.current.style.transition = "transform 0.03s linear";

      frameId = requestAnimationFrame(animate);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    frameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [enabled]);

  if (!enabled) {
    return (
      <button
        onClick={() => setEnabled(true)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10000,
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
        }}
      >
        Turn Mascot On
      </button>
    );
  }

  return (
    <>
      <button
        onClick={() => setEnabled(false)}
        style={{
          position: "fixed",
          top: 20,
          right: 20,
          zIndex: 10000,
          padding: "10px 16px",
          borderRadius: "12px",
          border: "1px solid #ccc",
          background: "white",
          cursor: "pointer",
        }}
      >
        Turn Mascot Off
      </button>

      <div
        ref={ref}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: `${SIZE}px`,
          height: `${SIZE}px`,
          fontSize: "28px",
          zIndex: 9999,
          userSelect: "none",
          pointerEvents: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <img
          src="/ucsd-mascot.png"
          alt="mascot"
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            imageRendering: "pixelated",
  }}
/>
      </div>
    </>
  );
}