"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

type MaterialsAutoRefreshProps = {
  activeCount: number;
};

export default function MaterialsAutoRefresh({ activeCount }: MaterialsAutoRefreshProps) {
  const router = useRouter();

  useEffect(() => {
    if (activeCount <= 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeCount, router]);

  return null;
}
