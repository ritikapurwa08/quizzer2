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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subjectSlugRaw = searchParams.get("subjectSlug");
    const topicSlugRaw = searchParams.get("topicSlug");

    if (!subjectSlugRaw || !topicSlugRaw) {
      return NextResponse.json(
        { success: false, error: "Missing subjectSlug or topicSlug" },
        { status: 400 }
      );
    }

    const subjectSlug = sanitizeSlug(subjectSlugRaw);
    const topicSlug = sanitizeSlug(topicSlugRaw);

    const baseDir = path.join(
      process.cwd(),
      "public",
      "notes",
      "rajasthan-gk",
      subjectSlug,
      topicSlug
    );

    const pdfFile = path.join(baseDir, "notes.pdf");
    let hasPdf = false;
    let pdfSize = 0;
    try {
      const stat = await fs.stat(pdfFile);
      hasPdf = stat.isFile();
      pdfSize = stat.size;
    } catch {
      hasPdf = false;
    }

    const imagesDir = path.join(baseDir, "images");
    const images: Array<{
      id: string;
      src: string;
      fileName: string;
      sizeBytes: number;
    }> = [];

    try {
      const files = await fs.readdir(imagesDir);
      for (const f of files) {
        if (/\.(webp|jpg|jpeg|png|avif)$/i.test(f)) {
          const filePath = path.join(imagesDir, f);
          const stat = await fs.stat(filePath);
          images.push({
            id: `img-${f}`,
            src: `/notes/rajasthan-gk/${subjectSlug}/${topicSlug}/images/${f}`,
            fileName: f,
            sizeBytes: stat.size,
          });
        }
      }
    } catch {
      // imagesDir doesn't exist yet, which is fine
    }

    return NextResponse.json({
      success: true,
      hasPdf,
      pdfPath: hasPdf ? `/notes/rajasthan-gk/${subjectSlug}/${topicSlug}/notes.pdf` : null,
      pdfSize,
      images,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to check assets." },
      { status: 500 }
    );
  }
}
