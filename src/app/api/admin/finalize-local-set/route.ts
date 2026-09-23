import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { masterTopicId, setNumber, selectedQuestionIds, questions } = body;

    if (!masterTopicId || isNaN(masterTopicId) || masterTopicId < 1 || masterTopicId > 75) {
      return NextResponse.json(
        { success: false, message: "Invalid masterTopicId (must be 1-75)" },
        { status: 400 }
      );
    }

    if (!setNumber || isNaN(setNumber) || setNumber < 1) {
      return NextResponse.json(
        { success: false, message: "Invalid setNumber" },
        { status: 400 }
      );
    }

    const projectRoot = process.cwd();
    const poolStateFile = path.join(projectRoot, "data", "ddd", "pool-state.json");
    const setsDir = path.join(projectRoot, "data", "ddd", "sets");
    const historyDir = path.join(projectRoot, "data", "ddd", "history");

    if (!fs.existsSync(poolStateFile)) {
      return NextResponse.json(
        { success: false, message: "data/ddd/pool-state.json not found" },
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
    topicState.completedSets = Math.max(topicState.completedSets || 0, setNumber);
    poolState.updatedAt = now;

    // 4. Save updated pool-state.json
    fs.writeFileSync(poolStateFile, JSON.stringify(poolState, null, 2), "utf-8");

    // 5. Save set JSON file in data/ddd/sets/topic-XX/set-YYY.json
    const topicSetsDir = path.join(setsDir, `topic-${padTopic}`);
    fs.mkdirSync(topicSetsDir, { recursive: true });
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
