export type StatusFilter = "all" | "completed" | "pending";
export type SyllabusScope = "rajasthan_gk" | "english" | "all";

export const STORAGE_KEY = "quizzer_syllabus_completed_v2";

export const RAJASTHAN_GK_SECTIONS = [
  { id: "all", title: "All 55 Topics", count: 55 },
  { id: "geography", title: "सामान्य ज्ञान एवं भूगोल", count: 15, match: "भूगोल" },
  { id: "history", title: "इतिहास", count: 10, match: "इतिहास" },
  { id: "culture", title: "कला एवं संस्कृति", count: 15, match: "संस्कृति" },
  { id: "polity", title: "राजव्यवस्था एवं प्रशासन", count: 15, match: "राजव्यवस्था" },
];

export const ENGLISH_SECTIONS = [
  { id: "all", title: "All 33 Topics", count: 33 },
  { id: "grammar", title: "Grammar & Usage (Sec. Std)", count: 19, minId: 56, maxId: 74 },
  { id: "literature", title: "Literature & Vocab (Grad. Std)", count: 9, minId: 75, maxId: 83 },
  { id: "pedagogy", title: "Teaching Methods (ELT)", count: 5, minId: 84, maxId: 88 },
];
