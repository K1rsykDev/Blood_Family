import { useEffect, useState, useRef } from "react";

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  startTop: number;
  fontSize: number;
  delay: number;
}

export const SnowEffect = ({ enabled = true }: { enabled?: boolean }) => {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [mouseX, setMouseX] = useState(50); // percentage from left
  const mountedRef = useRef(false);
  const targetMouseX = useRef(50);

  // Track mouse movement
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX.current = (e.clientX / window.innerWidth) * 100;
    };

    // Smooth interpolation
    const interval = setInterval(() => {
      setMouseX((prev) => {
        const diff = targetMouseX.current - prev;
        return prev + diff * 0.1;
      });
    }, 16);

    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      setSnowflakes([]);
      setIsReady(false);
      return;
    }

    const timer = setTimeout(() => {
      if (!mountedRef.current) return;
      
      const flakes: Snowflake[] = Array.from({ length: 50 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        animationDuration: 5 + Math.random() * 10,
        startTop: -10 - Math.random() * 50,
        fontSize: 0.5 + Math.random() * 1,
        delay: Math.random() * 10,
      }));

      setSnowflakes(flakes);
      setIsReady(true);
    }, 100);

    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      clearTimeout(timer);
    };
  }, [enabled]);

  if (!enabled || !isReady) return null;

  // Calculate wind offset based on mouse position (center = 50%)
  const windOffset = (mouseX - 50) * 0.8; // -40 to +40 range

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="snowflake-interactive"
          style={{
            left: `${flake.left}%`,
            top: `${flake.startTop}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${flake.delay}s`,
            fontSize: `${flake.fontSize}rem`,
            "--wind-offset": `${windOffset}px`,
          } as React.CSSProperties}
        >
          ❄
        </div>
      ))}
    </div>
  );
};
