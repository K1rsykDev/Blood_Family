export const Garland = ({ enabled = true }: { enabled?: boolean }) => {
  if (!enabled) return null;

  const lights = Array.from({ length: 30 }, (_, i) => i);

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      {/* Wire */}
      <svg
        className="w-full h-16"
        viewBox="0 0 1920 60"
        preserveAspectRatio="none"
      >
        <path
          d="M0,20 Q240,50 480,20 T960,20 T1440,20 T1920,20"
          fill="none"
          stroke="hsl(120 30% 20%)"
          strokeWidth="3"
        />
      </svg>
      
      {/* Lights */}
      <div className="absolute top-3 left-0 right-0 flex justify-around px-4">
        {lights.map((i) => (
          <div
            key={i}
            className="garland-light"
            style={{
              marginTop: `${Math.sin(i * 0.5) * 10 + 10}px`,
            }}
          />
        ))}
      </div>
    </div>
  );
};
