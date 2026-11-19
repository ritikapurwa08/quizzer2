"use client";

import { useEffect } from "react";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";

interface Option {
  _id: string;
  name: string;
  nameHindi?: string;
}

interface UseSyllabusAutoDetectParams {
  rawParsedObj: any;
  selectedSubjectId: string;
  selectedTopicId: string;
  subtopicName: string;
  subjectsList: Option[];
  topicsList: Option[];
  onSubjectChangeId: (id: string) => void;
  onTopicChangeId: (id: string) => void;
  onSubtopicNameChange: (name: string) => void;
}

export function useSyllabusAutoDetect({
  rawParsedObj,
  selectedSubjectId,
  selectedTopicId,
  subtopicName,
  subjectsList,
  topicsList,
  onSubjectChangeId,
  onTopicChangeId,
  onSubtopicNameChange,
}: UseSyllabusAutoDetectParams) {
  useEffect(() => {
    if (!rawParsedObj) return;
    const obj = rawParsedObj;
    const firstQ = Array.isArray(obj) ? obj[0] : obj.questions?.[0] || obj;
    if (!firstQ && typeof obj !== "object") return;

    const topicHint =
      obj?.masterTopic ||
      obj?.topic ||
      obj?.topicName ||
      firstQ?.topic ||
      firstQ?.meta?.sourceTopic;
    const masterTopicIdHint =
      obj?.masterTopicId ||
      firstQ?.masterTopicId ||
      firstQ?.meta?.masterTopicId;
    const setHint = obj?.testSet || obj?.setName || obj?.subtopic || obj?.name;

    let matchedMt = null;
    if (masterTopicIdHint) {
      const num = Number(masterTopicIdHint);
      matchedMt = MASTER_TOPICS_LIST.find((mt) => mt.id === num);
    }
    if (!matchedMt && typeof topicHint === "string" && topicHint.trim()) {
      const cleanHint = topicHint.trim();
      matchedMt = MASTER_TOPICS_LIST.find(
        (mt) =>
          mt.nameHindi === cleanHint ||
          cleanHint.includes(mt.nameHindi) ||
          mt.nameHindi.includes(cleanHint)
      );
    }

    if (matchedMt) {
      if (!selectedSubjectId && subjectsList.length > 0) {
        const sub = subjectsList.find(
          (s) =>
            s.nameHindi === matchedMt!.subjectHindi ||
            s.name === matchedMt!.subjectName
        );
        if (sub) {
          onSubjectChangeId(sub._id);
        }
      }
      if (selectedSubjectId && !selectedTopicId && topicsList.length > 0) {
        const top = topicsList.find(
          (t) =>
            t.nameHindi === matchedMt!.nameHindi ||
            (t.nameHindi && matchedMt!.nameHindi.includes(t.nameHindi))
        );
        if (top) {
          onTopicChangeId(top._id);
        }
      }
    }

    if (setHint && typeof setHint === "string" && !subtopicName.trim()) {
      onSubtopicNameChange(setHint.trim());
    }
  }, [
    rawParsedObj,
    selectedSubjectId,
    selectedTopicId,
    subtopicName,
    subjectsList,
    topicsList,
    onSubjectChangeId,
    onTopicChangeId,
    onSubtopicNameChange,
  ]);
}
