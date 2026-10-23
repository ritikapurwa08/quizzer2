import sharp from "sharp";
import fs from "fs";
import path from "path";

const rootDir = process.cwd();
const iconsDir = path.join(rootDir, "public", "icons");
const screenshotsDir = path.join(rootDir, "public", "screenshots");

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

// 1. Master Brand SVG Vector (Standard Any Icon)
const brandSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="primaryGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="12" stdDeviation="16" flood-color="#0284c7" flood-opacity="0.25"/>
    </filter>
  </defs>

  <!-- Background rounded squircle -->
  <rect width="512" height="512" rx="128" fill="url(#bgGrad)"/>
  <rect x="6" y="6" width="500" height="500" rx="122" stroke="rgba(255,255,255,0.08)" stroke-width="3"/>

  <!-- Subtle Heritage Sun / Fort Geometric Rays in background -->
  <g opacity="0.08" stroke="#f8fafc" stroke-width="2">
    <circle cx="256" cy="256" r="190" stroke-dasharray="8 8"/>
    <circle cx="256" cy="256" r="140" stroke-dasharray="4 6"/>
  </g>

  <!-- Main Academic Cap & Stylized 'Q' Glyph -->
  <g filter="url(#shadow)">
    <!-- Main Outer Q Arc -->
    <path d="M148 196a132 132 0 1 0 216 132" stroke="#f8fafc" stroke-width="34" stroke-linecap="round"/>
    <!-- Electric Sky Top Arc -->
    <path d="M176 162a132 132 0 0 1 160 0" stroke="url(#primaryGrad)" stroke-width="34" stroke-linecap="round"/>
    <!-- Right Golden Accent -->
    <path d="M352 188a132 132 0 0 1 24 64" stroke="url(#goldGrad)" stroke-width="34" stroke-linecap="round"/>

    <!-- Q Tail / Arrow Pen nib -->
    <path d="M298 304l88 90-20-70-68-20Z" fill="#f8fafc" stroke="#f8fafc" stroke-width="8" stroke-linejoin="round"/>
    <path d="M348 268l62-62 12 42 42-6-62 62-12-28-42-8Z" fill="url(#primaryGrad)" stroke="#09090b" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="336" cy="326" r="12" fill="#09090b"/>

    <!-- Graduation Cap / Royal Crown Motif atop Q -->
    <path d="M112 126l144-68 144 68-144 62-144-62Z" fill="#f8fafc"/>
    <path d="M256 188v-40" stroke="#09090b" stroke-width="7" stroke-linecap="round"/>
    <circle cx="256" cy="192" r="5" fill="url(#goldGrad)"/>
    <!-- Tassel -->
    <path d="M380 134v50l-8 12" stroke="url(#goldGrad)" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>
`;

// 2. Maskable SVG Vector (Requires 100% full background bleed with 80% safe zone inner content)
const maskableSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512" fill="none">
  <defs>
    <linearGradient id="bgGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a"/>
      <stop offset="50%" stop-color="#09090b"/>
      <stop offset="100%" stop-color="#020617"/>
    </linearGradient>
    <linearGradient id="primaryGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="goldGradM" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fbbf24"/>
      <stop offset="100%" stop-color="#d97706"/>
    </linearGradient>
  </defs>

  <!-- Complete edge-to-edge solid background for Android adaptive icons -->
  <rect width="512" height="512" fill="url(#bgGradM)"/>

  <!-- Centered Scaled Content to stay within 80% (diameter 410px) safe zone -->
  <g transform="translate(56, 56) scale(0.78)">
    <!-- Main Outer Q Arc -->
    <path d="M148 196a132 132 0 1 0 216 132" stroke="#f8fafc" stroke-width="34" stroke-linecap="round"/>
    <!-- Electric Sky Top Arc -->
    <path d="M176 162a132 132 0 0 1 160 0" stroke="url(#primaryGradM)" stroke-width="34" stroke-linecap="round"/>
    <!-- Right Golden Accent -->
    <path d="M352 188a132 132 0 0 1 24 64" stroke="url(#goldGradM)" stroke-width="34" stroke-linecap="round"/>

    <!-- Q Tail / Arrow Pen nib -->
    <path d="M298 304l88 90-20-70-68-20Z" fill="#f8fafc" stroke="#f8fafc" stroke-width="8" stroke-linejoin="round"/>
    <path d="M348 268l62-62 12 42 42-6-62 62-12-28-42-8Z" fill="url(#primaryGradM)" stroke="#09090b" stroke-width="6" stroke-linejoin="round"/>
    <circle cx="336" cy="326" r="12" fill="#09090b"/>

    <!-- Graduation Cap / Royal Crown Motif -->
    <path d="M112 126l144-68 144 68-144 62-144-62Z" fill="#f8fafc"/>
    <path d="M256 188v-40" stroke="#09090b" stroke-width="7" stroke-linecap="round"/>
    <circle cx="256" cy="192" r="5" fill="url(#goldGradM)"/>
    <path d="M380 134v50l-8 12" stroke="url(#goldGradM)" stroke-width="5" stroke-linecap="round"/>
  </g>
</svg>
`;

// 3. Monochrome Notification / Status Bar Badge Icon (white on 100% transparent)
const badgeSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
  <!-- Clean white silhouette for Android status bar / push notification badge -->
  <path d="M28 37a24 24 0 1 0 39 24" stroke="#ffffff" stroke-width="7" stroke-linecap="round"/>
  <path d="M54 56l17 17-4-13-13-4Z" fill="#ffffff"/>
  <path d="M21 24l27-13 27 13-27 12-27-12Z" fill="#ffffff"/>
</svg>
`;

// 4. Shortcut Icons (96x96 with colored badge)
const shortcutSvgs = {
  quiz: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
    <rect width="96" height="96" rx="26" fill="#09090b"/>
    <rect x="2" y="2" width="92" height="92" rx="24" stroke="#fbbf24" stroke-width="2" stroke-opacity="0.3"/>
    <path d="M52 18L26 52h20l-4 26 28-36H50l2-24z" fill="#fbbf24" stroke="#d97706" stroke-width="2" stroke-linejoin="round"/>
  </svg>`,
  syllabus: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
    <rect width="96" height="96" rx="26" fill="#09090b"/>
    <rect x="2" y="2" width="92" height="92" rx="24" stroke="#10b981" stroke-width="2" stroke-opacity="0.3"/>
    <path d="M22 28a6 6 0 0 1 6-6h40a6 6 0 0 1 6 6v44a6 6 0 0 1-6 6H28a6 6 0 0 1-6-6V28z" stroke="#10b981" stroke-width="5"/>
    <path d="M34 38h28M34 50h28M34 62h18" stroke="#f8fafc" stroke-width="4" stroke-linecap="round"/>
    <circle cx="68" cy="62" r="5" fill="#38bdf8"/>
  </svg>`,
  dashboard: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
    <rect width="96" height="96" rx="26" fill="#09090b"/>
    <rect x="2" y="2" width="92" height="92" rx="24" stroke="#0ea5e9" stroke-width="2" stroke-opacity="0.3"/>
    <rect x="22" y="22" width="22" height="22" rx="5" fill="#0ea5e9"/>
    <rect x="52" y="22" width="22" height="32" rx="5" fill="#f8fafc"/>
    <rect x="22" y="52" width="22" height="22" rx="5" fill="#f8fafc"/>
    <rect x="52" y="62" width="22" height="12" rx="4" fill="#fbbf24"/>
  </svg>`,
  bookmarks: `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" width="96" height="96" fill="none">
    <rect width="96" height="96" rx="26" fill="#09090b"/>
    <rect x="2" y="2" width="92" height="92" rx="24" stroke="#ec4899" stroke-width="2" stroke-opacity="0.3"/>
    <path d="M30 22h36a4 4 0 0 1 4 4v50l-22-14-22 14V26a4 4 0 0 1 4-4z" fill="#ec4899" stroke="#be185d" stroke-width="2"/>
    <path d="M48 34l3 7 7 1-5 5 1 7-6-4-6 4 1-7-5-5 7-1 3-7z" fill="#ffffff"/>
  </svg>`,
};

// 5. Rich PWA Install Dialog Screenshots (Mobile 1080x1920 & Desktop 1920x1080)
const mobileScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920" fill="none">
  <rect width="1080" height="1920" fill="#09090b"/>
  <!-- Status bar -->
  <rect x="0" y="0" width="1080" height="72" fill="#09090b"/>
  <text x="70" y="52" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="28" font-weight="600">09:41</text>
  <text x="960" y="52" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="26">5G 100%</text>

  <!-- App Header -->
  <rect x="50" y="110" width="980" height="140" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <rect x="80" y="140" width="80" height="80" rx="20" fill="#0284c7"/>
  <text x="180" y="175" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="34" font-weight="700">Quizzer — राजस्थान GK</text>
  <text x="180" y="205" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="24">RPSC 2nd Grade • 55 Topics Master Revision</text>

  <!-- Daily Goal Card -->
  <rect x="50" y="280" width="980" height="320" rx="30" fill="#18181b" stroke="#38bdf8" stroke-width="3" stroke-opacity="0.4"/>
  <text x="90" y="340" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="28" font-weight="700">🔥 आज का लक्ष्य • Daily Streak: 12 Days</text>
  <text x="90" y="400" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="44" font-weight="800">145 / 200 प्रश्न हल किए</text>
  <!-- Progress bar -->
  <rect x="90" y="440" width="900" height="24" rx="12" fill="#27272a"/>
  <rect x="90" y="440" width="650" height="24" rx="12" fill="#0ea5e9"/>
  <text x="90" y="530" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="26">सटीकता दर (Accuracy): 86.4% • 55/55 टॉपिक्स ट्रैक हो रहे हैं</text>

  <!-- 4 Canonical Subjects Grid -->
  <text x="50" y="650" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="38" font-weight="800">4 मुख्य विषय (55 टॉपिक्स)</text>

  <!-- Subject 1: भूगोल -->
  <rect x="50" y="680" width="470" height="260" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <circle cx="110" cy="740" r="32" fill="#0284c7" fill-opacity="0.2"/>
  <text x="100" y="750" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="32">🌍</text>
  <text x="90" y="820" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="32" font-weight="700">राजस्थान भूगोल</text>
  <text x="90" y="865" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="24">15 Topics • 1,240 Qs</text>
  <rect x="90" y="895" width="390" height="12" rx="6" fill="#27272a"/>
  <rect x="90" y="895" width="320" height="12" rx="6" fill="#38bdf8"/>

  <!-- Subject 2: इतिहास -->
  <rect x="560" y="680" width="470" height="260" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <circle cx="620" cy="740" r="32" fill="#d97706" fill-opacity="0.2"/>
  <text x="610" y="750" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="32">⚔️</text>
  <text x="600" y="820" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="32" font-weight="700">राजस्थान इतिहास</text>
  <text x="600" y="865" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="24">10 Topics • 890 Qs</text>
  <rect x="600" y="895" width="390" height="12" rx="6" fill="#27272a"/>
  <rect x="600" y="895" width="280" height="12" rx="6" fill="#fbbf24"/>

  <!-- Subject 3: कला एवं संस्कृति -->
  <rect x="50" y="970" width="470" height="260" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <circle cx="110" cy="1030" r="32" fill="#ec4899" fill-opacity="0.2"/>
  <text x="100" y="1040" fill="#ec4899" font-family="system-ui, sans-serif" font-size="32">🎨</text>
  <text x="90" y="1110" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="32" font-weight="700">कला एवं संस्कृति</text>
  <text x="90" y="1155" fill="#ec4899" font-family="system-ui, sans-serif" font-size="24">15 Topics • 1,420 Qs</text>
  <rect x="90" y="1185" width="390" height="12" rx="6" fill="#27272a"/>
  <rect x="90" y="1185" width="250" height="12" rx="6" fill="#ec4899"/>

  <!-- Subject 4: राजव्यवस्था -->
  <rect x="560" y="970" width="470" height="260" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <circle cx="620" cy="1030" r="32" fill="#10b981" fill-opacity="0.2"/>
  <text x="610" y="1040" fill="#10b981" font-family="system-ui, sans-serif" font-size="32">⚖️</text>
  <text x="600" y="1110" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="32" font-weight="700">राजव्यवस्था</text>
  <text x="600" y="1155" fill="#10b981" font-family="system-ui, sans-serif" font-size="24">15 Topics • 980 Qs</text>
  <rect x="600" y="1185" width="390" height="12" rx="6" fill="#27272a"/>
  <rect x="600" y="1185" width="310" height="12" rx="6" fill="#10b981"/>

  <!-- Live Exam Simulation Preview Card -->
  <rect x="50" y="1270" width="980" height="420" rx="30" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="90" y="1330" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="26" font-weight="700">RPSC पैटर्न प्रश्न बैंक • विस्तृत व्याख्या सहित</text>
  <text x="90" y="1380" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="30" font-weight="600">प्र. राजस्थान में 1857 की क्रांति का प्रथम विद्रोह कहाँ हुआ था?</text>
  <rect x="90" y="1420" width="900" height="60" rx="14" fill="#27272a"/>
  <text x="120" y="1460" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="26">A. एरिनपुरा छावनी</text>
  <rect x="90" y="1495" width="900" height="60" rx="14" fill="#065f46" stroke="#10b981" stroke-width="2"/>
  <text x="120" y="1535" fill="#6ee7b7" font-family="system-ui, sans-serif" font-size="26" font-weight="700">B. नसीराबाद छावनी (28 मई 1857) ✓</text>
  <rect x="90" y="1570" width="900" height="60" rx="14" fill="#27272a"/>
  <text x="120" y="1610" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="26">C. नीमच छावनी</text>

  <!-- Bottom Navigation -->
  <rect x="0" y="1780" width="1080" height="140" fill="#09090b" stroke="#27272a" stroke-width="2"/>
  <text x="130" y="1855" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="28" font-weight="700">होम</text>
  <text x="370" y="1855" fill="#71717a" font-family="system-ui, sans-serif" font-size="28">क्विज़</text>
  <text x="610" y="1855" fill="#71717a" font-family="system-ui, sans-serif" font-size="28">सिलेबस</text>
  <text x="850" y="1855" fill="#71717a" font-family="system-ui, sans-serif" font-size="28">नोट्स</text>
</svg>
`;

const desktopScreenshotSvg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" fill="none">
  <rect width="1920" height="1080" fill="#09090b"/>
  <!-- Top App Navigation Bar -->
  <rect x="0" y="0" width="1920" height="80" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <rect x="60" y="18" width="44" height="44" rx="12" fill="#0284c7"/>
  <text x="120" y="48" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="26" font-weight="800">Quizzer</text>
  <text x="230" y="48" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="20">राजस्थान सामान्य ज्ञान — RPSC 2nd Grade Master Revision</text>

  <rect x="1380" y="20" width="220" height="40" rx="10" fill="#27272a"/>
  <text x="1420" y="46" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="600">⚡ 55 Topics Active</text>
  <circle cx="1680" cy="40" r="18" fill="#0284c7"/>
  <text x="1674" y="46" fill="#ffffff" font-family="system-ui, sans-serif" font-size="16" font-weight="700">R</text>

  <!-- Left Sidebar / Stats -->
  <rect x="60" y="120" width="420" height="900" rx="24" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="100" y="170" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="24" font-weight="700">रिवीज़न डैशबोर्ड</text>
  <rect x="100" y="200" width="340" height="110" rx="16" fill="#27272a"/>
  <text x="120" y="240" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">कुल हल किए प्रश्न</text>
  <text x="120" y="285" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="34" font-weight="800">4,520</text>

  <rect x="100" y="330" width="340" height="110" rx="16" fill="#27272a"/>
  <text x="120" y="370" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">सटीकता दर (Overall Accuracy)</text>
  <text x="120" y="415" fill="#10b981" font-family="system-ui, sans-serif" font-size="34" font-weight="800">88.2%</text>

  <rect x="100" y="460" width="340" height="110" rx="16" fill="#27272a"/>
  <text x="120" y="500" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">कमजोर विषय (Weak Areas)</text>
  <text x="120" y="545" fill="#f43f5e" font-family="system-ui, sans-serif" font-size="24" font-weight="700">प्रजामंडल व प्रजामंडल संस्थाएँ</text>

  <rect x="100" y="600" width="340" height="80" rx="16" fill="#0284c7"/>
  <text x="160" y="648" fill="#ffffff" font-family="system-ui, sans-serif" font-size="20" font-weight="700">⚡ क्विक टेस्ट शुरू करें</text>

  <!-- Main Content Grid: 4 Canonical Subjects -->
  <text x="520" y="160" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="28" font-weight="800">राजस्थान सामान्य ज्ञान — 4 मुख्य विषय</text>

  <!-- Subject A: भूगोल -->
  <rect x="520" y="200" width="650" height="380" rx="20" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="560" y="250" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="22" font-weight="700">A. राजस्थान सामान्य ज्ञान एवं भूगोल (15 Topics)</text>
  <text x="560" y="285" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">भौतिक स्वरूप, जलवायु, नदियाँ, वन्यजीव, उद्योग, ऊर्जा, पर्यटन</text>
  <rect x="560" y="320" width="570" height="200" rx="14" fill="#09090b"/>
  <text x="580" y="360" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ राजस्थान का भौतिक स्वरूप एवं भूगोल (92% पूर्ण)</text>
  <text x="580" y="405" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ अपवाह तंत्र, नदियाँ एवं झीलें (88% पूर्ण)</text>
  <text x="580" y="450" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ वन, वन्यजीव, अभयारण्य एवं राष्ट्रीय उद्यान (95% पूर्ण)</text>
  <text x="580" y="495" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16">→ कुल 15 टॉपिक्स देखें</text>

  <!-- Subject B: इतिहास -->
  <rect x="1210" y="200" width="650" height="380" rx="20" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="1250" y="250" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="22" font-weight="700">B. राजस्थान का इतिहास (10 Topics)</text>
  <text x="1250" y="285" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">प्राचीन सभ्यताएँ, राजपूत राजवंश, 1857 विद्रोह, प्रजामंडल, एकीकरण</text>
  <rect x="1250" y="320" width="570" height="200" rx="14" fill="#09090b"/>
  <text x="1270" y="360" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ प्राचीन सभ्यताएँ एवं पुरातात्विक स्थल (96% पूर्ण)</text>
  <text x="1270" y="405" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ 1857 का विद्रोह एवं ब्रिटिश संधियाँ (84% पूर्ण)</text>
  <text x="1270" y="450" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ राजस्थान का एकीकरण (100% पूर्ण)</text>
  <text x="1270" y="495" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="16">→ कुल 10 टॉपिक्स देखें</text>

  <!-- Subject C: कला एवं संस्कृति -->
  <rect x="520" y="610" width="650" height="380" rx="20" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="560" y="660" fill="#ec4899" font-family="system-ui, sans-serif" font-size="22" font-weight="700">C. राजस्थान कला एवं संस्कृति (15 Topics)</text>
  <text x="560" y="695" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">मेले, त्योहार, दुर्ग-मंदिर, चित्रकला, हस्तशिल्प, लोक देवता, नृत्य, साहित्य</text>
  <rect x="560" y="730" width="570" height="220" rx="14" fill="#09090b"/>
  <text x="580" y="775" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ स्थापत्य कला एवं वास्तुकला (दुर्ग व महल)</text>
  <text x="580" y="820" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ लोक देवता एवं लोक देवियाँ (पाबूजी, तेजाजी, रामदेवजी)</text>
  <text x="580" y="865" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ चित्रकला शैलियाँ (मेवाड़, मारवाड़, बणी-ठणी)</text>
  <text x="580" y="910" fill="#ec4899" font-family="system-ui, sans-serif" font-size="16">→ कुल 15 टॉपिक्स देखें</text>

  <!-- Subject D: राजव्यवस्था -->
  <rect x="1210" y="610" width="650" height="380" rx="20" fill="#18181b" stroke="#27272a" stroke-width="2"/>
  <text x="1250" y="660" fill="#10b981" font-family="system-ui, sans-serif" font-size="22" font-weight="700">D. राजस्थान राजव्यवस्था एवं प्रशासन (15 Topics)</text>
  <text x="1250" y="695" fill="#a1a1aa" font-family="system-ui, sans-serif" font-size="16">राज्यपाल, मुख्यमंत्री, विधानसभा, उच्च न्यायालय, पंचायती राज, RPSC</text>
  <rect x="1250" y="730" width="570" height="220" rx="14" fill="#09090b"/>
  <text x="1270" y="775" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ राजस्थान के राज्यपाल एवं शक्तियाँ</text>
  <text x="1270" y="820" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ राजस्थान लोक सेवा आयोग (RPSC)</text>
  <text x="1270" y="865" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18">✓ पंचायती राज व्यवस्था (73वां संविधान संशोधन)</text>
  <text x="1270" y="910" fill="#10b981" font-family="system-ui, sans-serif" font-size="16">→ कुल 15 टॉपिक्स देखें</text>
</svg>
`;

async function generateAll() {
  console.log("Generating PWA Icon and Screenshot Assets...");

  // Sizes for Standard App Icons
  const standardSizes = [16, 32, 48, 72, 96, 128, 144, 192, 384, 512];
  for (const size of standardSizes) {
    const outPath = path.join(iconsDir, `icon-${size}.png`);
    await sharp(Buffer.from(brandSvg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ Generated: ${outPath} (${size}x${size})`);
  }

  // Apple touch icon (180x180) & alias
  const appleTouchPath = path.join(rootDir, "public", "apple-touch-icon.png");
  await sharp(Buffer.from(brandSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(appleTouchPath);
  console.log(`✓ Generated: ${appleTouchPath} (180x180)`);

  const appleTouchIcon180Path = path.join(iconsDir, "apple-touch-icon-180.png");
  await sharp(Buffer.from(brandSvg))
    .resize(180, 180)
    .png({ compressionLevel: 9 })
    .toFile(appleTouchIcon180Path);
  console.log(`✓ Generated: ${appleTouchIcon180Path} (180x180)`);

  // Maskable Icons (192 and 512)
  for (const size of [192, 512]) {
    const outPath = path.join(iconsDir, `icon-maskable-${size}.png`);
    await sharp(Buffer.from(maskableSvg))
      .resize(size, size)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ Generated Maskable: ${outPath} (${size}x${size})`);
  }

  // Monochrome notification badge
  const badgePath = path.join(iconsDir, "badge-96.png");
  await sharp(Buffer.from(badgeSvg))
    .resize(96, 96)
    .png({ compressionLevel: 9 })
    .toFile(badgePath);
  console.log(`✓ Generated Monochrome Badge: ${badgePath} (96x96)`);

  // Shortcut Icons
  for (const [key, svg] of Object.entries(shortcutSvgs)) {
    const outPath = path.join(iconsDir, `shortcut-${key}.png`);
    await sharp(Buffer.from(svg))
      .resize(96, 96)
      .png({ compressionLevel: 9 })
      .toFile(outPath);
    console.log(`✓ Generated Shortcut Icon: ${outPath} (shortcut-${key}.png)`);
  }

  // PWA Store / Install Dialog Screenshots
  const mobileScreenshotPath = path.join(screenshotsDir, "screenshot-mobile.png");
  await sharp(Buffer.from(mobileScreenshotSvg))
    .resize(1080, 1920)
    .png({ quality: 90 })
    .toFile(mobileScreenshotPath);
  console.log(`✓ Generated Mobile Screenshot: ${mobileScreenshotPath} (1080x1920)`);

  const desktopScreenshotPath = path.join(screenshotsDir, "screenshot-desktop.png");
  await sharp(Buffer.from(desktopScreenshotSvg))
    .resize(1920, 1080)
    .png({ quality: 90 })
    .toFile(desktopScreenshotPath);
  console.log(`✓ Generated Desktop Screenshot: ${desktopScreenshotPath} (1920x1080)`);

  console.log("All PWA Assets generated successfully!");
}

generateAll().catch((err) => {
  console.error("Asset generation error:", err);
  process.exit(1);
});
