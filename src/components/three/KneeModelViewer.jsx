// src/components/visual/KneeModelViewer.jsx
import React, { useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import "../visual/KneeModelViewer.css";
import { useTranslation } from "react-i18next";

// 🔹 تمرينات + مدى الحركة (بالدرجات)
const EXERCISES = {
  heelSlides: {
    key: "heelSlides",
    label: "Heel Slides",
    min: 0,
    max: 95,
  },
  quadSets: {
    key: "quadSets",
    label: "Quad Sets",
    min: 0,
    max: 20,
  },
  straightLegRaise: {
    key: "straightLegRaise",
    label: "Straight Leg Raises",
    min: 0,
    max: 60,
  },
};

// 🔹 نموذج الركبة المبسّط (عظمي + أربطة)
const KneeJoint = ({ flexAngleDeg }) => {
  const tibiaGroup = useRef();

  const flexRad = THREE.MathUtils.degToRad(flexAngleDeg);

  if (tibiaGroup.current) {
    tibiaGroup.current.rotation.x = -flexRad;
  }

  return (
    <group>
      {/* Femur - عظمة الفخذ */}
      <group position={[0, 0.6, 0]}>
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[0.16, 0.16, 1.1, 24]} />
          <meshStandardMaterial color="#f5e7da" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Condyles - اللقمتان */}
        <mesh position={[0, -0.6, 0]}>
          <sphereGeometry args={[0.18, 24, 24]} />
          <meshStandardMaterial color="#f5e7da" roughness={0.35} metalness={0.1} />
        </mesh>
      </group>

      {/* Tibia + Fibula + Patella تتحرك كوحدة */}
      <group ref={tibiaGroup} position={[0, -0.1, 0]}>
        <mesh position={[0, -0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.13, 0.13, 1.0, 24]} />
          <meshStandardMaterial color="#f5e7da" roughness={0.35} metalness={0.1} />
        </mesh>

        {/* Fibula - الشظية */}
        <mesh position={[0.22, -0.6, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.05, 0.05, 0.8, 20]} />
          <meshStandardMaterial color="#e6d4c4" roughness={0.4} />
        </mesh>

        {/* Patella - الرضفة */}
        <mesh position={[0, 0.05, 0.18]} castShadow>
          <sphereGeometry args={[0.09, 24, 24]} />
          <meshStandardMaterial color="#f2d7c4" roughness={0.35} metalness={0.05} />
        </mesh>

        {/* Ligaments - أربطة مبسّطة */}
        <mesh position={[0, 0.0, 0.05]} rotation={[Math.PI / 2.5, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.45, 16]} />
          <meshStandardMaterial color="#f9b4b4" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.05, -0.02]} rotation={[Math.PI / 2.2, 0, 0]}>
          <cylinderGeometry args={[0.028, 0.028, 0.4, 16]} />
          <meshStandardMaterial color="#f9b4b4" roughness={0.6} />
        </mesh>
      </group>

      {/* قاعدة */}
      <mesh position={[0, -1.3, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[1.2, 40]} />
        <meshStandardMaterial color="#111827" roughness={0.9} metalness={0.1} />
      </mesh>
    </group>
  );
};

// 🔹 المشهد
const KneeScene = ({ exerciseConfig, onAngleChange }) => {
  const angleRef = useRef((exerciseConfig.min + exerciseConfig.max) / 2);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const normalized = (Math.sin(t * 0.7) + 1) / 2;
    const flex = exerciseConfig.min + normalized * (exerciseConfig.max - exerciseConfig.min);

    angleRef.current = flex;
    onAngleChange && onAngleChange(flex);
  });

  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[2, 3, 4]} intensity={0.9} castShadow />
      <directionalLight position={[-3, 2, -2]} intensity={0.4} />

      <KneeJoint flexAngleDeg={angleRef.current} />

      <OrbitControls
        enablePan={false}
        enableZoom={true}
        minDistance={2}
        maxDistance={5}
        target={[0, -0.1, 0]}
      />
    </>
  );
};

const KneeModelViewer = ({ activeExerciseKey = "heelSlides", onClick }) => {
  const { t } = useTranslation();

  const exerciseConfig = EXERCISES[activeExerciseKey] || EXERCISES.heelSlides;

  const [currentAngle, setCurrentAngle] = useState(
    (exerciseConfig.min + exerciseConfig.max) / 2
  );

  return (
    <div className="knee-3d-wrapper" onClick={onClick}>
      <div className="knee-3d-header">
        <span className="knee-3d-title">{t("kneeModel.title")}</span>

        <span className="knee-3d-chip">
          {t(`kneeModel.exercises.${exerciseConfig.key}`)} ·
          {exerciseConfig.min}°–{exerciseConfig.max}°
        </span>
      </div>

      <div className="knee-3d-canvas-box">
        <Canvas camera={{ position: [2.6, 1.4, 2.6], fov: 40 }} shadows>
          <KneeScene
            exerciseConfig={exerciseConfig}
            onAngleChange={(a) => setCurrentAngle(a)}
          />
        </Canvas>

        <div className="knee-3d-angle-overlay">
          <span className="knee-3d-angle-label">
            {t("kneeModel.currentFlexion")}
          </span>

          <span className="knee-3d-angle-value">
            {Math.round(currentAngle)}°
          </span>
        </div>
      </div>

      <p className="knee-3d-footer">
        {t("kneeModel.footerNote")}
      </p>
    </div>
  );
};

export default KneeModelViewer;
