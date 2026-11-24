import {
  accessRequestsService,
  createAccessRequestsService,
} from "@/lib/services/access-requests-service";
import { adminService, createAdminService } from "@/lib/services/admin-service";
import { authService, createAuthService } from "@/lib/services/auth-service";
import {
  billingService,
  createBillingService,
} from "@/lib/services/billing-service";
import {
  contentService,
  createContentService,
} from "@/lib/services/content-service";
import {
  createEvaluationService,
  evaluationService,
} from "@/lib/services/evaluation-service";
import {
  createFriendsService,
  friendsService,
} from "@/lib/services/friends-service";
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
  createSecurityService,
  securityService,
} from "@/lib/services/security-service";
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

export * from "@/lib/services/access-requests-service";
export * from "@/lib/services/admin-service";
export * from "@/lib/services/auth-service";
export * from "@/lib/services/billing-service";
export * from "@/lib/services/content-service";
export * from "@/lib/services/evaluation-service";
export * from "@/lib/services/friends-service";
export * from "@/lib/services/history-service";
export * from "@/lib/services/ia-service";
export * from "@/lib/services/readings-service";
export * from "@/lib/services/route-access-service";
export * from "@/lib/services/security-service";
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
  billing: billingService,
  settings: settingsService,
  readings: readingsService,
  content: contentService,
  evaluation: evaluationService,
  friends: friendsService,
  history: historyService,
  ia: iaService,
  admin: adminService,
  accessRequests: accessRequestsService,
  security: securityService,
  system: systemService,
} as const;

export const serviceFactories = {
  createAuthService,
  createUsersService,
  createSubscriptionsService,
  createBillingService,
  createSettingsService,
  createReadingsService,
  createContentService,
  createEvaluationService,
  createFriendsService,
  createHistoryService,
  createIaService,
  createAdminService,
  createAccessRequestsService,
  createSecurityService,
  createSystemService,
} as const;
