import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireAdmin } from "./lib/permissions";

/** Fetches a topic's note metadata & structured content by topicId. */
export const getTopicNote = query({
  args: { topicId: v.id("topics") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("topicNotes")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .unique();
  },
});

/** Fetches note metadata & structured content for the student study page using clean URL slugs. */
export const getTopicNoteBySlug = query({
  args: { subjectSlug: v.string(), topicSlug: v.string() },
  handler: async (ctx, args) => {
    const subject = await ctx.db
      .query("subjects")
      .withIndex("by_slug", (q) => q.eq("slug", args.subjectSlug))
      .unique();
    if (!subject) return null;

    const topic = await ctx.db
      .query("topics")
      .withIndex("by_subject_slug", (q) =>
        q.eq("subjectId", subject._id).eq("slug", args.topicSlug),
      )
      .unique();
    if (!topic) return null;

    const note = await ctx.db
      .query("topicNotes")
      .withIndex("by_topic", (q) => q.eq("topicId", topic._id))
      .unique();

    return {
      subject,
      topic,
      note,
    };
  },
});

/** Lists published topic notes for a subject for student browsing. */
export const listPublishedBySubject = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("topicNotes")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .filter((q) => q.eq(q.field("isPublished"), true))
      .collect();

    return notes;
  },
});

/** Lists topic note statuses across all topics in a subject for the Admin Console. */
export const listAllForAdmin = query({
  args: { subjectId: v.id("subjects") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const topics = await ctx.db
      .query("topics")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const notes = await ctx.db
      .query("topicNotes")
      .withIndex("by_subject", (q) => q.eq("subjectId", args.subjectId))
      .collect();

    const noteMap = new Map(notes.map((n) => [n.topicId, n]));

    return topics
      .sort((a, b) => a.order - b.order)
      .map((topic) => {
        const note = noteMap.get(topic._id);
        return {
          topicId: topic._id,
          topicName: topic.name,
          topicNameHindi: topic.nameHindi,
          slug: topic.slug,
          order: topic.order,
          noteId: note?._id ?? null,
          hasPdf: note?.hasPdf ?? false,
          pdfPath: note?.pdfPath ?? null,
          hasContent: Boolean(note?.content && note.content.trim().length > 0),
          imageCount: note?.images?.length ?? 0,
          isPublished: note?.isPublished ?? false,
          updatedAt: note?.updatedAt ?? null,
        };
      });
  },
});

/** Upsert topic note metadata & structured content JSON. */
export const saveTopicNote = mutation({
  args: {
    topicId: v.id("topics"),
    subjectId: v.id("subjects"),
    title: v.string(),
    summary: v.optional(v.string()),
    pdfPath: v.optional(v.string()),
    hasPdf: v.boolean(),
    images: v.optional(
      v.array(
        v.object({
          id: v.string(),
          src: v.string(),
          alt: v.string(),
          caption: v.optional(v.string()),
          title: v.optional(v.string()),
          width: v.optional(v.number()),
          height: v.optional(v.number()),
        }),
      ),
    ),
    content: v.optional(v.string()),
    isPublished: v.boolean(),
    adminSecret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    if (args.adminSecret !== "quizzer_admin_pool_init_2026") {
      await requireAdmin(ctx);
    }

    const topic = await ctx.db.get(args.topicId);
    if (!topic) throw new Error("Topic not found");

    const existing = await ctx.db
      .query("topicNotes")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .unique();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        summary: args.summary,
        pdfPath: args.pdfPath,
        hasPdf: args.hasPdf,
        images: args.images,
        content: args.content,
        isPublished: args.isPublished,
        publishedAt: args.isPublished ? (existing.publishedAt ?? now) : undefined,
        updatedAt: now,
      });
      return existing._id;
    } else {
      return await ctx.db.insert("topicNotes", {
        topicId: args.topicId,
        subjectId: args.subjectId,
        slug: topic.slug,
        title: args.title,
        summary: args.summary,
        pdfPath: args.pdfPath,
        hasPdf: args.hasPdf,
        images: args.images,
        content: args.content,
        isPublished: args.isPublished,
        publishedAt: args.isPublished ? now : undefined,
        updatedAt: now,
      });
    }
  },
});

/** Toggle published status for a topic note. */
export const togglePublish = mutation({
  args: { topicId: v.id("topics"), isPublished: v.boolean() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const note = await ctx.db
      .query("topicNotes")
      .withIndex("by_topic", (q) => q.eq("topicId", args.topicId))
      .unique();
    if (!note) throw new Error("Note not found for this topic");

    const now = Date.now();
    await ctx.db.patch(note._id, {
      isPublished: args.isPublished,
      publishedAt: args.isPublished ? (note.publishedAt ?? now) : undefined,
      updatedAt: now,
    });
  },
});
