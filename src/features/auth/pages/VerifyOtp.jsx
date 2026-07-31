import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/VerifyOtp.css";

import { verifyOtp, resendOtp } from "../../../api/auth";
import Loader from "../../../components/common/Loader";
import PrimaryButton from "../../../components/ui/PrimaryButton";
import { useTranslation } from "react-i18next";

const VerifyOtp = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const email = new URLSearchParams(location.search).get("email");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputRefs = useRef([]);

  const [message, setMessage] = useState("");
  const [counter, setCounter] = useState(30);
  const [loading, setLoading] = useState(false);

  // Auto countdown
  useEffect(() => {
    let timer = null;
    if (counter > 0) {
      timer = setInterval(() => setCounter((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [counter]);

  // Update OTP
  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;

    const copy = [...otp];
    copy[index] = value;
    setOtp(copy);

    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Submit OTP
  const handleSubmit = async (e) => {
    e.preventDefault();

    const code = otp.join("");
    if (code.length !== 6) {
      return setMessage(t("verifyOtp.errors.codeRequired"));
    }

    setLoading(true);
    setMessage("");

    try {
      const res = await verifyOtp(email, code);

      if (res.message === "OTP verified") {
        setMessage(t("verifyOtp.success.verified"));
        setTimeout(() => navigate("/login"), 1500);
      }
    } catch {
      setMessage(t("verifyOtp.errors.invalid"));
    }

    setLoading(false);
  };

  // Resend OTP
  const handleResend = async () => {
    if (counter > 0) return;

    try {
      const res = await resendOtp(email);

      if (res.message === "OTP resent") {
        setMessage(t("verifyOtp.success.resent"));
        setCounter(30);
      }
    } catch {
      setMessage(t("verifyOtp.errors.failedResend"));
    }
  };

  return (
    <div className="otp-page">
      {loading && <Loader message={t("verifyOtp.loader")} />}

      <div className="otp-box">
        <h2>{t("verifyOtp.title")}</h2>
        <p className="otp-subtitle">{t("verifyOtp.subtitle")}</p>
        <p className="otp-email">{email}</p>

        {message && <div className="otp-message">{message}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-input-group">
            {otp.map((digit, i) => (
              <input
                key={i}
                type="text"
                maxLength="1"
                value={digit}
                ref={(el) => (inputRefs.current[i] = el)}
                onChange={(e) => handleOtpChange(e.target.value, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                className="otp-input"
              />
            ))}
          </div>

          <PrimaryButton className="btn-full" type="submit">
            {t("verifyOtp.buttons.verify")}
          </PrimaryButton>
        </form>

        <div className="otp-resend">
          {counter > 0 ? (
            <p>
              {t("verifyOtp.resend.in")} <strong>{counter}s</strong>
            </p>
          ) : (
            <button className="resend-btn" onClick={handleResend}>
              {t("verifyOtp.resend.button")}
            </button>
          )}
        </div>

        <p className="otp-back-login" onClick={() => navigate("/login")}>
          {t("verifyOtp.backToLogin")}
        </p>
      </div>
    </div>
  );
};

export default VerifyOtp;
