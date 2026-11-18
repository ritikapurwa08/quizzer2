"use client";

import { Suspense } from "react";
import { useParams } from "next/navigation";
import { TopicDetailView } from "../page";

function SubTopicContent() {
  const { subTopicId } = useParams<{ subTopicId: string }>();
  const decoded = subTopicId ? decodeURIComponent(subTopicId) : undefined;
  return <TopicDetailView forcedSubTopicId={decoded} />;
}

export default function SubTopicPage() {
  return (
    <Suspense fallback={<div className="p-4 text-muted-foreground">Loading practice sets...</div>}>
      <SubTopicContent />
    </Suspense>
  );
}
