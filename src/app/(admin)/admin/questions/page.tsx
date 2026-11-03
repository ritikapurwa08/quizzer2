"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/LoadingState";

export default function AdminQuestionsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/pool");
  }, [router]);

  return <LoadingState message="Redirecting to Master Question Pool..." />;
}
