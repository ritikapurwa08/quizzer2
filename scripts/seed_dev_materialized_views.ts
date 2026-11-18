import fs from "fs";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://perceptive-orca-161.convex.cloud");

const baseDir = "data/migration_dry_run";

const globalCatalogSummary = JSON.parse(fs.readFileSync(`${baseDir}/globalCatalogSummary.json`, "utf8"))[0];
const dashboardStats = JSON.parse(fs.readFileSync(`${baseDir}/dashboardStats.json`, "utf8"))[0];
const userDashboardFeed = JSON.parse(fs.readFileSync(`${baseDir}/userDashboardFeed.json`, "utf8"))[0];
const userFilterCounts = JSON.parse(fs.readFileSync(`${baseDir}/userFilterCounts.json`, "utf8"))[0];
const analyticsSnapshots = JSON.parse(fs.readFileSync(`${baseDir}/analyticsSnapshots.json`, "utf8"))[0];

async function run() {
  console.log("Upserting materialized views via ConvexHttpClient to perceptive-orca-161...");
  const result = await client.mutation(api.migrations.upsertMaterializedViews, {
    globalCatalogSummary,
    dashboardStats,
    userDashboardFeed,
    userFilterCounts,
    analyticsSnapshots,
  });
  console.log("Result:", result);

  console.log("Testing siteStats query...");
  const siteStats = await client.query(api.testSets.siteStats);
  console.log("siteStats output:", siteStats);
}

run().catch((e) => console.error(e));
