/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as actions_livekit from "../actions/livekit.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_utils from "../lib/utils.js";
import type * as mutations_chat from "../mutations/chat.js";
import type * as mutations_cleanup from "../mutations/cleanup.js";
import type * as mutations_encounter from "../mutations/encounter.js";
import type * as mutations_handoff from "../mutations/handoff.js";
import type * as mutations_invites from "../mutations/invites.js";
import type * as mutations_provider from "../mutations/provider.js";
import type * as mutations_tokens from "../mutations/tokens.js";
import type * as mutations_workflow from "../mutations/workflow.js";
import type * as queries_encounters from "../queries/encounters.js";
import type * as queries_invites from "../queries/invites.js";
import type * as queries_journal from "../queries/journal.js";
import type * as queries_presence from "../queries/presence.js";
import type * as queries_workflows from "../queries/workflows.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/livekit": typeof actions_livekit;
  "lib/constants": typeof lib_constants;
  "lib/utils": typeof lib_utils;
  "mutations/chat": typeof mutations_chat;
  "mutations/cleanup": typeof mutations_cleanup;
  "mutations/encounter": typeof mutations_encounter;
  "mutations/handoff": typeof mutations_handoff;
  "mutations/invites": typeof mutations_invites;
  "mutations/provider": typeof mutations_provider;
  "mutations/tokens": typeof mutations_tokens;
  "mutations/workflow": typeof mutations_workflow;
  "queries/encounters": typeof queries_encounters;
  "queries/invites": typeof queries_invites;
  "queries/journal": typeof queries_journal;
  "queries/presence": typeof queries_presence;
  "queries/workflows": typeof queries_workflows;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
