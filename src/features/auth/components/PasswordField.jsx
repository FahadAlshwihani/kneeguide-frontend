import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { LuEye, LuEyeOff } from "react-icons/lu";

/**
 * The same password show/hide field Login already used, extracted so
 * Register's password/confirm-password steps get identical behavior
 * without duplicating the toggle logic — visibility is genuinely
 * per-field state (each instance owns its own useState), so two of these
 * on one step (password + confirm) never interfere with each other.
 * Visual styling comes from AuthForm.css's shared .auth-* classes, not a
 * stylesheet of its own — Login/Register already share that file.
 */
const PasswordField = ({
  id,
  name,
  label,
  value,
  onChange,
  autoComplete = "current-password",
  disabled = false,
  error = false,
  errorId,
  required = true,
}) => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">
        {label}
      </label>
      <div className="auth-password-wrap">
        <input
          id={id}
          name={name}
          type={visible ? "text" : "password"}
          className="auth-input"
          autoComplete={autoComplete}
          placeholder="••••••••"
          value={value}
          onChange={onChange}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={error && errorId ? errorId : undefined}
          required={required}
        />
        <button
          type="button"
          className="auth-password-toggle"
          onClick={() => setVisible((prev) => !prev)}
          disabled={disabled}
          aria-label={t(visible ? "login.hidePassword" : "login.showPassword")}
        >
          {visible ? <LuEyeOff aria-hidden="true" /> : <LuEye aria-hidden="true" />}
        </button>
      </div>
    </div>
  );
};

export default PasswordField;
