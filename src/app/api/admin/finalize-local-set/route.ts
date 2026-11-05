import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { DATA_PATHS } from "@/lib/dataPaths";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { masterTopicId, setNumber, selectedQuestionIds, questions } = body;

    if (!masterTopicId || isNaN(masterTopicId) || masterTopicId < 1 || masterTopicId > MASTER_TOPICS_LIST.length) {
      return NextResponse.json(
        { success: false, message: `Invalid masterTopicId (must be 1-${MASTER_TOPICS_LIST.length})` },
        { status: 400 }
      );
    }

    if (!setNumber || isNaN(setNumber) || setNumber < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid setNumber" },
        { status: 400 }
      );
    }

    const isEnglish = masterTopicId >= 56 && masterTopicId <= 88;
    const poolStateFile = isEnglish
      ? path.join(DATA_PATHS.englishDir, "pool-state.json")
      : DATA_PATHS.poolState;
    const setsDir = DATA_PATHS.setsDir;
    const historyDir = path.join(DATA_PATHS.setsDir, "history");

    if (!fs.existsSync(poolStateFile)) {
      return NextResponse.json(
        { success: false, message: `pool-state.json not found at ${poolStateFile}` },
        { status: 500 }
      );
    }

    const poolState = JSON.parse(fs.readFileSync(poolStateFile, "utf-8"));
    const topicState = poolState.topics?.[String(masterTopicId)];

    if (!topicState) {
      return NextResponse.json(
        { success: false, message: `Topic ${masterTopicId} not found in pool-state.json` },
        { status: 404 }
      );
    }

    const padTopic = String(masterTopicId).padStart(2, "0");
    const padSet = String(setNumber).padStart(3, "0");
    const setId = `topic-${masterTopicId}-set-${padSet}`;

    // Extract valid selected IDs
    const selectedIds: string[] = [];
    if (Array.isArray(selectedQuestionIds) && selectedQuestionIds.length > 0) {
      for (const id of selectedQuestionIds) {
        if (id) selectedIds.push(String(id).trim());
      }
    } else if (Array.isArray(questions)) {
      for (const q of questions) {
        const sid = q.meta?.sourceQuestionId || q.sourceQuestionId || q.id;
        if (sid) selectedIds.push(String(sid).trim());
      }
    }

    // 1. Prune selected from available and candidate
    const selectedIdSet = new Set(selectedIds);
    topicState.available = (topicState.available || []).filter((id: string) => !selectedIdSet.has(id));
    topicState.candidate = (topicState.candidate || []).filter((id: string) => !selectedIdSet.has(id));

    // 2. Mark selected as USED
    const usedMap = new Map<string, any>();
    for (const u of topicState.used || []) {
      const uid = typeof u === "object" && u !== null ? u.id : String(u);
      if (uid) usedMap.set(uid, u);
    }

    const now = new Date().toISOString();
    for (const qid of selectedIds) {
      usedMap.set(qid, {
        id: qid,
        usedInSet: setId,
        usedAt: now,
      });
    }
    topicState.used = Array.from(usedMap.values());

    // 3. Update completedSets
    const startSet = body.startSetNumber || setNumber;
    const setCount = body.setCount || 1;
    const finalSetNumber = Math.max(setNumber, startSet + setCount - 1);
    topicState.completedSets = Math.max(topicState.completedSets || 0, finalSetNumber);
    poolState.updatedAt = now;

    // 4. Save updated pool-state.json
    fs.writeFileSync(poolStateFile, JSON.stringify(poolState, null, 2), "utf-8");

    // 5. Save set JSON file in data/ddd/sets/topic-XX/set-YYY.json
    const topicSetsDir = path.join(setsDir, `topic-${padTopic}`);
    fs.mkdirSync(topicSetsDir, { recursive: true });

    if (setCount > 1 && Array.isArray(questions) && questions.length > 20) {
      for (let sIdx = 0; sIdx < setCount; sIdx++) {
        const curSetNum = startSet + sIdx;
        const curPadSet = String(curSetNum).padStart(3, "0");
        const curSetId = `topic-${masterTopicId}-set-${curPadSet}`;
        const chunkQs = questions.slice(sIdx * 20, (sIdx + 1) * 20);
        const chunkIds = chunkQs
          .map((q: any) => q.meta?.sourceQuestionId || q.sourceQuestionId || q.id)
          .filter(Boolean);
        const chunkFilePath = path.join(topicSetsDir, `set-${curPadSet}.json`);
        fs.writeFileSync(
          chunkFilePath,
          JSON.stringify(
            {
              setId: curSetId,
              masterTopicId,
              masterTopic: topicState.masterTopic,
              setNumber: curSetNum,
              completedAt: now,
              questionCount: chunkQs.length,
              questionIds: chunkIds,
              questions: chunkQs,
            },
            null,
            2
          ),
          "utf-8"
        );
      }
    } else {
      const setFilePath = path.join(topicSetsDir, `set-${padSet}.json`);
      const setPayload = {
        setId,
        masterTopicId,
        masterTopic: topicState.masterTopic,
        setNumber,
        completedAt: now,
        questionCount: selectedIds.length,
        questionIds: selectedIds,
        questions: questions || [],
      };
      fs.writeFileSync(setFilePath, JSON.stringify(setPayload, null, 2), "utf-8");
    }

    // 5.5 Sync with published-sets.json for local-first retrieval
    try {
      const pubPath = DATA_PATHS.publishedSets;
      if (fs.existsSync(pubPath)) {
        const publishedSets = JSON.parse(fs.readFileSync(pubPath, "utf-8"));
        const existingIdx = publishedSets.findIndex((s: any) => s.id === setId || s.setId === setId);
        let convexTopicId = String(masterTopicId);
        try {
          const tmapPath = DATA_PATHS.topicIdMapping;
          if (fs.existsSync(tmapPath)) {
            const tmap = JSON.parse(fs.readFileSync(tmapPath, "utf-8"));
            if (tmap[String(masterTopicId)]) {
              convexTopicId = tmap[String(masterTopicId)];
            }
          }
        } catch {}

        const setEntry = {
          id: setId,
          setId,
          name: `${topicState.masterTopic} भाग ${setNumber}`,
          topicId: convexTopicId,
          negativeMarking: true,
          order: Number(setNumber),
          questionCount: Array.isArray(questions) ? questions.length : selectedIds.length,
          questions: (questions || []).map((q: any, i: number) => ({
            order: i,
            canonicalId: q.meta?.sourceQuestionId || q.sourceQuestionId || q.id,
            questionText: q.questionText,
            options: q.options || [],
            correctAnswer: q.correctAnswer,
            explanation: q.explanation || null,
            type: q.type || "mcq",
            meta: q.meta || {},
            reference: q.reference || null,
          })),
        };
        if (existingIdx >= 0) {
          publishedSets[existingIdx] = setEntry;
        } else {
          publishedSets.push(setEntry);
        }
        fs.writeFileSync(pubPath, JSON.stringify(publishedSets, null, 2), "utf-8");
      }
    } catch (pubErr) {
      console.warn("Could not sync to published-sets.json:", pubErr);
    }

    // 6. Save audit history
    const topicHistoryDir = path.join(historyDir, `topic-${padTopic}`);
    fs.mkdirSync(topicHistoryDir, { recursive: true });
    const historyFilePath = path.join(topicHistoryDir, `topic-${padTopic}-set-${padSet}-history.json`);

    const historyPayload = {
      setId,
      masterTopicId,
      setNumber,
      finalizedAt: now,
      selectedCount: selectedIds.length,
      selectedIds,
      remainingAvailable: topicState.available.length,
      usedCount: topicState.used.length,
    };
    fs.writeFileSync(historyFilePath, JSON.stringify(historyPayload, null, 2), "utf-8");

    return NextResponse.json({
      success: true,
      message: `Topic ${masterTopicId} Set ${setNumber} finalized in local pool. ${selectedIds.length} questions marked USED. Remaining available: ${topicState.available.length}.`,
      setId,
      remainingAvailable: topicState.available.length,
    });
  } catch (error: any) {
    console.error("Error finalizing local set:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to finalize local set" },
      { status: 500 }
    );
  }
}
