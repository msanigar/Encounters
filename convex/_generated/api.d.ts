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
import type * as actions_email from "../actions/email.js";
import type * as actions_livekit from "../actions/livekit.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_utils from "../lib/utils.js";
import type * as mutations_chat from "../mutations/chat.js";
import type * as mutations_cleanup from "../mutations/cleanup.js";
import type * as mutations_encounter from "../mutations/encounter.js";
import type * as mutations_forms from "../mutations/forms.js";
import type * as mutations_handoff from "../mutations/handoff.js";
import type * as mutations_invites from "../mutations/invites.js";
import type * as mutations_patients from "../mutations/patients.js";
import type * as mutations_provider from "../mutations/provider.js";
import type * as mutations_queue from "../mutations/queue.js";
import type * as mutations_resetOits from "../mutations/resetOits.js";
import type * as mutations_scheduling from "../mutations/scheduling.js";
import type * as mutations_tokens from "../mutations/tokens.js";
import type * as mutations_workflow from "../mutations/workflow.js";
import type * as queries_calendar from "../queries/calendar.js";
import type * as queries_encounters from "../queries/encounters.js";
import type * as queries_forms from "../queries/forms.js";
import type * as queries_invites from "../queries/invites.js";
import type * as queries_journal from "../queries/journal.js";
import type * as queries_patients from "../queries/patients.js";
import type * as queries_presence from "../queries/presence.js";
import type * as queries_queue from "../queries/queue.js";
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
  "actions/email": typeof actions_email;
  "actions/livekit": typeof actions_livekit;
  "lib/constants": typeof lib_constants;
  "lib/utils": typeof lib_utils;
  "mutations/chat": typeof mutations_chat;
  "mutations/cleanup": typeof mutations_cleanup;
  "mutations/encounter": typeof mutations_encounter;
  "mutations/forms": typeof mutations_forms;
  "mutations/handoff": typeof mutations_handoff;
  "mutations/invites": typeof mutations_invites;
  "mutations/patients": typeof mutations_patients;
  "mutations/provider": typeof mutations_provider;
  "mutations/queue": typeof mutations_queue;
  "mutations/resetOits": typeof mutations_resetOits;
  "mutations/scheduling": typeof mutations_scheduling;
  "mutations/tokens": typeof mutations_tokens;
  "mutations/workflow": typeof mutations_workflow;
  "queries/calendar": typeof queries_calendar;
  "queries/encounters": typeof queries_encounters;
  "queries/forms": typeof queries_forms;
  "queries/invites": typeof queries_invites;
  "queries/journal": typeof queries_journal;
  "queries/patients": typeof queries_patients;
  "queries/presence": typeof queries_presence;
  "queries/queue": typeof queries_queue;
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
