import path from "path";

const cwd = process.cwd();

export const DATA_PATHS = {
  // Questions
  gkTopicsDir: path.join(cwd, "data", "questions", "rajasthan-gk"),
  englishDir: path.join(cwd, "data", "questions", "english"),
  englishTopicsDir: path.join(cwd, "data", "questions", "english", "topics"),
  englishVocabDir: path.join(cwd, "data", "questions", "english", "vocab"),

  // Sets & State
  setsDir: path.join(cwd, "data", "sets"),
  publishedSets: path.join(cwd, "data", "sets", "published-sets.json"),
  poolState: path.join(cwd, "data", "sets", "pool-state.json"),
  topicIdMapping: path.join(cwd, "data", "sets", "topic-id-mapping.json"),
  idMapping: path.join(cwd, "data", "sets", "id-mapping.json"),

  // Audit & Flags
  auditDir: path.join(cwd, "data", "audit"),
  flaggedQuestions: path.join(cwd, "data", "audit", "flagged-questions.json"),
};
