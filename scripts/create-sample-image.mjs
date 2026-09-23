import sharp from "sharp";
import path from "path";
import fs from "fs";

const imgDir = path.join(
  process.cwd(),
  "public",
  "notes",
  "rajasthan-gk",
  "rajasthan-general-knowledge-geography",
  "rivers-and-water-resources-of-rajasthan",
  "images"
);

fs.mkdirSync(imgDir, { recursive: true });

const svg = `<svg width="800" height="500" xmlns="http://www.w3.org/2000/svg">
  <rect width="800" height="500" fill="#0f172a" rx="16"/>
  <text x="400" y="210" font-size="30" fill="#38bdf8" font-family="sans-serif" font-weight="bold" text-anchor="middle">
    राजस्थान का अपवाह तंत्र (Drainage System)
  </text>
  <text x="400" y="270" font-size="18" fill="#94a3b8" font-family="sans-serif" text-anchor="middle">
    बंगाल की खाड़ी (22.4%) · अरब सागर (17.1%) · आंतरिक अपवाह (60.2%)
  </text>
  <rect x="250" y="320" width="300" height="40" rx="8" fill="#1e293b" stroke="#38bdf8" stroke-width="1"/>
  <text x="400" y="346" font-size="14" fill="#f8fafc" font-family="sans-serif" font-weight="bold" text-anchor="middle">
    Quizzer Study Diagram &amp; Map Asset
  </text>
</svg>`;

sharp(Buffer.from(svg))
  .webp({ quality: 85 })
  .toFile(path.join(imgDir, "image-01.webp"))
  .then(() => {
    console.log("Sample WebP diagram created at:", path.join(imgDir, "image-01.webp"));
  })
  .catch(console.error);
