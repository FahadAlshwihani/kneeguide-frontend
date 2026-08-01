import React, { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FaUsers, FaCalendarCheck, FaFileLines, FaTriangleExclamation, FaListCheck } from "react-icons/fa6";

import MetricCard from "../../../dashboard/shared/components/MetricCard";
import ProgressCard from "../../../dashboard/shared/components/ProgressCard";
import AppointmentCard from "../../../dashboard/shared/components/AppointmentCard";
import ExerciseCard from "../../../dashboard/shared/components/ExerciseCard";
import DashboardCard from "../../../dashboard/shared/components/DashboardCard";

import { getHeroPreviewData } from "./heroPreviewData";
import useViewportTier from "./useViewportTier";
import "./HeroDashboardPreview.css";

// Cards settle at rest (y:0, rotate:0) — an intentional, aligned grid, not
// a scattered/floating composition. Only the entrance is animated; nothing
// rests at a permanent offset, so cards can never drift toward the CTAs
// or heading above.
const cardEntrance = {
  hidden: { opacity: 0, y: 18 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

/**
 * Builds the pool of preview "widgets", ordered from most to least
 * essential — tiers slice from the front, so shrinking the count always
 * keeps the clearest, most representative cards on screen.
 */
const buildPool = (data) => [
  {
    id: "doctor-appointment",
    size: "lg",
    node: (
      <>
        <span className="hero-dashboard-preview-tag">{data.doctor.badge}</span>
        <DashboardCard title={data.doctor.appointment.title}>
          <AppointmentCard {...data.doctor.appointment} previewMode />
        </DashboardCard>
      </>
    ),
  },
  {
    id: "patient-exercise",
    size: "md",
    node: (
      <>
        <span className="hero-dashboard-preview-tag hero-dashboard-preview-tag-patient">{data.patient.badge}</span>
        <ExerciseCard {...data.patient.exercise} previewMode />
      </>
    ),
  },
  {
    id: "doctor-active-patients",
    size: "sm",
    node: <MetricCard icon={FaUsers} value={data.doctor.metric.value} label={data.doctor.metric.label} />,
  },
  {
    id: "patient-progress",
    size: "md",
    node: (
      <DashboardCard>
        <div className="progress-card-list">
          <ProgressCard {...data.patient.rom} />
          <ProgressCard {...data.patient.adherence} />
        </div>
      </DashboardCard>
    ),
  },
  {
    id: "doctor-progress",
    size: "md",
    node: (
      <DashboardCard>
        <ProgressCard {...data.doctor.progress} />
      </DashboardCard>
    ),
  },
  {
    id: "patient-appointment",
    size: "lg",
    node: (
      <DashboardCard title={data.patient.appointment.title}>
        <AppointmentCard {...data.patient.appointment} previewMode />
      </DashboardCard>
    ),
  },
  {
    id: "doctor-today-appointments",
    size: "sm",
    node: (
      <MetricCard
        icon={FaCalendarCheck}
        value={data.doctor.todayAppointments.value}
        label={data.doctor.todayAppointments.label}
      />
    ),
  },
  {
    id: "doctor-alert",
    size: "sm",
    node: (
      <MetricCard
        icon={FaTriangleExclamation}
        label={data.doctor.alert.label}
        trend={data.doctor.alert.sub}
        status="alert"
      />
    ),
  },
  {
    id: "doctor-new-reports",
    size: "sm",
    node: (
      <MetricCard icon={FaFileLines} value={data.doctor.newReports.value} label={data.doctor.newReports.label} />
    ),
  },
  {
    id: "patient-exercises-assigned",
    size: "sm",
    node: (
      <MetricCard
        icon={FaListCheck}
        value={data.patient.exercisesAssigned.value}
        label={data.patient.exercisesAssigned.label}
        status="success"
      />
    ),
  },
];

/**
 * Composes real, shared dashboard cards (the same components the Doctor
 * and Patient dashboards render) into an organic, floating-widget preview
 * for the public Hero. Supplies only static local preview data — no auth,
 * no API calls, no navigation. Interactive elements render with
 * `previewMode` so they stay focusable/keyboard-accessible but perform no
 * real action.
 *
 * Card *count* is responsive (ultra-wide down to a single mobile card);
 * layout stays CSS Grid the whole way — only how many pool items are
 * sliced in changes.
 */
const HeroDashboardPreview = () => {
  const { t } = useTranslation();
  const tier = useViewportTier();
  const data = useMemo(() => getHeroPreviewData(t), [t]);
  const pool = useMemo(() => buildPool(data), [data]);

  // Mobile shows exactly one card, chosen once at random on mount (not on
  // every resize) — no slider, no carousel, no autoplay.
  const [mobilePick] = useState(() => Math.floor(Math.random() * pool.length));

  const visible =
    tier.name === "mobile" ? [pool[mobilePick]] : pool.slice(0, tier.cardCount);

  return (
    <div className="hero-dashboard-preview-root">
      {visible.map((item, index) => (
        <motion.div
          key={item.id}
          className={`hero-dashboard-preview-item hero-dashboard-preview-item--${item.size}`}
          variants={cardEntrance}
          initial="hidden"
          animate="visible"
          custom={index * 0.05}
          whileHover={{ y: -4, transition: { duration: 0.2 } }}
        >
          {item.node}
        </motion.div>
      ))}
    </div>
  );
};

export default HeroDashboardPreview;
