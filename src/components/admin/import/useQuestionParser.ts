"use client";

import { useMemo } from "react";
import { QuestionInput } from "@/lib/validators/question";
import {
  validateAndIsolateQuestions,
  parsePlainTextQuestions,
} from "@/lib/importParser";

interface UseQuestionParserParams {
  code: string;
  subjectName: string;
  topicName: string;
  subtopicName: string;
}

export function useQuestionParser({
  code,
  subjectName,
  topicName,
  subtopicName,
}: UseQuestionParserParams) {
  return useMemo(() => {
    const trimmed = code.trim();
    if (!trimmed) {
      return {
        questions: [] as QuestionInput[],
        parseError: "",
        isolationErrors: [] as string[],
        requeuedSourceIds: [] as Array<string | number>,
        rawParsedObj: null as any,
      };
    }

    try {
      const isolation = validateAndIsolateQuestions(trimmed);
      if (isolation.validQuestions.length > 0) {
        let rawParsedObj: any = null;
        try {
          rawParsedObj = JSON.parse(trimmed);
        } catch {}
        return {
          questions: isolation.validQuestions,
          parseError: "",
          isolationErrors: isolation.invalidQuestions.map((iq) => iq.reason),
          requeuedSourceIds: isolation.requeuedSourceIds || [],
          rawParsedObj,
        };
      }
    } catch {}

    const plain = parsePlainTextQuestions(
      trimmed,
      subjectName || "Rajasthan General Knowledge",
      topicName || "General Topic",
      subtopicName || "Set 1"
    );

    return {
      questions: plain.data?.questions || ([] as QuestionInput[]),
      parseError: plain.data?.questions.length ? "" : plain.error || "Could not parse questions. Please paste valid JSON.",
      isolationErrors: [] as string[],
      requeuedSourceIds: [] as Array<string | number>,
      rawParsedObj: null as any,
    };
  }, [code, subjectName, topicName, subtopicName]);
}
