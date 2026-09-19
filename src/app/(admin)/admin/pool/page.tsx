import { QuestionPoolDashboard } from "@/components/admin/QuestionPoolDashboard";

export default function AdminPoolPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Question Pool & Queue</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Persistent topic-wise question queues across the 73 Authoritative Master Topics.
          </p>
        </div>
      </div>
      <QuestionPoolDashboard />
    </div>
  );
}
