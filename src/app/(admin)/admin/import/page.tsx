import { ImportWizard } from "@/components/admin/ImportWizard";

export default function AdminImportPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Import Questions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configure target topic, copy AI prompt, and paste JSON to import test sets.
          </p>
        </div>
      </div>
      <ImportWizard />
    </div>
  );
}
