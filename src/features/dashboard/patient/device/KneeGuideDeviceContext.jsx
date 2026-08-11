import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

/**
 * The ONE source of truth for the KneeGuide sensor device capability —
 * scan / scanning state / discovered devices / connect / connecting state
 * / connected device. Both Patient Profile ("Devices" tab) and the
 * KneeGuide Assistant ("How do I connect my device?") consume this same
 * hook; neither owns its own copy of the scan/connect logic or the mock
 * device list. See PatientProfile.jsx and PatientHomeAssistant.jsx for
 * the two consumers.
 *
 * MOCK, NOT REAL WEB BLUETOOTH — audited before writing this: the
 * previous implementation (inline in PatientProfile.jsx) never called
 * `navigator.bluetooth` anywhere; "scanning" was a 1.5s `setTimeout`
 * resolving to a hardcoded device list, and "connecting" was a 1.2s
 * `setTimeout` resolving to whichever device was clicked. This file
 * preserves that exact mock behavior (same delays, same device list,
 * same always-succeeds outcome) — it only CENTRALIZES it into one shared
 * place instead of duplicating it. It does not add a `navigator.bluetooth`
 * capability check, since pretending to gate on real browser Bluetooth
 * support around a mock implementation would be dishonest, not defensive.
 * A real Web Bluetooth integration later would replace the internals of
 * `scanForDevices`/`connectToDevice` below without either consumer
 * changing how they call this hook.
 *
 * Mounted once, in PatientLayout.jsx (the shared Patient shell that
 * already persists across Home/Exercises/Reports/Profile navigation —
 * same precedent as PatientDock) — so Profile and the Assistant read the
 * exact same React state instance within a session, never two
 * independent copies that could contradict each other. This is
 * intentionally plain React Context + useState, not a new global store
 * library — the lightest option that actually satisfies "shared within a
 * session," matching the project's existing AuthContext precedent.
 */

const MOCK_DEVICES = [
  { id: 1, name: "KneeGuide-Sensor-01", signal: -55 },
  { id: 2, name: "RehabTracker v2", signal: -61 },
];

const SCAN_DELAY_MS = 1500;
const CONNECT_DELAY_MS = 1200;

const KneeGuideDeviceContext = createContext(null);

export const KneeGuideDeviceProvider = ({ children }) => {
  const [scanning, setScanning] = useState(false);
  const [devices, setDevices] = useState([]);
  const [connectingDeviceId, setConnectingDeviceId] = useState(null);
  const [connectedDevice, setConnectedDevice] = useState(null);

  const scanTimeoutRef = useRef(null);
  const connectTimeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    },
    []
  );

  // Guards against a double-click/duplicate request firing a second scan
  // while one is already in flight, or scanning again once a device is
  // already connected (nothing to look for at that point — Disconnect
  // first, same as the previous Profile-only behavior implied by hiding
  // the Scan button while connected).
  const scanForDevices = useCallback(() => {
    if (scanning || connectedDevice) return;
    setScanning(true);
    setDevices([]);
    scanTimeoutRef.current = setTimeout(() => {
      setScanning(false);
      setDevices(MOCK_DEVICES);
    }, SCAN_DELAY_MS);
  }, [scanning, connectedDevice]);

  const connectToDevice = useCallback(
    (device) => {
      if (connectingDeviceId || connectedDevice) return;
      setConnectingDeviceId(device.id);
      connectTimeoutRef.current = setTimeout(() => {
        setConnectingDeviceId(null);
        setConnectedDevice(device);
        setDevices([]);
      }, CONNECT_DELAY_MS);
    },
    [connectingDeviceId, connectedDevice]
  );

  const disconnectDevice = useCallback(() => {
    setConnectedDevice(null);
  }, []);

  const value = {
    scanning,
    devices,
    connectingDeviceId,
    connectedDevice,
    scanForDevices,
    connectToDevice,
    disconnectDevice,
  };

  return <KneeGuideDeviceContext.Provider value={value}>{children}</KneeGuideDeviceContext.Provider>;
};

export const useKneeGuideDevice = () => {
  const context = useContext(KneeGuideDeviceContext);
  if (!context) {
    throw new Error("useKneeGuideDevice must be used within a KneeGuideDeviceProvider");
  }
  return context;
};
