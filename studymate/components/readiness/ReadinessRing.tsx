type ReadinessRingProps = {
  value: number;
};

export default function ReadinessRing({ value }: ReadinessRingProps) {
  const clampedValue = Math.max(0, Math.min(100, value));
  const size = 220;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clampedValue / 100);

  return (
    <div className="flex flex-col items-center justify-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox={`0 0 ${size} ${size}`}
          aria-label={`Exam readiness score ${clampedValue} percent`}
          role="img"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#7C3AED"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-bold tracking-tight text-gray-900">
            {clampedValue}
            <span className="text-2xl font-semibold text-gray-500">%</span>
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold uppercase tracking-[0.2em] text-gray-500">
        Exam Readiness
      </p>
    </div>
  );
}
