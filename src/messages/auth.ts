import type { OnlyfansPageAuthSnapshot } from "../types";

export const AUTH_WATCH_PORT_NAME = "auth-watch";
export const SUBSCRIBE_AUTH_WATCH = "SUBSCRIBE_AUTH_WATCH";
export const START_AUTH_WATCH = "START_AUTH_WATCH";
export const STOP_AUTH_WATCH = "STOP_AUTH_WATCH";
export const AUTH_SNAPSHOT = "AUTH_SNAPSHOT";

export type SubscribeAuthWatchMessage = {
  type: typeof SUBSCRIBE_AUTH_WATCH;
  tabId: number;
};

export type StartAuthWatchMessage = {
  type: typeof START_AUTH_WATCH;
  tabId: number;
};

export type StopAuthWatchMessage = {
  type: typeof STOP_AUTH_WATCH;
};

export type AuthSnapshotMessage = {
  type: typeof AUTH_SNAPSHOT;
  snapshot: OnlyfansPageAuthSnapshot;
};

export type AuthWatchPortMessage =
  | SubscribeAuthWatchMessage
  | AuthSnapshotMessage;

export type AuthWatchRuntimeMessage =
  | StartAuthWatchMessage
  | StopAuthWatchMessage
  | AuthSnapshotMessage;
