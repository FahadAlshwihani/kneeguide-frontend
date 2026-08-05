import React from "react";
import { useTranslation } from "react-i18next";
import { FaListCheck, FaCalendarCheck, FaHeartPulse, FaChartColumn } from "react-icons/fa6";
import Reveal from "../../components/Reveal";
import "./Platform.css";

const CAPABILITY_ITEMS = [
  { key: "painTracking", icon: FaHeartPulse },
  { key: "exerciseLibrary", icon: FaListCheck },
  { key: "scheduling", icon: FaCalendarCheck },
  { key: "reports", icon: FaChartColumn },
];

const Platform = () => {
  const { t } = useTranslation();

  return (
    <section className="platform-root" id="platform">
      <div className="platform-container">
        <Reveal className="platform-header">
          <span className="platform-badge">{t("publicPlatform.badge")}</span>
          <h2 className="platform-title">{t("publicPlatform.title")}</h2>
          <p className="platform-description">{t("publicPlatform.description")}</p>
        </Reveal>

        <div className="platform-list">
          {CAPABILITY_ITEMS.map((item, index) => {
            const Icon = item.icon;
            return (
              <Reveal as="div" key={item.key} delay={index * 0.08} className="platform-row">
                <span className="platform-row-icon">
                  <Icon aria-hidden="true" />
                </span>
                <div className="platform-row-body">
                  <h3 className="platform-row-title">{t(`publicPlatform.capabilities.${item.key}.title`)}</h3>
                  <p className="platform-row-description">{t(`publicPlatform.capabilities.${item.key}.description`)}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Platform;
