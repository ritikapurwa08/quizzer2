import fs from "fs";
import path from "path";

const targetDir = path.join(
  process.cwd(),
  "public",
  "notes",
  "rajasthan-gk",
  "rajasthan-general-knowledge-geography",
  "rivers-and-water-resources-of-rajasthan"
);

fs.mkdirSync(targetDir, { recursive: true });

const pdfLines = [
  "%PDF-1.4",
  "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
  "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
  "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj",
  "4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
  "5 0 obj << /Length 130 >>",
  "stream",
  "BT",
  "/F1 18 Tf",
  "50 720 Td",
  "(Quizzer - Rajasthan GK Study Notes) Tj",
  "/F1 12 Tf",
  "0 -30 Td",
  "(Topic: Rivers and Water Resources of Rajasthan) Tj",
  "0 -20 Td",
  "(Canonical Static Asset Study Notes) Tj",
  "ET",
  "endstream",
  "endobj",
  "xref",
  "0 6",
  "0000000000 65535 f ",
  "0000000009 00000 n ",
  "0000000058 00000 n ",
  "0000000115 00000 n ",
  "0000000234 00000 n ",
  "0000000305 00000 n ",
  "trailer << /Size 6 /Root 1 0 R >>",
  "startxref",
  "490",
  "%%EOF",
];

fs.writeFileSync(path.join(targetDir, "notes.pdf"), pdfLines.join("\n"));
console.log("PDF created successfully at:", path.join(targetDir, "notes.pdf"));
