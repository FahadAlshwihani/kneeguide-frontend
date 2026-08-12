import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { LuTriangleAlert, LuInfo, LuBellRing } from "react-icons/lu";
import { getRelativeTimeBucket, NOTIFICATION_SEVERITY } from "../../data/doctorNotificationsMockData";
import "./DoctorNotificationsPanel.css";

const SEVERITY_ICON = {
  [NOTIFICATION_SEVERITY.WARNING]: LuTriangleAlert,
  [NOTIFICATION_SEVERITY.ATTENTION]: LuBellRing,
  [NOTIFICATION_SEVERITY.INFO]: LuInfo,
};

/**
 * Notification list content (rendered inside components/ui/Popover.jsx by
 * DoctorTopbar.jsx). Purely presentational — all state comes from
 * assistant/useDoctorNotifications.js, called ONCE by DoctorTopbar so the
 * bell badge and this panel always agree on the unread count (Section 14).
 * Mock/deterministic (Section 13): notifications always render fresh from
 * data/doctorNotificationsMockData.js, so a language switch updates every
 * title/message/relative-time label immediately, same architecture as the
 * seeded Assistant conversations.
 */
const DoctorNotificationsPanel = ({ notifications, readIds, unreadCount, onMarkRead, onMarkAllRead, onClose }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const handleActivate = (notification) => {
    onMarkRead(notification.id);
    if (notification.routeTo) {
      navigate(notification.routeTo);
      onClose?.();
    }
  };

  return (
    <div className="doctor-notif-panel">
      <div className="doctor-notif-header">
        <p className="doctor-notif-title">{t("doctorShell.notifications.title")}</p>
        <button type="button" className="doctor-notif-mark-all" onClick={onMarkAllRead} disabled={unreadCount === 0}>
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
