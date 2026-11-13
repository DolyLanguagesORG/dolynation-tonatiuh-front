import { adminService, createAdminService } from "@/lib/services/admin-service";
import { authService, createAuthService } from "@/lib/services/auth-service";
import {
  contentService,
  createContentService,
} from "@/lib/services/content-service";
import {
  createEvaluationService,
  evaluationService,
} from "@/lib/services/evaluation-service";
import {
  createHistoryService,
  historyService,
} from "@/lib/services/history-service";
import { createIaService, iaService } from "@/lib/services/ia-service";
import {
  createReadingsService,
  readingsService,
} from "@/lib/services/readings-service";
import {
  createSettingsService,
  settingsService,
} from "@/lib/services/settings-service";
import {
  createSubscriptionsService,
  subscriptionsService,
} from "@/lib/services/subscriptions-service";
import {
  createSystemService,
  systemService,
} from "@/lib/services/system-service";
import { createUsersService, usersService } from "@/lib/services/users-service";

export * from "@/lib/services/admin-service";
export * from "@/lib/services/auth-service";
export * from "@/lib/services/content-service";
export * from "@/lib/services/evaluation-service";
export * from "@/lib/services/history-service";
export * from "@/lib/services/ia-service";
export * from "@/lib/services/readings-service";
export * from "@/lib/services/route-access-service";
export * from "@/lib/services/settings-service";
export * from "@/lib/services/subscriptions-service";
export * from "@/lib/services/system-service";
export * from "@/lib/services/users-service";

/**
 * Colección unificada de servicios de cliente (Client Components vía `/api/v1/*`).
 */
export const apiServices = {
  auth: authService,
  users: usersService,
  subscriptions: subscriptionsService,
  settings: settingsService,
  readings: readingsService,
  content: contentService,
  evaluation: evaluationService,
  history: historyService,
  ia: iaService,
  admin: adminService,
  system: systemService,
} as const;

export const serviceFactories = {
  createAuthService,
  createUsersService,
  createSubscriptionsService,
  createSettingsService,
  createReadingsService,
  createContentService,
  createEvaluationService,
  createHistoryService,
  createIaService,
  createAdminService,
  createSystemService,
} as const;
