import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Quizzer — Rajasthan GK Master Revision",
    short_name: "Quizzer",
    description: "Fast, distraction-free Rajasthan GK revision for RPSC 2nd Grade, CET and competitive exams.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#09090b",
    theme_color: "#09090b",
    categories: ["education", "productivity", "utilities"],
    lang: "hi",
    dir: "ltr",
    prefer_related_applications: false,
    icons: [
      {
        src: "/icons/icon-16.png",
        sizes: "16x16",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-32.png",
        sizes: "32x32",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-48.png",
        sizes: "48x48",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-72.png",
        sizes: "72x72",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-128.png",
        sizes: "128x128",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-144.png",
        sizes: "144x144",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-384.png",
        sizes: "384x384",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/badge-96.png",
        sizes: "96x96",
        type: "image/png",
        purpose: "monochrome",
      },
    ],
    shortcuts: [
      {
        name: "आज का रिवीज़न (Dashboard)",
        short_name: "रिवीज़न",
        description: "दैनिक लक्ष्य और अध्ययन प्रगति देखें",
        url: "/dashboard",
        icons: [
          {
            src: "/icons/shortcut-dashboard.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "55 टॉपिक्स सिलेबस (Syllabus)",
        short_name: "पाठ्यक्रम",
        description: "RPSC 2nd Grade राजस्थान GK के सभी 55 टॉपिक्स",
        url: "/syllabus",
        icons: [
          {
            src: "/icons/shortcut-syllabus.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "त्वरित क्विज़ (Quick Quiz)",
        short_name: "क्विज़",
        description: "तुरंत टेस्ट अभ्यास शुरू करें",
        url: "/subjects",
        icons: [
          {
            src: "/icons/shortcut-quiz.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
      {
        name: "सहेजे गए प्रश्न (Bookmarks)",
        short_name: "बुकमार्क",
        description: "कठिन व महत्वपूर्ण प्रश्नों का अभ्यास",
        url: "/bookmarks",
        icons: [
          {
            src: "/icons/shortcut-bookmarks.png",
            sizes: "96x96",
            type: "image/png",
          },
        ],
      },
    ],
    screenshots: [
      {
        src: "/screenshots/screenshot-mobile.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
        label: "राजस्थान GK डैशबोर्ड एवं प्रश्नोत्तरी अभ्यास (Mobile)",
      },
      {
        src: "/screenshots/screenshot-desktop.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
        label: "RPSC 2nd Grade GK 55 मास्टर टॉपिक्स एवं विश्लेषण (Desktop)",
      },
    ],
  };
}
