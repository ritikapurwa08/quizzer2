/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as attempts from "../attempts.js";
import type * as auth from "../auth.js";
import type * as bookmarks from "../bookmarks.js";
import type * as http from "../http.js";
import type * as lib_permissions from "../lib/permissions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as questions from "../questions.js";
import type * as search from "../search.js";
import type * as seed from "../seed.js";
import type * as subjects from "../subjects.js";
import type * as testSets from "../testSets.js";
import type * as topics from "../topics.js";
import type * as users from "../users.js";
import type * as wrongQuestions from "../wrongQuestions.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  attempts: typeof attempts;
  auth: typeof auth;
  bookmarks: typeof bookmarks;
  http: typeof http;
  "lib/permissions": typeof lib_permissions;
  "lib/validators": typeof lib_validators;
  questions: typeof questions;
  search: typeof search;
  seed: typeof seed;
  subjects: typeof subjects;
  testSets: typeof testSets;
  topics: typeof topics;
  users: typeof users;
  wrongQuestions: typeof wrongQuestions;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
