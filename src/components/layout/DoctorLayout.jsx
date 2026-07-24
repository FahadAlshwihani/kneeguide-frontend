import React from "react";
import DoctorSidebar from "./DoctorSidebar";
import "../../styles/DoctorLayout.css";

const DoctorLayout = ({ active, children }) => {
  return (
    <div className="doctor-layout">
      <DoctorSidebar active={active} />

      <div className="doctor-content">
        {children}
      </div>
    </div>
  );
};

export default DoctorLayout;
