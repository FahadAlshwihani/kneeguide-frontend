// src/pages/PatientProfile.jsx
import React from "react";
import { useSearchParams } from "react-router-dom";
import "../styles/PatientProfile.css";
import LanguageDropdown from "../../../../components/common/LanguageDropdown"; // ← تمت إضافته
import { useKneeGuideDevice } from "../device/KneeGuideDeviceContext";

// The set of tabs this page actually renders — also the allowlist an
// incoming `?tab=` deep link is checked against (see below); anything
// else (missing, mistyped, stale) safely falls back to "overview"
// instead of rendering a blank/broken tab.
const PROFILE_TABS = ["overview", "medical", "rehab", "settings", "security", "devices"];

const PatientProfile = () => {
  // Tab selection lives in the URL (`?tab=devices`), not local-only
  // React state — this is what makes the KneeGuide Assistant's "Open
  // Devices settings" action land directly on the Devices tab, and makes
  // that landing survive a refresh/back/forward instead of resetting to
  // Overview. "overview" itself is never written to the URL (falls
  // through as the default), so the plain /patient/profile URL stays
  // clean.
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const tab = PROFILE_TABS.includes(requestedTab) ? requestedTab : "overview";

  const setTab = (nextTab) => {
    setSearchParams(nextTab === "overview" ? {} : { tab: nextTab });
  };

  // Device state/logic is NOT owned here — this is the same shared
  // scan/connect capability the KneeGuide Assistant's "How do I connect
  // my device?" action uses (see device/KneeGuideDeviceContext.jsx,
  // mounted once in PatientLayout.jsx). Profile and the Assistant are two
  // interfaces into one device capability, never two copies of it.
  const { scanning, devices, connectingDeviceId, connectedDevice, scanForDevices, connectToDevice, disconnectDevice } =
    useKneeGuideDevice();

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
                      onClick={disconnectDevice}
                    >
                      Disconnect
                    </button>
                  </div>
                )}

                {!connectedDevice && (
                  <button
                    className="pdvc-btn-main"
                    onClick={scanForDevices}
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
                          disabled={connectingDeviceId === d.id}
                        >
                          {connectingDeviceId === d.id ? "Connecting..." : "Connect"}
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
