"use client";

import { useState } from "react";
import { ImportWizard } from "@/components/admin/ImportWizard";
import { ZipBatchImporter } from "@/components/admin/ZipBatchImporter";

type Tab = "batch" | "manual";

export default function AdminImportPage() {
  const [activeTab, setActiveTab] = useState<Tab>("batch");

  return (
    <div className="space-y-4 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-foreground">Import Questions</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Import PYQ batches from the QA pipeline, or manually configure and paste JSON.
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg border bg-muted/30 p-1 w-fit">
        <button
          onClick={() => setActiveTab("batch")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "batch"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          📦 PYQ Batch Importer
        </button>
        <button
          onClick={() => setActiveTab("manual")}
          className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
            activeTab === "manual"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          ✏️ Manual Import
        </button>
      </div>

      {activeTab === "batch" && <ZipBatchImporter />}
      {activeTab === "manual" && <ImportWizard />}
    </div>
  );
}
