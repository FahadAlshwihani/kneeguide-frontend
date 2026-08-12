import React from "react";
import { useTranslation } from "react-i18next";
import { LuBluetooth, LuBluetoothConnected, LuCheck } from "react-icons/lu";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";

/**
 * Devices tab — a second PRESENTATION of the exact same scan/connect
 * capability the KneeGuide Assistant's "How do I connect my device?"
 * action already uses (device/KneeGuideDeviceContext.jsx, mounted once in
 * PatientLayout.jsx). Every prop here is state/actions read straight from
 * `useKneeGuideDevice()` by the parent page — this component owns no
 * device state of its own and starts no second scan timer (Section 12).
 *
 * VISUAL REFINEMENT (state-consistency pass): all non-empty states now
 * render through the SAME `DeviceRow` markup/CSS (`.pfl-device-row`) —
 * disconnected/scanning use the centered empty-state block, but
 * discovered/connecting/connected all share one row geometry (icon
 * position, name position, metadata position, action column) instead of
 * three differently-shaped containers. `.pfl-device-panel` gives the
 * surrounding card a stable min-height so switching between these states
 * updates content in place rather than resizing the whole tab.
 */
const DeviceRow = ({ device, isConnected, isConnecting, connectDisabled, onConnect, onDisconnect, t }) => (
  <li className={`pfl-device-row${isConnected ? " pfl-device-row--connected" : ""}`}>
    <span className="pfl-device-row-icon" aria-hidden="true">
      {isConnected ? <LuBluetoothConnected /> : <LuBluetooth />}
    </span>

    <div className="pfl-device-row-body">
      <p className="pfl-device-row-name" dir="auto">
        {device.name}
      </p>
      {isConnected && <p className="pfl-device-row-meta">{t("patientProfile.devices.primarySensor")}</p>}
      <p className="pfl-device-row-signal" dir="ltr">
        {t("patientProfile.devices.signal", { value: device.signal })}
      </p>
    </div>

    <div className="pfl-device-row-action">
      {isConnected ? (
        <>
          <span className="pfl-status-pill pfl-status-pill--positive">
            <LuCheck aria-hidden="true" />
            {t("patientProfile.devices.connected")}
          </span>
          <PatientButton type="button" variant="outline" size="sm" onClick={onDisconnect}>
            {t("patientProfile.devices.disconnect")}
          </PatientButton>
        </>
      ) : (
        <PatientButton
          type="button"
          variant="secondary"
          size="sm"
          loading={isConnecting}
          disabled={connectDisabled}
          onClick={onConnect}
        >
          {isConnecting ? t("patientProfile.devices.connecting") : t("patientProfile.devices.connect")}
        </PatientButton>
      )}
    </div>
  </li>
);

const ProfileDevicesTab = ({ scanning, devices, connectingDeviceId, connectedDevice, scanForDevices, connectToDevice, disconnectDevice, insight }) => {
  const { t } = useTranslation();
  const isConnecting = Boolean(connectingDeviceId);

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-devices-heading">
        <h2 id="pfl-devices-heading" className="pfl-card-title">
          {t("patientProfile.devices.title")}
        </h2>
        <p className="pfl-card-subtext">{t("patientProfile.devices.subtitle")}</p>

        <div className="pfl-device-panel">
          {connectedDevice && (
            <ul className="pfl-device-rows">
              <DeviceRow device={connectedDevice} isConnected onDisconnect={disconnectDevice} t={t} />
            </ul>
          )}

          {!connectedDevice && !scanning && devices.length === 0 && (
            <div className="pfl-device-empty-state">
              <div className="pfl-device-empty-icon" aria-hidden="true">
                <LuBluetooth />
              </div>
              <p className="pfl-device-empty-title">{t("patientProfile.devices.emptyTitle")}</p>
              <p className="pfl-device-empty-copy">{t("patientProfile.devices.emptyCopy")}</p>
              <PatientButton type="button" variant="primary" onClick={scanForDevices}>
                {t("patientProfile.devices.scan")}
              </PatientButton>
            </div>
          )}

          {!connectedDevice && scanning && (
            <div className="pfl-device-empty-state" role="status">
              <div className="pfl-device-empty-icon" aria-hidden="true">
                <LuBluetooth />
              </div>
              <p className="pfl-device-empty-title">{t("patientProfile.devices.scanning")}</p>
              <span className="pfl-device-spinner" aria-hidden="true" />
            </div>
          )}

          {!connectedDevice && !scanning && devices.length > 0 && (
            <ul className="pfl-device-rows">
              {devices.map((device) => (
                <DeviceRow
                  key={device.id}
                  device={device}
                  isConnected={false}
                  isConnecting={connectingDeviceId === device.id}
                  connectDisabled={isConnecting}
                  onConnect={() => connectToDevice(device)}
                  t={t}
                />
              ))}
            </ul>
          )}
        </div>
      </section>

      {insight && (
        <KneeGuideInsightCard title={t("patientProfile.insight.title")} message={t(insight.messageKey, insight.values)} tone={insight.tone} />
      )}
    </div>
  );
};

export default ProfileDevicesTab;
