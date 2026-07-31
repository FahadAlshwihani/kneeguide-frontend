import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { useTranslation } from "react-i18next";
import { FaUsers, FaTriangleExclamation } from "react-icons/fa6";

import MetricCard from "../../../dashboard/shared/components/MetricCard";
import ProgressCard from "../../../dashboard/shared/components/ProgressCard";
import AppointmentCard from "../../../dashboard/shared/components/AppointmentCard";
import ExerciseCard from "../../../dashboard/shared/components/ExerciseCard";
import DashboardCard from "../../../dashboard/shared/components/DashboardCard";

import { getHeroPreviewData } from "./heroPreviewData";
import "./HeroDashboardPreview.css";

const cardEntrance = {
  hidden: { opacity: 0, y: 18, scale: 0.96 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, delay, ease: "easeOut" },
  }),
};

/**
 * Composes real, shared dashboard cards (the same components the Doctor
 * and Patient dashboards render) into a layered preview for the public
 * Hero. Supplies only static local preview data — no auth, no API calls,
 * no navigation. All action buttons render with `previewMode` so they are
 * focusable and keyboard-accessible but perform no real action.
 */
const HeroDashboardPreview = () => {
  const { t } = useTranslation();
  const prefersReducedMotion = useReducedMotion();
  const data = getHeroPreviewData(t);

  return (
    <motion.div
      className="hero-dashboard-preview-root"
      initial="hidden"
      animate="visible"
    >
      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-primary hero-dashboard-preview-primary-doctor"
        variants={cardEntrance}
        custom={0.1}
      >
        <span className="hero-dashboard-preview-tag">{data.doctor.badge}</span>
        <DashboardCard title={data.doctor.appointment.title} className="hero-dashboard-preview-card">
          <AppointmentCard {...data.doctor.appointment} previewMode />
        </DashboardCard>
      </motion.div>

      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-supporting hero-dashboard-preview-metric"
        variants={cardEntrance}
        custom={0.25}
        {...(!prefersReducedMotion && {
          animate: { y: [0, -6, 0] },
          transition: { duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1.2 },
        })}
      >
        <MetricCard icon={FaUsers} value={data.doctor.metric.value} label={data.doctor.metric.label} className="hero-dashboard-preview-card" />
      </motion.div>

      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-supporting hero-dashboard-preview-doctor-progress"
        variants={cardEntrance}
        custom={0.3}
      >
        <DashboardCard className="hero-dashboard-preview-card">
          <ProgressCard {...data.doctor.progress} />
        </DashboardCard>
      </motion.div>

      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-alert"
        variants={cardEntrance}
        custom={0.4}
      >
        <MetricCard
          icon={FaTriangleExclamation}
          label={data.doctor.alert.label}
          trend={data.doctor.alert.sub}
          status="alert"
          className="hero-dashboard-preview-card"
        />
      </motion.div>

      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-primary hero-dashboard-preview-primary-patient"
        variants={cardEntrance}
        custom={0.2}
      >
        <span className="hero-dashboard-preview-tag hero-dashboard-preview-tag-patient">{data.patient.badge}</span>
        <ExerciseCard {...data.patient.exercise} className="hero-dashboard-preview-card" previewMode />
      </motion.div>

      <motion.div
        className="hero-dashboard-preview-layer hero-dashboard-preview-supporting hero-dashboard-preview-patient-progress"
        variants={cardEntrance}
        custom={0.35}
      >
        <DashboardCard className="hero-dashboard-preview-card">
          <div className="progress-card-list">
            <ProgressCard {...data.patient.rom} />
            <ProgressCard {...data.patient.adherence} />
          </div>
        </DashboardCard>
      </motion.div>
    </motion.div>
  );
};

export default HeroDashboardPreview;
