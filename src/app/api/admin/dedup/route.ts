import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const DEDUP_DIR = path.join(process.cwd(), "data", "ddd", "dedup");
const REVIEWS_FILE = path.join(DEDUP_DIR, "user-reviews.json");
const REVIEW_PAIRS_FILE = path.join(DEDUP_DIR, "review-pairs.json");
const DEDUP_GROUPS_FILE = path.join(DEDUP_DIR, "dedup-groups.json");
const REPORT_FILE = path.join(DEDUP_DIR, "report.md");

function getStoredReviews(): Record<string, { decision: string; note: string; preferredId?: string; updatedAt: number }> {
  try {
    if (fs.existsSync(REVIEWS_FILE)) {
      return JSON.parse(fs.readFileSync(REVIEWS_FILE, "utf-8"));
    }
  } catch {
    // fallback
  }
  return {};
}

function saveStoredReviews(data: Record<string, any>) {
  fs.mkdirSync(DEDUP_DIR, { recursive: true });
  fs.writeFileSync(REVIEWS_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const exportType = searchParams.get("export");

    if (exportType === "groups" && fs.existsSync(DEDUP_GROUPS_FILE)) {
      const content = fs.readFileSync(DEDUP_GROUPS_FILE, "utf-8");
      return new Response(content, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="dedup-groups.json"',
        },
      });
    }
    if (exportType === "master") {
      const masterFile = path.join(process.cwd(), "data", "master-pool", "master-pool.json");
      if (fs.existsSync(masterFile)) {
        const content = fs.readFileSync(masterFile, "utf-8");
        return new Response(content, {
          headers: {
            "Content-Type": "application/json",
            "Content-Disposition": 'attachment; filename="master-pool.json"',
          },
        });
      }
    }
    if (exportType === "reviews" && fs.existsSync(REVIEWS_FILE)) {
      const content = fs.readFileSync(REVIEWS_FILE, "utf-8");
      return new Response(content, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": 'attachment; filename="user-reviews.json"',
        },
      });
    }

    const mode = searchParams.get("mode") || "review"; // "review" | "groups"
    const whyFilter = searchParams.get("why") || "all";
    const statusFilter = searchParams.get("status") || "all"; // "all" | "reviewed" | "unreviewed"
    const search = (searchParams.get("search") || "").toLowerCase().trim();
    const page = Math.max(0, parseInt(searchParams.get("page") || "0", 10));
    const limit = Math.min(1000, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const userReviews = getStoredReviews();
    const reviewedKeys = new Set(Object.keys(userReviews));

    let reportText = "";
    try {
      if (fs.existsSync(REPORT_FILE)) {
        reportText = fs.readFileSync(REPORT_FILE, "utf-8");
      }
    } catch {
      // ignore
    }

    if (mode === "review") {
      if (!fs.existsSync(REVIEW_PAIRS_FILE)) {
        return NextResponse.json({
          items: [],
          total: 0,
          reviewedCount: 0,
          report: reportText,
          message: "review-pairs.json not found. Run scripts/dedup_pool.py first.",
        });
      }

      const rawPairs: Array<{
        a: { id: string; q: string; options: string[]; answer: string };
        b: { id: string; q: string; options: string[]; answer: string };
        similarity: number;
        why: string;
      }> = JSON.parse(fs.readFileSync(REVIEW_PAIRS_FILE, "utf-8"));

      // Filter pairs
      const filtered = rawPairs
        .map((p, index) => {
          const pairKey = `${p.a.id}___${p.b.id}`;
          const review = userReviews[pairKey] || null;
          return {
            pairKey,
            index,
            ...p,
            review,
          };
        })
        .filter((item) => {
          if (whyFilter !== "all" && item.why !== whyFilter) return false;
          if (statusFilter === "reviewed" && !item.review) return false;
          if (statusFilter === "unreviewed" && item.review) return false;

          if (search) {
            const matchA =
              item.a.id.toLowerCase().includes(search) ||
              item.a.q.toLowerCase().includes(search);
            const matchB =
              item.b.id.toLowerCase().includes(search) ||
              item.b.q.toLowerCase().includes(search);
            if (!matchA && !matchB) return false;
          }
          return true;
        });

      const total = filtered.length;
      const startIndex = page * limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + limit).map((it, idx) => ({
        ...it,
        globalIndex: startIndex + idx + 1,
      }));

      return NextResponse.json({
        mode: "review",
        items: paginatedItems,
        total,
        startIndex,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        reviewedCount: reviewedKeys.size,
        totalRawCount: rawPairs.length,
        report: reportText,
      });
    } else {
      // mode === "groups"
      if (!fs.existsSync(DEDUP_GROUPS_FILE)) {
        return NextResponse.json({
          items: [],
          total: 0,
          totalDuplicatesCount: 0,
          reviewedCount: 0,
          report: reportText,
          message: "dedup-groups.json not found. Run scripts/dedup_pool.py first.",
        });
      }

      const rawGroups: Record<
        string,
        Array<{
          id: string;
          exam?: string;
          year?: number;
          inConvex: boolean;
          question: string;
          options: string[];
          answer: string;
        }>
      > = JSON.parse(fs.readFileSync(DEDUP_GROUPS_FILE, "utf-8"));

      let totalDuplicatesInAllGroups = 0;
      const groupEntries = Object.entries(rawGroups).map(([canonicalId, members], index) => {
        const groupKey = `group___${canonicalId}`;
        const review = userReviews[groupKey] || null;
        totalDuplicatesInAllGroups += Math.max(0, members.length - 1);
        return {
          groupKey,
          canonicalId,
          index,
          membersCount: members.length,
          duplicateVariantsCount: Math.max(0, members.length - 1),
          members,
          review,
        };
      });

      const filtered = groupEntries.filter((item) => {
        if (statusFilter === "reviewed" && !item.review) return false;
        if (statusFilter === "unreviewed" && item.review) return false;

        if (search) {
          const matchCanonical =
            item.canonicalId.toLowerCase().includes(search) ||
            item.members.some(
              (m) =>
                m.id.toLowerCase().includes(search) ||
                m.question.toLowerCase().includes(search) ||
                (m.exam && m.exam.toLowerCase().includes(search))
            );
          if (!matchCanonical) return false;
        }
        return true;
      });

      const total = filtered.length;
      const startIndex = page * limit;
      const paginatedItems = filtered.slice(startIndex, startIndex + limit).map((it, idx) => ({
        ...it,
        globalIndex: startIndex + idx + 1,
      }));

      return NextResponse.json({
        mode: "groups",
        items: paginatedItems,
        total,
        startIndex,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
        totalDuplicatesCount: totalDuplicatesInAllGroups,
        reviewedCount: reviewedKeys.size,
        totalRawCount: groupEntries.length,
        report: reportText,
      });
    }
  } catch (err: any) {
    console.error("GET /api/admin/dedup error:", err);
    return NextResponse.json({ error: err.message || "Failed to load deduplication data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check if body is an array or contains { bulk: [...] } or a single review
    const itemsToProcess: Array<{ key: string; decision: string; note?: string; preferredId?: string }> = [];

    if (Array.isArray(body)) {
      for (const item of body) {
        const key = item.id || item.pairKey || item.key;
        if (key && item.decision) {
          itemsToProcess.push({
            key,
            decision: item.decision,
            note: item.note || (item.correct_answer ? `Correct Ans: ${item.correct_answer}` : ""),
            preferredId: item.preferred_id || item.preferredId,
          });
        }
      }
    } else if (body.bulk && Array.isArray(body.bulk)) {
      for (const item of body.bulk) {
        const key = item.id || item.pairKey || item.key;
        if (key && item.decision) {
          itemsToProcess.push({
            key,
            decision: item.decision,
            note: item.note || (item.correct_answer ? `Correct Ans: ${item.correct_answer}` : ""),
            preferredId: item.preferred_id || item.preferredId,
          });
        }
      }
    } else if (body.key && body.decision) {
      itemsToProcess.push({
        key: body.key,
        decision: body.decision,
        note: body.note || "",
        preferredId: body.preferredId,
      });
    }

    if (itemsToProcess.length === 0) {
      return NextResponse.json({ error: "No valid review items provided" }, { status: 400 });
    }

    const reviews = getStoredReviews();
    const now = Date.now();
    for (const item of itemsToProcess) {
      reviews[item.key] = {
        decision: item.decision,
        note: item.note || "",
        preferredId: item.preferredId,
        updatedAt: now,
      };
    }

    saveStoredReviews(reviews);

    return NextResponse.json({
      success: true,
      importedCount: itemsToProcess.length,
      review: itemsToProcess.length === 1 ? reviews[itemsToProcess[0].key] : undefined,
      reviewedCount: Object.keys(reviews).length,
    });
  } catch (err: any) {
    console.error("POST /api/admin/dedup error:", err);
    return NextResponse.json({ error: err.message || "Failed to save review" }, { status: 500 });
  }
}

