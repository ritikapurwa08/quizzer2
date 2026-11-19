import { ImportJson } from "@/lib/validators/question";

export interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

export interface ImportOptionsPayload {
  isFinalSet?: boolean;
  masterTopicId?: number;
  subTopicId?: string;
  subTopic?: string;
}

export interface QuestionImportEditorProps {
  initialValue?: string;
  resetKey?: number;
  onParsedChange?: (parsed: ImportJson | null) => void;
  onChange?: (value: string, parsed: ImportJson | null, errors: string[]) => void;
  subjectsList: Option[];
  topicsList: Option[];
  selectedSubjectId: string;
  selectedTopicId: string;
  onSubjectChangeId: (id: string) => void;
  onTopicChangeId: (id: string) => void;
  selectedSubTopicId?: string;
  onSubTopicChange?: (id: string) => void;
  subtopicName: string;
  onSubtopicNameChange: (value: string) => void;
  isImporting?: boolean;
  onImportClick?: (options?: ImportOptionsPayload) => void;
  initialMasterTopicId?: number;
  existingTestSets?: Array<{ _id: string; name: string }>;
}
