import { NoteBlockType, NoteDocument } from "@/types/notes";

const VALID_BLOCK_TYPES: Set<NoteBlockType> = new Set([
  "heading",
  "paragraph",
  "facts",
  "key_points",
  "bullet_list",
  "numbered_list",
  "table",
  "comparison_table",
  "timeline",
  "trick",
  "mnemonic",
  "exam_tip",
  "exam_trap",
  "callout",
  "quote",
  "image",
  "faq",
  "quick_revision",
  "pyq_connection",
  "definition",
]);

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  document?: NoteDocument;
}

export function validateNoteContent(input: unknown): ValidationResult {
  const errors: string[] = [];

  let data: any = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (e: any) {
      return { valid: false, errors: [`Invalid JSON format: ${e.message}`] };
    }
  }

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Document must be a valid JSON object."] };
  }

  if (!data.title || typeof data.title !== "string" || !data.title.trim()) {
    errors.push("Document 'title' is required and must be a non-empty string.");
  }

  if (!Array.isArray(data.blocks)) {
    errors.push("Document 'blocks' is required and must be an array.");
    return { valid: false, errors };
  }

  data.blocks.forEach((block: any, idx: number) => {
    const prefix = `Block #${idx + 1}`;
    if (!block || typeof block !== "object") {
      errors.push(`${prefix}: Must be an object.`);
      return;
    }

    if (!block.type || !VALID_BLOCK_TYPES.has(block.type)) {
      errors.push(
        `${prefix}: Unsupported block type "${block.type}". Allowed: ${Array.from(VALID_BLOCK_TYPES).join(", ")}`
      );
      return;
    }

    switch (block.type) {
      case "heading":
        if (!block.text || typeof block.text !== "string") {
          errors.push(`${prefix} (heading): 'text' is required.`);
        }
        break;

      case "paragraph":
        if (typeof block.content !== "string") {
          errors.push(`${prefix} (paragraph): 'content' is required.`);
        }
        break;

      case "facts":
      case "key_points":
      case "bullet_list":
      case "numbered_list":
        if (!Array.isArray(block.items) || block.items.length === 0) {
          errors.push(`${prefix} (${block.type}): 'items' must be a non-empty array of strings.`);
        }
        break;

      case "table":
        if (!Array.isArray(block.columns) || block.columns.length === 0) {
          errors.push(`${prefix} (table): 'columns' array is required.`);
        }
        if (!Array.isArray(block.rows)) {
          errors.push(`${prefix} (table): 'rows' array is required.`);
        }
        break;

      case "comparison_table":
        if (!Array.isArray(block.headers) || block.headers.length !== 2) {
          errors.push(`${prefix} (comparison_table): 'headers' must be a tuple of 2 column titles.`);
        }
        if (!Array.isArray(block.rows)) {
          errors.push(`${prefix} (comparison_table): 'rows' array is required.`);
        }
        break;

      case "timeline":
        if (!Array.isArray(block.events) || block.events.length === 0) {
          errors.push(`${prefix} (timeline): 'events' array is required.`);
        }
        break;

      case "trick":
      case "mnemonic":
        if (!block.mnemonic || typeof block.mnemonic !== "string") {
          errors.push(`${prefix} (${block.type}): 'mnemonic' is required.`);
        }
        if (!block.explanation || typeof block.explanation !== "string") {
          errors.push(`${prefix} (${block.type}): 'explanation' is required.`);
        }
        break;

      case "exam_tip":
      case "callout":
        if (!block.content || typeof block.content !== "string") {
          errors.push(`${prefix} (${block.type}): 'content' is required.`);
        }
        break;

      case "exam_trap":
        if (!block.confusion || !block.clarification) {
          errors.push(`${prefix} (exam_trap): 'confusion' and 'clarification' are both required.`);
        }
        break;

      case "quote":
        if (!block.quote || typeof block.quote !== "string") {
          errors.push(`${prefix} (quote): 'quote' string is required.`);
        }
        break;

      case "image":
        if (!block.src || typeof block.src !== "string") {
          errors.push(`${prefix} (image): 'src' path is required.`);
        }
        break;

      case "faq":
        if (!Array.isArray(block.items) || block.items.length === 0) {
          errors.push(`${prefix} (faq): 'items' array of {question, answer} is required.`);
        }
        break;

      case "quick_revision":
        if (!Array.isArray(block.summaryPoints) || block.summaryPoints.length === 0) {
          errors.push(`${prefix} (quick_revision): 'summaryPoints' array is required.`);
        }
        break;

      case "pyq_connection":
        if (!block.insight || typeof block.insight !== "string") {
          errors.push(`${prefix} (pyq_connection): 'insight' is required.`);
        }
        break;

      case "definition":
        if (!block.term || !block.definition) {
          errors.push(`${prefix} (definition): 'term' and 'definition' are both required.`);
        }
        break;
    }
  });

  return {
    valid: errors.length === 0,
    errors,
    document: errors.length === 0 ? (data as NoteDocument) : undefined,
  };
}
