import { ImportWizard } from "@/components/admin/ImportWizard";

export default function AdminImportPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Import Questions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Select a topic and set, copy the Gemini prompt, then paste the Markdown response to import.
          </p>
        </div>
      </div>
      <ImportWizard />
    </div>
  );
}
