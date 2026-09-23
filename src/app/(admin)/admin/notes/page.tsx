"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { SyllabusSelect } from "@/components/shared/SyllabusSelect";
import { NoteBlockRenderer } from "@/components/notes/NoteBlockRenderer";
import { validateNoteContent } from "@/lib/validators/notes";
import { generateGeminiNotesPrompt } from "@/lib/prompts/aiNotesPrompt";
import { NoteDocument } from "@/types/notes";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/Toast";
import {
  FileText,
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Trash2,
  Copy,
  ExternalLink,
  Code2,
  Layers,
  Loader2,
  Download,
} from "lucide-react";
import { getTopicDisplayName } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

const SAMPLE_NOTE_TEMPLATE = (title: string, englishTitle: string) => ({
  version: "1.0",
  title,
  subtitle: englishTitle,
  overview: "इस टॉपिक की महत्वपूर्ण परीक्षा-उन्मुख मुख्य अवधारणाएँ एवं तथ्य।",
  tags: ["राजस्थान GK", "RPSC Exam Notes"],
  blocks: [
    {
      type: "heading",
      level: 2,
      text: "परिचय एवं पृष्ठभूमि",
      subtitle: "Introduction and Overview",
    },
    {
      type: "paragraph",
      content:
        "राजस्थान के सामान्य अध्ययन में यह एक अत्यंत महत्वपूर्ण विषय है जिससे लगातार प्रश्न पूछे जाते हैं।",
    },
    {
      type: "facts",
      title: "प्रमुख परीक्षा-उपयोगी तथ्य (Key Facts)",
      items: [
        "महत्वपूर्ण तथ्य बिंदु 1",
        "महत्वपूर्ण तथ्य बिंदु 2",
        "महत्वपूर्ण तथ्य बिंदु 3",
        "महत्वपूर्ण तथ्य बिंदु 4",
      ],
    },
    {
      type: "table",
      title: "प्रमुख वर्गीकरण सारणी",
      columns: ["क्रम", "प्रमुख बिंदु", "विशेष विवरण"],
      rows: [
        ["1", "क्षेत्र / बिंदु A", "विशेष तथ्य विवरण A"],
        ["2", "क्षेत्र / बिंदु B", "विशेष तथ्य विवरण B"],
      ],
    },
    {
      type: "trick",
      title: "याद रखने की ट्रिक (Memory Trick)",
      mnemonic: "शॉर्टकट सूत्र / याद रखने की ट्रिक",
      explanation: "ट्रिक के प्रत्येक अक्षर का अर्थ और विवरण।",
      examContext: "प्रतियोगी परीक्षाओं में बार-बार पूछे जाने वाले क्रम के लिए",
    },
    {
      type: "exam_trap",
      title: "सावधानी / सामान्य भ्रम (Exam Trap)",
      confusion: "परीक्षार्थी अक्सर इन दो नामों अथवा वर्षों में भ्रमित हो जाते हैं।",
      clarification: "वास्तविक तथ्य और दोनों का सही संदर्भ।",
    },
    {
      type: "quick_revision",
      title: "त्वरित पुनरावलोकन (Quick Revision)",
      summaryPoints: [
        "रिवीजन मुख्य बिंदु 1",
        "रिवीजन मुख्य बिंदु 2",
        "रिवीजन मुख्य बिंदु 3",
      ],
    },
  ],
});

export default function AdminNotesManagementPage() {
  const { showToast } = useToast();

  const subjects = useQuery(api.subjects.list) ?? [];
  const [subjectId, setSubjectId] = useState<Id<"subjects"> | "">("");

  const topics = useQuery(
    api.topics.listBySubject,
    subjectId ? { subjectId } : "skip"
  ) ?? [];
  const [topicId, setTopicId] = useState<Id<"topics"> | "">("");

  const selectedSubject = subjects.find((s) => s._id === subjectId);
  const selectedTopic = topics.find((t) => t._id === topicId);

  // Fetch Convex topicNote
  const topicNote = useQuery(
    api.notes.getTopicNote,
    topicId ? { topicId } : "skip"
  );

  const saveTopicNote = useMutation(api.notes.saveTopicNote);

  // Form states
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [hasPdf, setHasPdf] = useState(false);
  const [pdfPath, setPdfPath] = useState("");
  const [images, setImages] = useState<
    Array<{
      id: string;
      src: string;
      alt: string;
      caption?: string;
      title?: string;
      width?: number;
      height?: number;
    }>
  >([]);
  const [contentJson, setContentJson] = useState("");
  const [isPublished, setIsPublished] = useState(false);

  // UI state
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  const [previewMode, setPreviewMode] = useState<"edit" | "preview">("edit");
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [parsedPreviewDoc, setParsedPreviewDoc] = useState<NoteDocument | null>(null);
  const [showPromptModal, setShowPromptModal] = useState(false);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Populate form when topicNote loads
  useEffect(() => {
    if (selectedTopic) {
      if (topicNote) {
        setTitle(topicNote.title || getTopicDisplayName(selectedTopic));
        setSummary(topicNote.summary || "");
        setHasPdf(topicNote.hasPdf || false);
        setPdfPath(topicNote.pdfPath || "");
        setImages(topicNote.images || []);
        setContentJson(topicNote.content || "");
        setIsPublished(topicNote.isPublished || false);
      } else {
        // Initial defaults for a topic without notes record
        setTitle(getTopicDisplayName(selectedTopic));
        setSummary("");
        setHasPdf(false);
        setPdfPath("");
        setImages([]);
        setContentJson("");
        setIsPublished(false);
      }
    }
  }, [topicNote, selectedTopic]);

  // Check local filesystem assets
  useEffect(() => {
    if (selectedSubject && selectedTopic) {
      fetch(
        `/api/admin/notes/check-assets?subjectSlug=${selectedSubject.slug}&topicSlug=${selectedTopic.slug}`
      )
        .then((r) => r.json())
        .then((res) => {
          if (res.success) {
            if (res.hasPdf && !hasPdf) {
              setHasPdf(true);
              setPdfPath(res.pdfPath);
            }
          }
        })
        .catch(console.error);
    }
  }, [selectedSubject, selectedTopic]);

  // Real-time JSON validation
  useEffect(() => {
    if (!contentJson.trim()) {
      setValidationErrors([]);
      setParsedPreviewDoc(null);
      return;
    }
    const result = validateNoteContent(contentJson);
    if (result.valid && result.document) {
      setValidationErrors([]);
      setParsedPreviewDoc(result.document);
    } else {
      setValidationErrors(result.errors);
      setParsedPreviewDoc(null);
    }
  }, [contentJson]);

  // Handle PDF upload
  async function handlePdfUpload(file: File) {
    if (!selectedSubject || !selectedTopic) return;
    setIsUploadingPdf(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectSlug", selectedSubject.slug);
      formData.append("topicSlug", selectedTopic.slug);

      const res = await fetch("/api/admin/notes/upload-pdf", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setHasPdf(true);
        setPdfPath(data.pdfPath);
        showToast("PDF सफलतापूर्वक अपलोड हो गई!", "success");
      } else {
        showToast(data.error || "PDF अपलोड विफल रही", "warning");
      }
    } catch (e: any) {
      showToast(e.message || "PDF अपलोड में त्रुटि", "warning");
    } finally {
      setIsUploadingPdf(false);
    }
  }

  // Handle Image upload (drag & drop or picker)
  async function handleImageUpload(file: File, customName?: string) {
    if (!selectedSubject || !selectedTopic) return;
    setIsUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("subjectSlug", selectedSubject.slug);
      formData.append("topicSlug", selectedTopic.slug);
      if (customName) formData.append("customName", customName);

      const res = await fetch("/api/admin/notes/upload-image", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setImages((prev) => [...prev, data.image]);
        showToast("चित्र सफलतापूर्वक WebP में प्रोसेस और सेव किया गया!", "success");
      } else {
        showToast(data.error || "चित्र अपलोड विफल रहा", "warning");
      }
    } catch (e: any) {
      showToast(e.message || "चित्र अपलोड में त्रुटि", "warning");
    } finally {
      setIsUploadingImage(false);
    }
  }

  // Handle Save
  async function handleSave() {
    if (!selectedSubject || !selectedTopic) {
      showToast("कृपया विषय एवं टॉपिक चुनें", "warning");
      return;
    }

    if (contentJson.trim() && validationErrors.length > 0) {
      showToast("कृपया JSON सिंटैक्स त्रुटियों को ठीक करें", "warning");
      return;
    }

    setIsSaving(true);
    try {
      await saveTopicNote({
        topicId: selectedTopic._id,
        subjectId: selectedSubject._id,
        title: title.trim() || getTopicDisplayName(selectedTopic),
        summary: summary.trim() || undefined,
        hasPdf,
        pdfPath: hasPdf ? pdfPath || undefined : undefined,
        images,
        content: contentJson.trim() || undefined,
        isPublished,
      });

      showToast("नोट्स सफलतापूर्वक सुरक्षित (Saved) कर लिए गए!", "success");
    } catch (e: any) {
      console.error(e);
      showToast(e.message || "सेव करने में त्रुटि हुई", "warning");
    } finally {
      setIsSaving(false);
    }
  }


  // Insert Sample JSON Template
  function handleInsertSampleTemplate() {
    if (!selectedTopic) return;
    const sample = SAMPLE_NOTE_TEMPLATE(
      getTopicDisplayName(selectedTopic),
      selectedTopic.name
    );
    setContentJson(JSON.stringify(sample, null, 2));
    showToast("सैंपल टेम्पलेट लोड कर दिया गया", "info");
  }

  // Copy Gemini Prompt
  function handleCopyGeminiPrompt() {
    if (!selectedSubject || !selectedTopic) return;
    const prompt = generateGeminiNotesPrompt({
      subjectName: selectedSubject.name,
      topicName: selectedTopic.name,
      topicNameHindi: selectedTopic.nameHindi,
      availableImages: images.map((img) => ({
        src: img.src,
        alt: img.alt,
        caption: img.caption,
      })),
    });
    navigator.clipboard.writeText(prompt);
    showToast("Gemini AI प्रॉम्प्ट कॉपी हो गया! अब इसे Gemini में पेस्ट करें।", "success");
    setShowPromptModal(false);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground font-hindi">
            नोट्स एवं अध्ययन सामग्री प्रबंधन (Notes Management)
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-hindi">
            विषयवार PDF नोट्स अपलोड करें, स्थानीय चित्रों को प्रोसेस करें एवं संरचित JSON सामग्री प्रबंधित करें।
          </p>
        </div>

        {selectedSubject && selectedTopic && (
          <Button asChild variant="outline" size="sm" className="rounded-xl shrink-0 gap-1.5 font-hindi">
            <Link
              href={`/notes/${selectedSubject.slug}/${selectedTopic.slug}`}
              target="_blank"
            >
              <span>विद्यार्थी पृष्ठ देखें</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </Button>
        )}
      </div>

      {/* ── Subject & Topic Selection ── */}
      <Card className="p-4 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground font-hindi">1. विषय चुनें</Label>
            <SyllabusSelect
              options={subjects}
              value={subjectId}
              onValueChange={(v) => {
                setSubjectId(v as Id<"subjects">);
                setTopicId("");
              }}
              placeholder="विषय चुनें…"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground font-hindi">2. टॉपिक चुनें</Label>
            <SyllabusSelect
              options={topics}
              value={topicId}
              onValueChange={(v) => setTopicId(v as Id<"topics">)}
              placeholder={!subjectId ? "पहले विषय चुनें" : "टॉपिक चुनें…"}
              disabled={!subjectId}
            />
          </div>
        </div>

        {selectedTopic && (
          <div className="flex items-center justify-between pt-3 border-t border-border/60 text-xs">
            <div className="flex items-center gap-2 flex-wrap font-hindi">
              <span className="font-semibold text-foreground">स्थिति:</span>
              {hasPdf ? (
                <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold">
                  ✓ PDF मौजूद
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  PDF अनुपलब्ध
                </span>
              )}

              {contentJson.trim() ? (
                <span className="px-2 py-0.5 rounded-md bg-success/15 text-success font-bold">
                  ✓ लिखित नोट्स मौजूद
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-md bg-muted text-muted-foreground">
                  लिखित नोट्स खाली
                </span>
              )}

              <span className="px-2 py-0.5 rounded-md bg-muted text-foreground tabular-nums">
                {images.length} चित्र
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold font-hindi text-muted-foreground">प्रकाशन:</span>
              <Switch
                checked={isPublished}
                onCheckedChange={setIsPublished}
              />
              <span className="text-xs font-bold font-hindi">
                {isPublished ? "प्रकाशित (Live)" : "अप्रकाशित"}
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* If Topic is Selected, Show Full Management Workspace */}
      {selectedTopic && (
        <div className="space-y-6 animate-in fade-in-0 duration-150">
          {/* ── SECTION 1: PDF Study Note ── */}
          <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground font-hindi">
                    आधिकारिक PDF नोट्स (Static Project Asset)
                  </h3>
                  <p className="text-xs text-muted-foreground font-hindi">
                    फ़ाइल पथ: <code className="text-[11px] font-mono font-bold">public/notes/rajasthan-gk/{selectedSubject?.slug}/{selectedTopic.slug}/notes.pdf</code>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  id="pdf-active-toggle"
                  checked={hasPdf}
                  onCheckedChange={setHasPdf}
                />
                <Label htmlFor="pdf-active-toggle" className="text-xs font-semibold font-hindi cursor-pointer">
                  PDF सक्रिय करें
                </Label>
              </div>
            </div>

            {/* Drop / Upload Zone for PDF */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handlePdfUpload(file);
              }}
              className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-2"
              onClick={() => pdfInputRef.current?.click()}
            >
              <input
                ref={pdfInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handlePdfUpload(file);
                }}
              />
              {isUploadingPdf ? (
                <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>PDF अपलोड हो रही है...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground mx-auto" />
                  <p className="text-xs font-bold text-foreground font-hindi">
                    यहाँ PDF फ़ाइल खींचकर लाएँ (Drag & Drop) या चुनने के लिए क्लिक करें
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    अधिकतम आकार: 50MB (केवल .pdf फ़ाइल)
                  </p>
                </>
              )}
            </div>

            {hasPdf && pdfPath && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/20 text-xs">
                <div className="flex items-center gap-2 truncate">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  <span className="font-mono text-muted-foreground truncate">{pdfPath}</span>
                </div>
                <Button asChild size="sm" variant="outline" className="h-7 text-xs rounded-lg shrink-0 ml-2">
                  <a href={pdfPath} target="_blank" rel="noopener noreferrer">
                    <Download className="h-3 w-3 mr-1" />
                    डाउनलोड टेस्ट
                  </a>
                </Button>
              </div>
            )}
          </Card>

          {/* ── SECTION 2: Image Processing Pipeline & Drag & Drop ── */}
          <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground font-hindi">
                    मानचित्र एवं रेखाचित्र (Local WebP Optimization Pipeline)
                  </h3>
                  <p className="text-xs text-muted-foreground font-hindi">
                    JPG/PNG फ़ाइलें अपलोड होते ही Sharp द्वारा स्वचालित रूप से उच्च-गुणवत्ता WebP में संपीड़ित की जाती हैं।
                  </p>
                </div>
              </div>

              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                कुल चित्र: {images.length}
              </span>
            </div>

            {/* Drag & Drop Zone for Images */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleImageUpload(file);
              }}
              className="border-2 border-dashed border-border rounded-xl p-5 text-center bg-muted/20 hover:bg-muted/40 transition-colors cursor-pointer space-y-2"
              onClick={() => imageInputRef.current?.click()}
            >
              <input
                ref={imageInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleImageUpload(file);
                }}
              />
              {isUploadingImage ? (
                <div className="flex items-center justify-center gap-2 text-primary text-xs font-bold py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Sharp द्वारा चित्र को WebP में प्रोसेस किया जा रहा है...</span>
                </div>
              ) : (
                <>
                  <Upload className="h-7 w-7 text-muted-foreground mx-auto" />
                  <p className="text-xs font-bold text-foreground font-hindi">
                    यहाँ चित्र खींचकर लाएँ (Drag & Drop) या फ़ाइल पिकर से चुनें
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    JPG, PNG, WebP · स्वतः WebP में रूपांतरित होकर static repository में सेव होगा
                  </p>
                </>
              )}
            </div>

            {/* Uploaded Images List with Preview and Dimensions */}
            {images.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                {images.map((img, idx) => (
                  <div
                    key={img.id || idx}
                    className="group relative rounded-xl border border-border bg-card p-2.5 space-y-2"
                  >
                    <div className="h-36 rounded-lg bg-muted/40 overflow-hidden flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.src}
                        alt={img.alt}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-mono text-muted-foreground truncate">{img.src.split("/").pop()}</span>
                        {img.width && img.height && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-muted text-muted-foreground">
                            {img.width}×{img.height}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 pt-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground cursor-pointer"
                          onClick={() => {
                            const snippet = JSON.stringify(
                              {
                                type: "image",
                                src: img.src,
                                alt: img.alt || "चित्र",
                                caption: img.caption || "",
                              },
                              null,
                              2
                            );
                            navigator.clipboard.writeText(snippet);
                            showToast("इमेज ब्लॉक JSON कॉपी हो गया!", "success");
                          }}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          JSON स्निपेट
                        </Button>

                        <button
                          type="button"
                          onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 rounded text-destructive hover:bg-destructive/10 ml-auto cursor-pointer"
                          title="हटाएँ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ── SECTION 3: Structured JSON Content Editor ── */}
          <Card className="p-4 sm:p-5 rounded-2xl border border-border bg-card shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                  <Code2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-foreground font-hindi">
                    लिखित अध्ययन सामग्री (Structured JSON Document)
                  </h3>
                  <p className="text-xs text-muted-foreground font-hindi">
                    19 समर्थित शैक्षिक ब्लॉक (तथ्य, सारणी, ट्रिक्स, टाइमलाइन, परीक्षा भ्रम)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPromptModal(true)}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Gemini प्रॉम्प्ट बनाएँ
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleInsertSampleTemplate}
                  className="rounded-xl text-xs font-semibold gap-1.5 cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  सैंपल टेम्पलेट
                </Button>

                <div className="flex items-center rounded-xl bg-muted p-0.5 border border-border">
                  <button
                    type="button"
                    onClick={() => setPreviewMode("edit")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${previewMode === "edit"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                      }`}
                  >
                    JSON कोड
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewMode("preview")}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold cursor-pointer ${previewMode === "preview"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground"
                      }`}
                  >
                    लाइव प्रीव्यू
                  </button>
                </div>
              </div>
            </div>

            {/* Validation Alerts */}
            {validationErrors.length > 0 && (
              <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <span>JSON सत्यापन त्रुटियाँ ({validationErrors.length}):</span>
                </div>
                <ul className="text-xs text-destructive font-mono space-y-0.5 pl-5 list-disc">
                  {validationErrors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editor or Live Preview */}
            {previewMode === "edit" ? (
              <div className="space-y-2">
                <Textarea
                  value={contentJson}
                  onChange={(e) => setContentJson(e.target.value)}
                  placeholder="यहाँ structured JSON पेस्ट करें..."
                  rows={20}
                  className="font-mono text-xs leading-relaxed bg-background/80 rounded-xl"
                />
              </div>
            ) : (
              <div className="p-5 rounded-2xl border border-border bg-card/60 min-h-[400px]">
                {parsedPreviewDoc ? (
                  <div className="space-y-4">
                    <div className="border-b border-border pb-3">
                      <h2 className="text-2xl font-bold font-hindi text-foreground">
                        {parsedPreviewDoc.title}
                      </h2>
                      {parsedPreviewDoc.subtitle && (
                        <p className="text-sm text-muted-foreground font-hindi">
                          {parsedPreviewDoc.subtitle}
                        </p>
                      )}
                    </div>
                    {parsedPreviewDoc.blocks.map((block, idx) => (
                      <NoteBlockRenderer key={idx} block={block} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground font-hindi text-center py-12">
                    प्रीव्यू देखने के लिए वैध JSON सामग्री दर्ज करें।
                  </p>
                )}
              </div>
            )}
          </Card>

          {/* ── Sticky Bottom Save Bar ── */}
          <div className="sticky bottom-4 z-20 flex items-center justify-between p-3.5 sm:p-4 rounded-2xl border border-border bg-card/95 backdrop-blur-md shadow-xl">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted-foreground font-hindi">
                {title || getTopicDisplayName(selectedTopic)}
              </span>
              {isPublished ? (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success">
                  लाइव
                </span>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  ड्राफ्ट
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleSave}
                disabled={isSaving || validationErrors.length > 0}
                className="rounded-xl px-5 font-bold text-xs h-9 bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer shadow-xs"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>सहेज रहे हैं...</span>
                  </span>
                ) : (
                  "परिवर्तन सहेजें (Save Note)"
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Prompt Generator Modal */}
      {showPromptModal && selectedSubject && selectedTopic && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in-0">
          <Card className="w-full max-w-2xl bg-card border border-border rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-bold text-base font-hindi text-foreground">
                  Gemini AI प्रॉम्प्ट जनरेटर ({getTopicDisplayName(selectedTopic)})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPromptModal(false)}
                className="text-xs font-bold text-muted-foreground hover:text-foreground cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-muted-foreground font-hindi">
              इस प्रॉम्प्ट को कॉपी करके Gemini 1.5 Pro / 2.0 Flash में पेस्ट करें। Gemini सीधे आपके लिए Quizzer के मान्य 19-ब्लॉक JSON फॉर्मेट में उच्च-गुणवत्ता परीक्षा नोट्स तैयार करेगा।
            </p>

            <div className="p-3 rounded-xl bg-muted/60 border border-border/60 max-h-60 overflow-y-auto font-mono text-[11px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {generateGeminiNotesPrompt({
                subjectName: selectedSubject.name,
                topicName: selectedTopic.name,
                topicNameHindi: selectedTopic.nameHindi,
                availableImages: images.map((img) => ({
                  src: img.src,
                  alt: img.alt,
                  caption: img.caption,
                })),
              })}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPromptModal(false)}
                className="rounded-xl"
              >
                बंद करें
              </Button>
              <Button
                size="sm"
                onClick={handleCopyGeminiPrompt}
                className="rounded-xl font-bold bg-primary text-primary-foreground gap-1.5"
              >
                <Copy className="h-3.5 w-3.5" />
                प्रॉम्प्ट कॉपी करें
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
