"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LoadingState } from "@/components/shared/LoadingState";

export default function BookmarksRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/saved-questions?tab=bookmarks");
  }, [router]);

  return <LoadingState message="Redirecting to Saved & Review Questions..." />;
}
