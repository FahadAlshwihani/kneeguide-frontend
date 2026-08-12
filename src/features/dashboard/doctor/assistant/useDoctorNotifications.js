import { useMemo, useState } from "react";
import { getMockNotifications } from "../data/doctorNotificationsMockData";
import { loadReadNotificationIds, saveReadNotificationIds } from "./doctorNotificationsStorage";

/**
 * ONE notifications state instance, called once by DoctorTopbar.jsx and
 * shared (via props) with both the bell badge and the popover panel — a
 * plain lifted-state hook rather than a Context, since exactly one parent
 * (the Topbar) owns both consumers; a Context would be needless ceremony
 * here (Section 28's own "do not over-componentize"). Two independent
 * calls to this hook would each get their own `readIds`, which is exactly
 * the bug this avoids: marking something read in the panel must update
 * the SAME unread count the bell badge shows.
 */
export const useDoctorNotifications = () => {
  const notifications = useMemo(() => getMockNotifications(), []);
  const [readIds, setReadIds] = useState(() => new Set(loadReadNotificationIds()));

  const markRead = (id) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      saveReadNotificationIds(Array.from(next));
      return next;
    });
  };

  const markAllRead = () => {
    const next = new Set(notifications.map((notification) => notification.id));
    setReadIds(next);
    saveReadNotificationIds(Array.from(next));
  };

  const unreadCount = notifications.filter((notification) => !readIds.has(notification.id)).length;

  return { notifications, readIds, markRead, markAllRead, unreadCount };
};
