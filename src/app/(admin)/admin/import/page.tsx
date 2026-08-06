import { ImportWizard } from "@/components/admin/ImportWizard";

export default function AdminImportPage() {
  return (
    <div className="space-y-4 max-w-2xl">
      <h1 className="text-xl font-semibold">Import Questions</h1>
      <ImportWizard />
    </div>
  );
}
