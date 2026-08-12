import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuTriangleAlert, LuInfo, LuBellRing } from "react-icons/lu";
import { getMockNotifications, getRelativeTimeBucket, NOTIFICATION_SEVERITY } from "../../data/doctorNotificationsMockData";
import { loadReadNotificationIds, saveReadNotificationIds } from "../../assistant/doctorNotificationsStorage";
import "./DoctorNotificationsPanel.css";

const SEVERITY_ICON = {
  [NOTIFICATION_SEVERITY.WARNING]: LuTriangleAlert,
  [NOTIFICATION_SEVERITY.ATTENTION]: LuBellRing,
  [NOTIFICATION_SEVERITY.INFO]: LuInfo,
};

/**
 * Notification list content (rendered inside components/ui/Popover.jsx by
 * DoctorTopbar.jsx). Mock/deterministic (Section 13) — read/unread state
 * is the only thing persisted (doctorNotificationsStorage.js); the
 * notifications themselves always come fresh from
 * data/doctorNotificationsMockData.js so a language switch re-renders
 * every title/message/relative-time label immediately, same architecture
 * as the seeded Assistant conversations.
 */
const useNotificationsState = () => {
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

export const useDoctorNotificationsUnreadCount = () => {
  const { unreadCount } = useNotificationsState();
  return unreadCount;
};

const DoctorNotificationsPanel = ({ onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { notifications, readIds, markRead, markAllRead, unreadCount } = useNotificationsState();

  const handleActivate = (notification) => {
    markRead(notification.id);
    if (notification.routeTo) {
      navigate(notification.routeTo);
      onClose?.();
    }
  };

  return (
    <div className="doctor-notif-panel">
      <div className="doctor-notif-header">
        <p className="doctor-notif-title">{t("doctorShell.notifications.title")}</p>
        <button type="button" className="doctor-notif-mark-all" onClick={markAllRead} disabled={unreadCount === 0}>
          {t("doctorShell.notifications.markAllRead")}
        </button>
      </div>

      {notifications.length === 0 ? (
        <p className="doctor-notif-empty">{t("doctorShell.notifications.empty")}</p>
      ) : (
        <ul className="doctor-notif-list">
          {notifications.map((notification) => {
            const Icon = SEVERITY_ICON[notification.severity] || LuInfo;
            const isRead = readIds.has(notification.id);
            const relative = getRelativeTimeBucket(notification.createdAt);
            const relativeLabel = t(`doctorShell.notifications.relative.${relative.key}`, relative.value !== null ? { count: relative.value } : undefined);

            return (
              <li key={notification.id}>
                <button
                  type="button"
                  className={`doctor-notif-row${isRead ? "" : " doctor-notif-row--unread"}`}
                  onClick={() => handleActivate(notification)}
                >
                  <span className={`doctor-notif-icon doctor-notif-icon--${notification.severity}`} aria-hidden="true">
                    <Icon />
                  </span>
                  <span className="doctor-notif-body">
                    <span className="doctor-notif-row-title" dir="auto">
                      {t(notification.titleKey, notification.values)}
                    </span>
                    <span className="doctor-notif-row-message" dir="auto">
                      {t(notification.messageKey, notification.values)}
                    </span>
                    <span className="doctor-notif-row-meta" dir={i18n.language === "ar" ? "rtl" : "ltr"}>
                      {relativeLabel}
                    </span>
                  </span>
                  {!isRead && <span className="doctor-notif-unread-dot" aria-hidden="true" />}
                  <span className="doctor-visually-hidden">
                    {isRead ? t("doctorShell.notifications.readState.read") : t("doctorShell.notifications.readState.unread")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

export default DoctorNotificationsPanel;
