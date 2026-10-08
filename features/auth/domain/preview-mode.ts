import { hasAdminPrivileges, type UserRoleType } from "./auth-roles";

export const PARTICIPANT_PREVIEW_COOKIE = "holdmetoit_preview_as_participant";

export function isParticipantPreviewEnabled(cookieValue?: string | null): boolean {
  return cookieValue === "true" || cookieValue === "1";
}

export interface EffectiveAdminState {
  isActualAdmin: boolean;
  isPreviewActive: boolean;
  isAdmin: boolean;
  effectiveRole: UserRoleType | string | null;
}

/**
 * Computes effective admin and preview status for a user based on their actual role,
 * the global preview cookie, and optional query parameters.
 */
export function getEffectiveAdminState({
  userRole,
  previewCookie,
  searchParamAs,
}: {
  userRole?: UserRoleType | string | null;
  previewCookie?: string | null;
  searchParamAs?: string | null;
}): EffectiveAdminState {
  const isActualAdmin = hasAdminPrivileges(userRole);
  const isPreviewRequested =
    isParticipantPreviewEnabled(previewCookie) ||
    searchParamAs === "participant";

  const isPreviewActive = isActualAdmin && isPreviewRequested;
  const isAdmin = isActualAdmin && !isPreviewActive;
  const effectiveRole = isPreviewActive ? "PARTICIPANT" : userRole || null;

  return {
    isActualAdmin,
    isPreviewActive,
    isAdmin,
    effectiveRole,
  };
}
