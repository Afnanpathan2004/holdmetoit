"use client";

import LogRocket from "logrocket";
import setupLogRocketReact from "logrocket-react";

export const LOGROCKET_APP_ID = "q9morb/holdmeintoit";

let initialized = false;

export type LogRocketUserTraits = {
  name?: string | null;
  role?: string | null;
  discordId?: string | null;
};

export type LogRocketEventProps = Record<
  string,
  | string
  | number
  | boolean
  | string[]
  | number[]
  | boolean[]
  | null
  | undefined
>;

export function initLogRocket(): void {
  if (typeof window === "undefined" || initialized) {
    return;
  }

  LogRocket.init(LOGROCKET_APP_ID, {
    release: "0.1.0",
  });
  setupLogRocketReact();
  initialized = true;
}

export function identifyLogRocketUser(
  userId: string,
  traits?: LogRocketUserTraits,
): void {
  if (typeof window === "undefined" || !userId) {
    return;
  }

  const payload: Record<string, string> = {};
  if (traits?.name) payload.name = traits.name;
  if (traits?.role) payload.role = traits.role;
  if (traits?.discordId) payload.discordId = traits.discordId;

  LogRocket.identify(userId, payload);
}

export function trackLogRocketEvent(
  eventName: string,
  properties?: LogRocketEventProps,
): void {
  if (typeof window === "undefined") {
    return;
  }

  if (properties) {
    LogRocket.track(eventName, properties);
    return;
  }

  LogRocket.track(eventName);
}

export function captureLogRocketException(
  error: unknown,
  context?: { tags?: Record<string, string>; extra?: Record<string, string | number | boolean> },
): void {
  if (typeof window === "undefined") {
    return;
  }

  const err = error instanceof Error ? error : new Error(String(error));
  LogRocket.captureException(err, context);
}

export function captureLogRocketMessage(
  message: string,
  extra?: Record<string, string | number | boolean>,
): void {
  if (typeof window === "undefined") {
    return;
  }

  LogRocket.captureMessage(message, extra ? { extra } : undefined);
}

export function getLogRocketSessionURL(): Promise<string | null> {
  if (typeof window === "undefined" || !initialized) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      LogRocket.getSessionURL((url) => {
        resolve(url || null);
      });
    } catch {
      resolve(null);
    }
  });
}

