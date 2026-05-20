// Event-based toast — call `toast.show(msg)` from anywhere, the global
// <ToastHost /> mounted in the root layout listens and renders.

export type ToastKind = "success" | "info" | "error";

export interface ToastPayload {
  id: string;
  msg: string;
  kind: ToastKind;
  duration?: number;
}

const EVENT = "dear:toast";

function emit(payload: ToastPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: payload }));
}

export const toast = {
  show(msg: string, kind: ToastKind = "info", duration = 2400) {
    emit({ id: Math.random().toString(36).slice(2), msg, kind, duration });
  },
  success(msg: string, duration = 2400) {
    this.show(msg, "success", duration);
  },
  info(msg: string, duration = 2400) {
    this.show(msg, "info", duration);
  },
  error(msg: string, duration = 3200) {
    this.show(msg, "error", duration);
  },
};

export const TOAST_EVENT = EVENT;
