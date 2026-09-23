import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

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
    const alt = (formData.get("alt") as string | null) || "Study Diagram";
    const caption = (formData.get("caption") as string | null) || "";
    const title = (formData.get("title") as string | null) || "";
    const customName = formData.get("customName") as string | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No image file provided" }, { status: 400 });
    }

    if (!subjectSlugRaw || !topicSlugRaw) {
      return NextResponse.json(
        { success: false, error: "Missing subjectSlug or topicSlug" },
        { status: 400 }
      );
    }

    const subjectSlug = sanitizeSlug(subjectSlugRaw);
    const topicSlug = sanitizeSlug(topicSlugRaw);

    // Validate mime type
    const validMimes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/avif"];
    if (!validMimes.includes(file.type.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Invalid image format. Supported formats: JPG, PNG, WebP, AVIF." },
        { status: 400 }
      );
    }

    // Size limit: 20MB
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: "Image file exceeds maximum 20MB limit." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Optimize image to high-quality WebP using sharp
    const sharpInstance = sharp(buffer);
    const metadata = await sharpInstance.metadata();
    const webpBuffer = await sharpInstance
      .webp({ quality: 85, effort: 4 })
      .toBuffer();

    // Prepare target directory: public/notes/rajasthan-gk/[subjectSlug]/[topicSlug]/images/
    const targetDir = path.join(
      process.cwd(),
      "public",
      "notes",
      "rajasthan-gk",
      subjectSlug,
      topicSlug,
      "images"
    );
    await fs.mkdir(targetDir, { recursive: true });

    // Determine filename
    let baseName = "image-01";
    if (customName && customName.trim()) {
      baseName = sanitizeSlug(customName);
    } else {
      // Find next sequential image number in directory
      const existingFiles = await fs.readdir(targetDir).catch(() => []);
      const count = existingFiles.filter((f) => f.endsWith(".webp")).length + 1;
      baseName = `image-${String(count).padStart(2, "0")}`;
    }

    const fileName = `${baseName}.webp`;
    const filePath = path.join(targetDir, fileName);

    await fs.writeFile(filePath, webpBuffer);

    const publicSrc = `/notes/rajasthan-gk/${subjectSlug}/${topicSlug}/images/${fileName}`;

    return NextResponse.json({
      success: true,
      image: {
        id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        src: publicSrc,
        alt: alt || baseName,
        caption: caption || undefined,
        title: title || undefined,
        width: metadata.width,
        height: metadata.height,
        fileName,
        sizeBytes: webpBuffer.length,
      },
    });
  } catch (error: any) {
    console.error("Image upload processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Failed to process and save image." },
      { status: 500 }
    );
  }
}
