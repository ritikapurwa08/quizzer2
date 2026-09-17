"use client";

/**
 * ZipBatchImporter.tsx
 *
 * Admin UI component that accepts the Quizzer_PYQ_Final_Import_Ready.zip
 * (or any batch JSON files from final_pyq_batches), validates each batch,
 * and imports them to Convex using importTestSetAtomic — all with zero manual work.
 *
 * Zero AI-generation. No server required. Runs entirely in the browser.
 */

import { useState, useCallback, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";

interface BatchFile {
  masterTopic: string;
  batchIndex: number;
  batchName: string;
  subject: string;
  subjectSlug: string;
  topicSlug: string;
  negativeMarking: boolean;
  questionCount: number;
  questions: Array<{
    type: "mcq";
    questionText: string;
    options: Array<{ id: string; text: string }>;
    correctAnswer: string;
    explanation?: string;
    reference?: string;
    difficulty: "easy" | "medium" | "hard";
    order: number;
    meta: {
      sourceType: "PYQ";
      sourceQuestionId: number;
      exam?: string;
      year?: number | null;
    };
  }>;
}

type BatchStatus = "pending" | "importing" | "imported" | "skipped" | "error";

interface BatchEntry {
  fileName: string;
  topic: string;
  batchIndex: number;
  data: BatchFile;
  status: BatchStatus;
  statusMessage: string;
}

export function ZipBatchImporter() {
  const [batches, setBatches] = useState<BatchEntry[]>([]);
  const [running, setRunning] = useState(false);
  const [aborted, setAborted] = useState(false);
  const [stats, setStats] = useState({ imported: 0, skipped: 0, errors: 0 });
  const [dropActive, setDropActive] = useState(false);
  const abortRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importTestSetAtomic = useMutation(api.questions.importTestSetAtomic);

  /** Load JSON files dropped/selected by the user */
  const loadJsonFiles = useCallback(async (files: File[]) => {
    const jsonFiles = files.filter((f) => f.name.endsWith(".json")).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    if (jsonFiles.length === 0) {
      alert("No .json batch files found. Please select JSON files from the final_pyq_batches directory.");
      return;
    }

    const entries: BatchEntry[] = [];
    for (const file of jsonFiles) {
      try {
        const text = await file.text();
        const data: BatchFile = JSON.parse(text);
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          entries.push({
            fileName: file.name,
            topic: data.masterTopic || file.name,
            batchIndex: data.batchIndex || 0,
            data,
            status: "error",
            statusMessage: "No questions array in batch",
          });
          continue;
        }
        if (data.questions.length > 20) {
          entries.push({
            fileName: file.name,
            topic: data.masterTopic || file.name,
            batchIndex: data.batchIndex || 0,
            data,
            status: "error",
            statusMessage: `Too many questions: ${data.questions.length} (max 20)`,
          });
          continue;
        }
        entries.push({
          fileName: file.name,
          topic: data.masterTopic || file.name,
          batchIndex: data.batchIndex || 0,
          data,
          status: "pending",
          statusMessage: `${data.questions.length} questions`,
        });
      } catch (e) {
        entries.push({
          fileName: file.name,
          topic: file.name,
          batchIndex: 0,
          data: {} as BatchFile,
          status: "error",
          statusMessage: `Parse error: ${(e as Error).message}`,
        });
      }
    }
    setBatches(entries);
    setStats({ imported: 0, skipped: 0, errors: 0 });
    setAborted(false);
  }, []);

  /** Handle drag-and-drop */
  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setDropActive(false);
      const items = Array.from(e.dataTransfer.files);
      loadJsonFiles(items);
    },
    [loadJsonFiles]
  );

  /** Handle file input */
  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      loadJsonFiles(Array.from(e.target.files));
    },
    [loadJsonFiles]
  );

  /** Import a single batch entry */
  async function importBatchEntry(entry: BatchEntry): Promise<{ status: BatchStatus; message: string }> {
    const { data } = entry;
    try {
      const result = await importTestSetAtomic({
        subjectSlug: data.subjectSlug,
        subjectName: data.subject,
        subjectNameHindi: data.subject,
        topicSlug: data.topicSlug,
        topicName: data.masterTopic,
        topicNameHindi: data.masterTopic,
        testSetName: data.batchName,
        negativeMarking: data.negativeMarking ?? true,
        questions: data.questions.map((q) => ({
          type: q.type,
          questionText: q.questionText,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation || "",
          reference: q.reference || "",
          difficulty: q.difficulty,
          meta: {
            sourceType: q.meta.sourceType,
            sourceQuestionId: q.meta.sourceQuestionId,
            exam: q.meta.exam,
          },
        })),
      });

      if ((result as any).status === "already_exists") {
        return { status: "skipped", message: `Already exists (${(result as any).existingCount} questions)` };
      }
      return { status: "imported", message: `Imported ${(result as any).imported ?? data.questions.length} questions` };
    } catch (err: unknown) {
      return { status: "error", message: (err as Error).message || "Unknown error" };
    }
  }

  /** Run the full import queue */
  async function runImport() {
    abortRef.current = false;
    setAborted(false);
    setRunning(true);
    let imported = 0;
    let skipped = 0;
    let errors = 0;

    for (let i = 0; i < batches.length; i++) {
      if (abortRef.current) {
        setAborted(true);
        break;
      }

      const entry = batches[i];
      if (entry.status === "imported" || entry.status === "skipped") {
        // Already done — idempotent re-run support
        continue;
      }
      if (entry.status === "error" && !entry.data.questions) continue; // skip load errors

      // Mark as importing
      setBatches((prev) =>
        prev.map((b, idx) =>
          idx === i ? { ...b, status: "importing", statusMessage: "Importing…" } : b
        )
      );

      const { status, message } = await importBatchEntry(entry);

      if (status === "imported") imported++;
      else if (status === "skipped") skipped++;
      else errors++;

      setBatches((prev) =>
        prev.map((b, idx) =>
          idx === i ? { ...b, status, statusMessage: message } : b
        )
      );
      setStats({ imported, skipped, errors });

      // Small delay to avoid Convex rate limits
      await new Promise((r) => setTimeout(r, 150));
    }

    setRunning(false);
  }

  function abortImport() {
    abortRef.current = true;
  }

  function clearAll() {
    setBatches([]);
    setStats({ imported: 0, skipped: 0, errors: 0 });
    setAborted(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const pendingCount = batches.filter((b) => b.status === "pending").length;
  const totalCount = batches.length;

  const statusIcon = (status: BatchStatus) => {
    switch (status) {
      case "pending": return "⏳";
      case "importing": return "⚙️";
      case "imported": return "✅";
      case "skipped": return "⏭️";
      case "error": return "❌";
    }
  };

  const statusColor = (status: BatchStatus): string => {
    switch (status) {
      case "imported": return "text-green-600 dark:text-green-400";
      case "skipped": return "text-blue-500 dark:text-blue-400";
      case "error": return "text-red-500 dark:text-red-400";
      case "importing": return "text-yellow-500 dark:text-yellow-400";
      default: return "text-muted-foreground";
    }
  };

  const progressPercent =
    totalCount > 0
      ? Math.round(((stats.imported + stats.skipped + stats.errors) / totalCount) * 100)
      : 0;

  return (
    <div className="space-y-5">
      {/* Drop Zone */}
      {batches.length === 0 && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
          onDragLeave={() => setDropActive(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 transition-colors cursor-pointer select-none
            ${dropActive
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
            }`}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="text-4xl">📂</div>
          <p className="text-sm font-medium text-foreground">
            Drop JSON batch files here, or click to select
          </p>
          <p className="text-xs text-muted-foreground text-center">
            Select all files from <code>src/xdata/final_pyq_batches/&lt;TopicName&gt;/</code>
            <br />Files must be <code>batch_NNN.json</code> files produced by the QA pipeline.
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            multiple
            className="hidden"
            onChange={handleFileInput}
          />
        </div>
      )}

      {/* Loaded batches summary */}
      {batches.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {totalCount} batch files loaded &middot; {pendingCount} pending
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Each batch is ≤20 PYQ questions. Importing is idempotent — already-imported batches are skipped.
              </p>
            </div>
            <button
              onClick={clearAll}
              disabled={running}
              className="text-xs text-muted-foreground hover:text-foreground underline disabled:opacity-50"
            >
              Clear
            </button>
          </div>

          {/* Stats bar */}
          {(stats.imported + stats.skipped + stats.errors) > 0 && (
            <div className="rounded-lg border bg-muted/20 p-3 grid grid-cols-3 divide-x divide-border text-center text-xs">
              <div className="px-4">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">{stats.imported}</div>
                <div className="text-muted-foreground">Imported</div>
              </div>
              <div className="px-4">
                <div className="text-xl font-bold text-blue-500 dark:text-blue-400">{stats.skipped}</div>
                <div className="text-muted-foreground">Skipped</div>
              </div>
              <div className="px-4">
                <div className="text-xl font-bold text-red-500 dark:text-red-400">{stats.errors}</div>
                <div className="text-muted-foreground">Errors</div>
              </div>
            </div>
          )}

          {/* Progress bar */}
          {running && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-2">
            {!running && !aborted && (
              <button
                onClick={runImport}
                disabled={pendingCount === 0}
                className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pendingCount === 0 ? "All batches done ✓" : `Import ${pendingCount} pending batches`}
              </button>
            )}
            {running && (
              <button
                onClick={abortImport}
                className="flex-1 rounded-lg border border-destructive text-destructive text-sm font-semibold py-2 hover:bg-destructive/5 transition-colors"
              >
                Abort Import
              </button>
            )}
            {aborted && (
              <button
                onClick={runImport}
                className="flex-1 rounded-lg bg-primary text-primary-foreground text-sm font-semibold py-2 hover:bg-primary/90 transition-colors"
              >
                Resume Import
              </button>
            )}
            <button
              onClick={clearAll}
              disabled={running}
              className="px-4 rounded-lg border border-border text-sm py-2 hover:bg-muted/50 transition-colors disabled:opacity-50"
            >
              Reset
            </button>
          </div>

          {aborted && (
            <p className="text-xs text-yellow-600 dark:text-yellow-400">
              ⚠️ Import was aborted. Completed batches are already saved. Click "Resume Import" to continue.
            </p>
          )}

          {/* Batch list */}
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-y-auto max-h-[60vh]">
              <table className="w-full text-xs">
                <thead className="bg-muted/50 sticky top-0">
                  <tr>
                    <th className="text-left p-2 pl-3 font-medium text-muted-foreground">Topic</th>
                    <th className="text-center p-2 font-medium text-muted-foreground w-16">Batch</th>
                    <th className="text-center p-2 font-medium text-muted-foreground w-12">Qs</th>
                    <th className="text-left p-2 font-medium text-muted-foreground w-48">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {batches.map((b, i) => (
                    <tr key={i} className={`hover:bg-muted/20 transition-colors ${b.status === "importing" ? "bg-yellow-50/10" : ""}`}>
                      <td className="p-2 pl-3 font-medium text-foreground truncate max-w-[200px]">
                        {b.topic}
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        #{b.batchIndex}
                      </td>
                      <td className="p-2 text-center text-muted-foreground">
                        {b.data.questions?.length ?? "—"}
                      </td>
                      <td className={`p-2 ${statusColor(b.status)}`}>
                        {statusIcon(b.status)} {b.statusMessage}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
