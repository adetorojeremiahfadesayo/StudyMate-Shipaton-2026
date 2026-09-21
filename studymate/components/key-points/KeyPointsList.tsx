"use client";

import type { KeyPoint } from "@/types";
import KeyPointCard from "./KeyPointCard";

type KeyPointsListProps = {
  points: KeyPoint[];
};

export default function KeyPointsList({ points }: KeyPointsListProps) {
  if (points.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {points.map((point) => (
        <KeyPointCard key={point.id} point={point} />
      ))}
    </div>
  );
}
