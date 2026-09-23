import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

function sanitizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .trim()
    .replace(/[^\w-]/g, "")
    .replace(/-+/g, "-");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const subjectSlugRaw = formData.get("subjectSlug") as string | null;
    const topicSlugRaw = formData.get("topicSlug") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No PDF file provided" }, { status: 400 });
    }

    if (!subjectSlugRaw || !topicSlugRaw) {
      return NextResponse.json(
        { success: false, error: "Missing subjectSlug or topicSlug" },
        { status: 400 }
      );
    }

    const subjectSlug = sanitizeSlug(subjectSlugRaw);
    const topicSlug = sanitizeSlug(topicSlugRaw);

    if (file.type.toLowerCase() !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      return NextResponse.json(
        { success: false, error: "Invalid file format. Only PDF files are allowed." },
        { status: 400 }
      );
    }

    // Size limit: 50MB
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "PDF file exceeds maximum 50MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Prepare target directory: public/notes/rajasthan-gk/[subjectSlug]/[topicSlug]/
    const targetDir = path.join(
      process.cwd(),
      "public",
      "notes",
      "rajasthan-gk",
      subjectSlug,
      topicSlug
    );
    await fs.mkdir(targetDir, { recursive: true });

    const fileName = "notes.pdf";
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, buffer);

    const publicPdfPath = `/notes/rajasthan-gk/${subjectSlug}/${topicSlug}/${fileName}`;

    return NextResponse.json({
      success: true,
      pdfPath: publicPdfPath,
      sizeBytes: buffer.length,
      fileName,
    });
  } catch (error: any) {
    console.error("PDF upload error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to save PDF." },
      { status: 500 }
    );
  }
}
