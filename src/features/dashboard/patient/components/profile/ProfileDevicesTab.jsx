import React from "react";
import { useTranslation } from "react-i18next";
import { LuBluetooth, LuBluetoothConnected } from "react-icons/lu";
import KneeGuideInsightCard from "../exercises/KneeGuideInsightCard";
import PatientButton from "../PatientButton";

/**
 * Devices tab — a second PRESENTATION of the exact same scan/connect
 * capability the KneeGuide Assistant's "How do I connect my device?"
 * action already uses (device/KneeGuideDeviceContext.jsx, mounted once in
 * PatientLayout.jsx). Every prop here is state/actions read straight from
 * `useKneeGuideDevice()` by the parent page — this component owns no
 * device state of its own and starts no second scan timer (Section 12).
 */
const ProfileDevicesTab = ({ scanning, devices, connectingDeviceId, connectedDevice, scanForDevices, connectToDevice, disconnectDevice, insight }) => {
  const { t } = useTranslation();

  return (
    <div className="pfl-tab-panel">
      <section className="pfl-card" aria-labelledby="pfl-devices-heading">
        <h2 id="pfl-devices-heading" className="pfl-card-title">
          {t("patientProfile.devices.title")}
        </h2>
        <p className="pfl-card-subtext">{t("patientProfile.devices.subtitle")}</p>

        {connectedDevice ? (
          <div className="pfl-device-connected">
            <div className="pfl-device-connected-icon" aria-hidden="true">
              <LuBluetoothConnected />
            </div>
            <div className="pfl-device-connected-body">
              <p className="pfl-device-connected-name">{connectedDevice.name}</p>
              <span className="pfl-status-pill pfl-status-pill--positive">{t("patientProfile.devices.connected")}</span>
            </div>
            <PatientButton type="button" variant="outline" size="sm" onClick={disconnectDevice}>
              {t("patientProfile.devices.disconnect")}
            </PatientButton>
          </div>
        ) : (
          <div className="pfl-device-empty">
            {!scanning && devices.length === 0 && (
              <>
                <div className="pfl-device-empty-icon" aria-hidden="true">
                  <LuBluetooth />
                </div>
                <p className="pfl-device-empty-title">{t("patientProfile.devices.emptyTitle")}</p>
                <p className="pfl-device-empty-copy">{t("patientProfile.devices.emptyCopy")}</p>
                <PatientButton type="button" variant="primary" onClick={scanForDevices}>
                  {t("patientProfile.devices.scan")}
                </PatientButton>
              </>
            )}

            {scanning && (
              <div className="pfl-device-scanning" role="status">
                <span className="pfl-device-spinner" aria-hidden="true" />
                <p>{t("patientProfile.devices.scanning")}</p>
              </div>
            )}

            {!scanning && devices.length > 0 && (
              <ul className="pfl-device-list">
                {devices.map((device) => (
                  <li key={device.id} className="pfl-device-row">
                    <div>
                      <p className="pfl-device-name">{device.name}</p>
                      <p className="pfl-device-signal" dir="ltr">
                        {t("patientProfile.devices.signal", { value: device.signal })}
                      </p>
                    </div>
                    <PatientButton
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={() => connectToDevice(device)}
                      disabled={connectingDeviceId === device.id}
                    >
                      {connectingDeviceId === device.id ? t("patientProfile.devices.connecting") : t("patientProfile.devices.connect")}
                    </PatientButton>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>

      {insight && (
        <KneeGuideInsightCard title={t("patientProfile.insight.title")} message={t(insight.messageKey, insight.values)} tone={insight.tone} />
      )}
    </div>
  );
};

export default ProfileDevicesTab;
