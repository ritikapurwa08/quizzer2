import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { MASTER_TOPICS_LIST } from "@/lib/pool/masterTopics";
import { comparePoolQuestions } from "@/lib/pool/sortQuestions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const topicIdParam = searchParams.get("masterTopicId") || searchParams.get("topicId");
    const setNumberParam = searchParams.get("setNumber") || searchParams.get("set");

    if (!topicIdParam) {
      return NextResponse.json(
        { success: false, message: "Missing masterTopicId parameter" },
        { status: 400 }
      );
    }

    const masterTopicId = parseInt(topicIdParam, 10);
    if (isNaN(masterTopicId) || masterTopicId < 1 || masterTopicId > 75) {
      return NextResponse.json(
        { success: false, message: "Invalid masterTopicId (must be 1-75)" },
        { status: 400 }
      );
    }

    const setNumber = setNumberParam ? Math.max(1, parseInt(setNumberParam, 10) || 1) : 1;
    const topicInfo = MASTER_TOPICS_LIST.find((mt) => mt.id === masterTopicId);

    const padTopic = String(masterTopicId).padStart(2, "0");
    const padSet = String(setNumber).padStart(3, "0");

    const projectRoot = process.cwd();
    // Support both topic-01 and topic-1 folder naming conventions
    const candidatesDirPad = path.join(projectRoot, "data", "ddd", "candidates", `topic-${padTopic}`);
    const candidatesDirRaw = path.join(projectRoot, "data", "ddd", "candidates", `topic-${masterTopicId}`);
    const candidateFilePad = path.join(candidatesDirPad, `candidate-set-${padSet}.json`);
    const candidateFileRaw = path.join(candidatesDirRaw, `candidate-set-${padSet}.json`);

    const poolStateFile = path.join(projectRoot, "data", "ddd", "pool-state.json");
    const topicsDir = path.join(projectRoot, "data", "ddd", "topics");

    let candidateQuestions: any[] = [];

    // 1. If candidate file already exists on disk, load it
    const existingCandidateFile = fs.existsSync(candidateFilePad)
      ? candidateFilePad
      : fs.existsSync(candidateFileRaw)
        ? candidateFileRaw
        : null;

    if (existingCandidateFile) {
      try {
        const fileData = JSON.parse(fs.readFileSync(existingCandidateFile, "utf-8"));
        candidateQuestions = fileData.candidates || fileData.questions || [];
      } catch (err) {
        console.error("Error reading candidate file:", err);
      }
    }

    // 2. If no candidate file on disk, read dynamically from pool-state.json excluding any USED questions
    if (candidateQuestions.length === 0 && fs.existsSync(topicsDir)) {
      try {
        // Find topic file in data/ddd/topics/
        const files = fs.readdirSync(topicsDir);
        const prefix = `${padTopic}_`;
        const topicFileName = files.find((f) => f.startsWith(prefix) && f.endsWith(".json"));

        if (topicFileName) {
          const topicFilePath = path.join(topicsDir, topicFileName);
          const topicData = JSON.parse(fs.readFileSync(topicFilePath, "utf-8"));
          const allQuestions: any[] = topicData.questions || [];
          const questionMap = new Map<string, any>();
          for (const q of allQuestions) {
            questionMap.set(String(q.id), q);
          }

          let poolState: any = null;
          if (fs.existsSync(poolStateFile)) {
            poolState = JSON.parse(fs.readFileSync(poolStateFile, "utf-8"));
          }

          const topicState = poolState?.topics?.[String(masterTopicId)];
          let targetIds: string[] = [];

          // Collect already used IDs from local state
          const usedSet = new Set<string>();
          if (Array.isArray(topicState?.used)) {
            for (const u of topicState.used) {
              const uid = typeof u === "object" && u !== null ? u.id : String(u);
              if (uid) usedSet.add(uid);
            }
          }

          // Authoritative sync: Query Convex directly so any question already imported in DB is NEVER served as candidate
          try {
            const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://shiny-wildcat-270.convex.cloud";
            const checkIds = allQuestions.map((q) => String(q.id));
            const convexRes = await fetch(`${convexUrl}/api/query`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "questions:checkExistingProvenance",
                args: { sourceQuestionIds: checkIds },
              }),
            });
            if (convexRes.ok) {
              const convexData = await convexRes.json();
              if (Array.isArray(convexData.value?.existingSourceIds)) {
                for (const exId of convexData.value.existingSourceIds) {
                  usedSet.add(String(exId));
                }
              }
            }
          } catch (convexErr) {
            console.error("Convex check in candidate-set:", convexErr);
          }

          if (topicState?.candidate && topicState.candidate.length > 0) {
            targetIds = topicState.candidate.filter((id: string) => !usedSet.has(id));
          } else if (topicState?.available && topicState.available.length > 0) {
            // Pick next 25 available that have NEVER been used
            const freshAvailable = topicState.available.filter((id: string) => !usedSet.has(id));
            targetIds = freshAvailable.slice(0, 25);
          } else {
            targetIds = [...allQuestions]
              .sort(comparePoolQuestions)
              .map((q) => String(q.id))
              .filter((id) => !usedSet.has(id))
              .slice(0, 25);
          }

          for (const qid of targetIds) {
            const q = questionMap.get(String(qid));
            if (q) candidateQuestions.push(q);
          }

          candidateQuestions.sort(comparePoolQuestions);
        }
      } catch (err) {
        console.error("Error resolving topic questions:", err);
      }
    } else if (candidateQuestions.length > 0) {
      candidateQuestions.sort(comparePoolQuestions);
    }

    const topicHindi = topicInfo?.nameHindi || `Topic ${masterTopicId}`;
    const subjectHindi = topicInfo?.subjectHindi || "राजस्थान सामान्य ज्ञान";
    const setName = `${topicHindi} भाग ${setNumber}`;

    // Format clean questions for prompt
    const promptQuestions = candidateQuestions.map((q) => ({
      id: q.id,
      question: q.question,
      options: q.options,
      answer: q.answer,
      explanation: q.explanation || "",
      exam: q.exam || null,
      year: q.year || null,
    }));

    const isFinalTopicSet = candidateQuestions.length < 20;
    const targetCount = isFinalTopicSet ? candidateQuestions.length : 20;
    const taskDescription = isFinalTopicSet
      ? `यह इस टॉपिक का अंतिम सेट (Final Set) है। आपका कार्य दिए गए सभी ${targetCount} प्रश्नों की गुणवत्ता समीक्षा (Review & Repair) करके ठीक ${targetCount} प्रश्नों का अंतिम सेट तैयार करना है। अपनी ओर से कोई अन्य प्रश्न न जोड़ें।`
      : `आपका कार्य इन प्रश्नों की गुणवत्ता समीक्षा (Review & Repair) करके ठीक 20 सर्वश्रेष्ठ प्रश्नों का अंतिम सेट तैयार करना है।`;

    const countRule = isFinalTopicSet
      ? `1. ठीक ${targetCount} प्रश्न दें (Select ALL ${targetCount} provided questions)। दिए गए सभी ${targetCount} प्रश्नों को सुधारें। कोई नया प्रश्न न बनाएँ और न ही पुराने सेट्स से कोई प्रश्न जोड़ें।`
      : `1. ठीक 20 प्रश्न चुनें (Select EXACTLY 20 questions)। न 19, न 21।`;

    // Build the Authoritative Gemini Prompt
    const geminiPrompt = `आप राजस्थान प्रतियोगी परीक्षाओं (RPSC, RSMSSB, RAS, REET, पटवार, CET) के वरिष्ठ परीक्षा विशेषज्ञ हैं।

विषय: ${subjectHindi}
शीर्षक (Master Topic #${masterTopicId}): ${topicHindi}
सेट: ${setName}${isFinalTopicSet ? " (अंतिम सेट / Final Set)" : ""}
कैंडिडेट प्रश्नों की संख्या: ${candidateQuestions.length}

नीचे हमारे स्थानीय प्रश्न-पूल से ${candidateQuestions.length} उम्मीदवार प्रश्न दिए गए हैं।
${taskDescription}

==================================================
कड़े नियम एवं निर्देश:
==================================================
${countRule}
2. व्याकरण, वर्तनी एवं देवनागरी लिपि की त्रुटियाँ ठीक करें।
3. विकल्पों की स्पष्टता जाँचें: प्रत्येक प्रश्न में ठीक 4 विकल्प होने चाहिए। कोई विकल्प खाली या पुनरावृत्त (duplicate) न हो।
4. सही उत्तर (0-आधारित सूचकांक: 0, 1, 2, या 3) की शत-प्रतिशत प्रामाणिकता सुनिश्चित करें।
5. प्रत्येक प्रश्न की 1-2 पंक्तियों की प्रामाणिक एवं विस्तृत हिंदी व्याख्या (Explanation) लिखें।
6. सेट के भीतर कोई दोहराव (intra-set repetition) न हो। यदि दो प्रश्न एक ही तथ्य पर हों, तो केवल एक सबसे अच्छा प्रश्न रखें।
7. 'id' (जैसे "${candidateQuestions[0]?.id || "rg_000001"}") को EXACTLY वही रखें जो मूल प्रश्न में दिया गया है। इसे बदलें नहीं।
8. अपनी ओर से कोई नया प्रश्न न बनाएँ। केवल दिए गए उम्मीदवार प्रश्नों को ही सुधारें।
9. उद्धरण चिह्नों की JSON सुरक्षा (CRITICAL Quotes Escaping Rule): यदि किसी प्रश्न (question), विकल्प (options) या व्याख्या (explanation) में कोई कथन, नारा, पुस्तक या उपाधि उद्धृत हो (जैसे "मैं अपने डेथ वारंट पर हस्ताक्षर कर रहा हूँ"), तो JSON स्ट्रिंग के भीतर कभी भी कच्चा अनएस्केप्ड डबल कोट (") न छोड़ें। उद्धरण के लिए या तो एकल उद्धरण चिन्ह ('...') या स्मार्ट उद्धरण (‘...’ / “...”) का प्रयोग करें अथवा \\" से उचित रूप से एस्केप करें। कच्चा डबल कोट JSON पार्सिंग को पूरी तरह क्रैश कर देता है।

==================================================
उम्मीदवार प्रश्न (Candidate Questions):
==================================================
${JSON.stringify(promptQuestions, null, 2)}

==================================================
अपेक्षित आउटपुट प्रारूप (Strict Output Format):
==================================================
केवल और केवल शुद्ध JSON Array वापस करें। कोई अतिरिक्त वाक्य, मार्कडाउन या चैट वार्तालाप न जोड़ें:

[
  {
    "id": "${candidateQuestions[0]?.id || "rg_000001"}",
    "question": "शुद्ध प्रामाणिक प्रश्न पाठ (कथन हेतु '...' या \\\"...\\\" का प्रयोग करें)...",
    "options": [
      "विकल्प 1",
      "विकल्प 2",
      "विकल्प 3",
      "विकल्प 4"
    ],
    "answer": 0,
    "explanation": "विस्तृत प्रमाणिक व्याख्या...",
    "exam": "REET",
    "year": 2021
  }
]`;

    return NextResponse.json({
      success: true,
      masterTopicId,
      masterTopic: topicHindi,
      subjectName: subjectHindi,
      setNumber,
      setName,
      candidateCount: candidateQuestions.length,
      questions: promptQuestions,
      geminiPrompt,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message || "Failed to load candidate set" },
      { status: 500 }
    );
  }
}
