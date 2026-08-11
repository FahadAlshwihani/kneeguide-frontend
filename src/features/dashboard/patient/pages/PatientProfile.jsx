// src/pages/PatientProfile.jsx
import React, { useState } from "react";
import "../styles/PatientProfile.css";
import LanguageDropdown from "../../../../components/common/LanguageDropdown"; // ← تمت إضافته

const PatientProfile = () => {
  const [tab, setTab] = useState("overview");

  // Device state
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectedDevice, setConnectedDevice] = useState(null);

  const mockDevices = [
    { id: 1, name: "KneeGuide-Sensor-01", signal: -55 },
    { id: 2, name: "RehabTracker v2", signal: -61 },
  ];

  const startScan = () => {
    setScanning(true);
    setDevices([]);

    setTimeout(() => {
      setScanning(false);
      setDevices(mockDevices);
    }, 1500);
  };

  const connectToDevice = (device) => {
    setConnectedDevice(null);

    setTimeout(() => {
      setConnectedDevice(device);
    }, 1200);
  };

  // MOCK DATA
  const user = {
    first_name: "Ahmed",
    last_name: "Ali",
    age: 32,
    height: 178,
    weight: 82,
    goal: "Improve ROM & strength",
    surgery: "ACL Partial Tear",
    surgeryDate: "2025-09-10",
    rehabPhase: "Phase 2",
    email: "ahmed@example.com",
    phone: "0555555555",
    deviceLinked: false,
  };

  const avatarLetters = `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();

  return (
    <div className="pp-page">
      <div className="pp-inner">

        {/* HEADER */}
        <div className="pp-header">
          <div className="pp-avatar">{avatarLetters}</div>
          <div>
            <h1 className="pp-name">{user.first_name} {user.last_name}</h1>
            <p className="pp-sub">Patient Profile</p>
          </div>
        </div>

        {/* 🌐 LANGUAGE SWITCHER — أفضل مكان */}
        <div style={{ marginTop: "10px", marginBottom: "20px" }}>
          <LanguageDropdown />
        </div>

        {/* TABS */}
        <div className="pp-tabs">
          <button className={tab === "overview" ? "active" : ""} onClick={() => setTab("overview")}>Overview</button>
          <button className={tab === "medical" ? "active" : ""} onClick={() => setTab("medical")}>Medical Info</button>
          <button className={tab === "rehab" ? "active" : ""} onClick={() => setTab("rehab")}>Rehab Program</button>
          <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>Settings</button>
          <button className={tab === "security" ? "active" : ""} onClick={() => setTab("security")}>Security</button>
          <button className={tab === "devices" ? "active" : ""} onClick={() => setTab("devices")}>Devices</button>
        </div>

        {/* CONTENT */}
        <div className="pp-content">

          {/* ================= OVERVIEW ================= */}
          {tab === "overview" && (
            <div className="pp-card">
              <h2 className="pp-title">General Information</h2>

              <div className="pp-grid">
                <div><span>Age</span><p>{user.age}</p></div>
                <div><span>Height</span><p>{user.height} cm</p></div>
                <div><span>Weight</span><p>{user.weight} kg</p></div>
                <div><span>Goal</span><p>{user.goal}</p></div>
              </div>
            </div>
          )}

          {/* ================= MEDICAL INFO ================= */}
          {tab === "medical" && (
            <div className="pp-card">
              <h2 className="pp-title">Medical Information</h2>

              <div className="pp-grid">
                <div><span>Diagnosis</span><p>{user.surgery}</p></div>
                <div><span>Surgery Date</span><p>{user.surgeryDate}</p></div>
                <div><span>Rehab Phase</span><p>{user.rehabPhase}</p></div>
                <div><span>Doctor Notes</span><p>Continue ROM training, improving well.</p></div>
              </div>
            </div>
          )}

          {/* ================= REHAB PROGRAM ================= */}
          {tab === "rehab" && (
            <div className="pp-card">
              <h2 className="pp-title">Rehab Program</h2>

              <div className="pp-list">
                <div className="pp-row">
                  <span>Quad Sets</span>
                  <span className="pp-tag">3×12 daily</span>
                </div>
                <div className="pp-row">
                  <span>Straight Leg Raises</span>
                  <span className="pp-tag">3×10 daily</span>
                </div>
                <div className="pp-row">
                  <span>Heel Slides</span>
                  <span className="pp-tag">3×15 daily</span>
                </div>
              </div>
            </div>
          )}

          {/* ================= SETTINGS ================= */}
          {tab === "settings" && (
            <div className="pp-card">
              <h2 className="pp-title">Account Settings</h2>

              <div className="pp-list">
                <div className="pp-row">
                  <span>Email</span>
                  <p className="pp-value">{user.email}</p>
                </div>

                <div className="pp-row">
                  <span>Phone</span>
                  <p className="pp-value">{user.phone}</p>
                </div>

                <button className="pp-btn">Edit Information</button>
              </div>
            </div>
          )}

          {/* ================= SECURITY ================= */}
          {tab === "security" && (
            <div className="pp-card">
              <h2 className="pp-title">Security</h2>

              <div className="pp-list">
                <button className="pp-btn">Change Password</button>
                <button className="pp-btn danger">Logout</button>
              </div>
            </div>
          )}

          {/* ================= DEVICES ================= */}
          {tab === "devices" && (
            <div className="pp-card">
              <h2 className="pp-title">Knee Sensor Device</h2>
              <p className="pp-subtext">
                Connect your KneeGuide Bluetooth sensor to sync your movement data.
              </p>

              <div className="pdvc-section">

                {connectedDevice && (
                  <div className="pdvc-connected">
                    <h3>Device Connected</h3>
                    <p>{connectedDevice.name}</p>

                    <div className="pdvc-connected-chip">LIVE</div>

                    <button
                      className="pdvc-btn-outline"
                      onClick={() => setConnectedDevice(null)}
                    >
                      Disconnect
                    </button>
                  </div>
                )}

                {!connectedDevice && (
                  <button
                    className="pdvc-btn-main"
                    onClick={startScan}
                    disabled={scanning}
                  >
                    {scanning ? "Scanning..." : "Scan for Devices"}
                  </button>
                )}

                {scanning && (
                  <div className="pdvc-loading">
                    <div className="pdvc-spinner" />
                    <p>Searching for nearby devices...</p>
                  </div>
                )}

                {!scanning && !connectedDevice && devices.length > 0 && (
                  <div className="pdvc-device-list">
                    {devices.map((d) => (
                      <div key={d.id} className="pdvc-device-row">
                        <div>
                          <h3 className="pdvc-device-name">{d.name}</h3>
                          <p className="pdvc-signal">Signal: {d.signal} dBm</p>
                        </div>

                        <button
                          className="pdvc-connect-btn"
                          onClick={() => connectToDevice(d)}
                        >
                          Connect
                        </button>
                      </div>
                    ))}
                  </div>
                )}

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default PatientProfile;
