"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/store/app-store";

export default function Home() {
  const router = useRouter();
  const currentUserId = useAppStore((s) => s.currentUserId);

  useEffect(() => {
    router.replace(currentUserId ? "/dashboard" : "/login");
  }, [currentUserId, router]);

  return null;
}
