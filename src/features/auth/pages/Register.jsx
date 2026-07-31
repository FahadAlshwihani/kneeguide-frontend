import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Stepper, { Step } from "../../../components/ui/Stepper";
import "../styles/Register.css";
import { registerUser, checkEmail } from "../../../api/auth";
import Loader from "../../../components/common/Loader";
import { useTranslation } from "react-i18next";
import i18n from "../../../i18n";

// Language Dropdown
import LanguageDropdown from "../../../components/common/LanguageDropdown";

const Register = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(null);
  const [emailExists, setEmailExists] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });

    if (e.target.name === "email") {
      setEmailExists(false);
    }
  };

  // ==========================================
  // STEP VALIDATION
  // ==========================================
  const validateStep = async (step) => {
    setError("");

    switch (step) {
      case 1:
        if (!role) {
          setError(t("register.errors.selectRole"));
          return false;
        }
        return true;

      case 2:
        if (!form.first_name || !form.last_name) {
          setError(t("register.errors.fullName"));
          return false;
        }
        return true;

      case 3:
        if (!form.email || !form.phone || !form.dob) {
          setError(t("register.errors.contactRequired"));
          return false;
        }

        try {
          const emailCheck = await checkEmail(form.email);
          if (emailCheck.exists) {
            setEmailExists(true);
            setError(t("register.errors.emailExists"));
            return false;
          }
        } catch (e) {}

        return true;

      case 4:
        if (!form.password || !form.confirmPassword) {
          setError(t("register.errors.passwordRequired"));
          return false;
        }

        if (form.password !== form.confirmPassword) {
          setError(t("register.errors.passwordMismatch"));
          return false;
        }

        const strongPassword =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*\W).{8,}$/;

        if (!strongPassword.test(form.password)) {
          setError(t("register.errors.passwordWeak"));
          return false;
        }

        return true;

      default:
        return true;
    }
  };

  // ==========================================
  // FINAL SUBMIT
  // ==========================================
  const handleFinalSubmit = async () => {
    setError("");
    setLoading(true);

    const payload = { ...form, role };

    try {
      const res = await registerUser(payload);

      if (res?.message === "OTP sent to email") {
        navigate(`/auth/verify-otp?email=${form.email}`);
      }
    } catch (err) {
      setLoading(false);
      setError(t("register.errors.genericFail"));
    }
  };

  // ==========================================
  // RTL / LTR handling
  // ==========================================
  useEffect(() => {
    document.documentElement.dir = i18n.language === "ar" ? "rtl" : "ltr";
    document.body.classList.remove("rtl", "ltr");
    document.body.classList.add(i18n.language === "ar" ? "rtl" : "ltr");
  }, [i18n.language]);

  return (
    <div
      className="register-page"
      dir={i18n.language === "ar" ? "rtl" : "ltr"}
    >
      {/* GLOBAL LANGUAGE DROPDOWN */}
      <LanguageDropdown />

      {loading && <Loader message={t("register.loader")} />}

      <div className="register-wrapper">

        {/* ALWAYS CENTERED */}
        <h2 className="register-title text-center-permanent">
          {t("register.title")}
        </h2>

        {error && (
          <div className="register-error text-center-permanent">{error}</div>
        )}

        <div className="register-stepper-box">
          <Stepper
            initialStep={1}
            validateStep={validateStep}
            onFinalStepCompleted={handleFinalSubmit}
          >
            {/* STEP 1 */}
            <Step>
              <h3 className="step-title text-center-permanent">
                {t("register.step1Title")}
              </h3>

              <div className="role-picker">
                <div
                  className={`role-card ${
                    role === "patient" ? "selected" : ""
                  }`}
                  onClick={() => setRole("patient")}
                >
                  <span className="emoji">🧑</span>
                  <h4>{t("register.rolePatient")}</h4>
                  <p>{t("register.rolePatientDesc")}</p>
                </div>

                <div
                  className={`role-card ${
                    role === "doctor" ? "selected" : ""
                  }`}
                  onClick={() => setRole("doctor")}
                >
                  <span className="emoji">🩺</span>
                  <h4>{t("register.roleDoctor")}</h4>
                  <p>{t("register.roleDoctorDesc")}</p>
                </div>
              </div>
            </Step>

            {/* STEP 2 */}
            <Step>
              <h3 className="step-title text-center-permanent">
                {t("register.step2Title")}
              </h3>

              <div className="form-two-column">
                <div className="form-group">
                  <label>{t("register.labels.firstName")}</label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder={t("register.placeholders.firstName")}
                  />
                </div>

                <div className="form-group">
                  <label>{t("register.labels.lastName")}</label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder={t("register.placeholders.lastName")}
                  />
                </div>
              </div>
            </Step>

            {/* STEP 3 */}
            <Step>
              <h3 className="step-title text-center-permanent">
                {t("register.step3Title")}
              </h3>

              <div className="form-group">
                <label>{t("register.labels.email")}</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder={t("register.placeholders.email")}
                />
              </div>

              {emailExists && (
                <div className="email-warning text-center-permanent">
                  {t("register.emailExists")}
                  <br />
                  <span
                    className="go-login"
                    onClick={() => navigate("/login")}
                  >
                    {t("register.goToLogin")}
                  </span>
                </div>
              )}

              <div className="form-group">
                <label>{t("register.labels.phone")}</label>
                <input
                  type="text"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder={t("register.placeholders.phone")}
                />
              </div>

              <div className="form-group">
                <label>{t("register.labels.dob")}</label>
                <input
                  type="date"
                  name="dob"
                  value={form.dob}
                  onChange={handleChange}
                />
              </div>
            </Step>

            {/* STEP 4 */}
            <Step>
              <h3 className="step-title text-center-permanent">
                {t("register.step4Title")}
              </h3>

              <div className="form-group">
                <label>{t("register.labels.password")}</label>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>

              <p className="password-hint">
                {t("register.passwordHintTitle")}
                <br />• {t("register.passwordHintUpper")}
                <br />• {t("register.passwordHintLower")}
                <br />• {t("register.passwordHintNumber")}
                <br />• {t("register.passwordHintSymbol")}
                <br />• {t("register.passwordHintLength")}
              </p>

              {error && error.toLowerCase().includes("password") && (
                <div className="password-warning text-center-permanent">
                  {error}
                </div>
              )}

              <div className="form-group">
                <label>{t("register.labels.confirmPassword")}</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </Step>

            {/* STEP 5 */}
            <Step>
              <h3 className="step-title text-center-permanent">
                {t("register.step5Title")}
              </h3>

              <div className="review-box">
                <p>
                  <strong>{t("register.review.role")}:</strong> {role}
                </p>
                <p>
                  <strong>{t("register.review.name")}:</strong>{" "}
                  {form.first_name} {form.last_name}
                </p>
                <p>
                  <strong>{t("register.review.email")}:</strong> {form.email}
                </p>
                <p>
                  <strong>{t("register.review.phone")}:</strong> {form.phone}
                </p>
                <p>
                  <strong>{t("register.review.dob")}:</strong> {form.dob}
                </p>
              </div>
            </Step>
          </Stepper>
        </div>
      </div>
    </div>
  );
};

export default Register;
