import { useCallback, useEffect, useState } from "react";
import {
  getNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "./api";
import { adaptNotification } from "./adapters";

// Tiny pub/sub so the sidebar's unread badge (its own polling hook,
// mounted in the layout) refreshes the instant a notification is read
// on the Notifications page, rather than waiting for its next poll tick.
const target = typeof EventTarget !== "undefined" ? new EventTarget() : null;
const CHANGED_EVENT = "notifications:changed";
const notifyChanged = () => target?.dispatchEvent(new Event(CHANGED_EVENT));

/**
 * Loads the current user's notifications and exposes read/mark-all-read
 * actions backed by the real API. Used by both the client and admin
 * Notifications pages — a user only ever sees their own notifications
 * (enforced server-side), so this hook works the same for either role.
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getNotifications();
      setNotifications(data.map(adaptNotification));
    } catch (e) {
      setError(e.message || "Could not load notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = useCallback(async (id) => {
    // Optimistic update — the list feels instant, and a failed request
    // just gets corrected on the next refresh.
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await markNotificationRead(id);
      notifyChanged();
    } catch (e) {
      setError(e.message || "Could not mark notification as read.");
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    try {
      await markAllNotificationsRead();
      notifyChanged();
    } catch (e) {
      setError(e.message || "Could not mark all notifications as read.");
    }
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, loading, error, refresh: load, markRead, markAllRead };
}

/**
 * Lightweight polling hook for the sidebar unread badge. Deliberately
 * separate from useNotifications so layouts don't have to fetch every
 * notification just to show a count. No WebSockets/SSE — this project
 * doesn't use them elsewhere, so we keep it simple and poll.
 */
export function useUnreadNotificationCount(pollIntervalMs = 30000) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const data = await getUnreadNotificationCount();
      setCount(data.count || 0);
    } catch (_) {
      // Non-critical UI element — fail silently and try again next tick.
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, pollIntervalMs);
    target?.addEventListener(CHANGED_EVENT, refresh);
    return () => {
      clearInterval(interval);
      target?.removeEventListener(CHANGED_EVENT, refresh);
    };
  }, [refresh, pollIntervalMs]);

  return { unreadCount: count, refreshUnreadCount: refresh };
}
