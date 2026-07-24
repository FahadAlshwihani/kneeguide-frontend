import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import "../styles/Login.css";
import PrimaryButton from "../components/ui/PrimaryButton";
import Loader from "../components/common/Loader";

import { useTranslation } from "react-i18next";

// Global Language Dropdown
import LanguageDropdown from "../components/common/LanguageDropdown";

const Login = () => {
    const { t } = useTranslation();
    const { login } = useAuth();
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({
            ...form,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");

        if (!form.email || !form.password) {
            return setError(t("login.error_required"));
        }

        try {
            setLoading(true);
            const user = await login(form.email, form.password);

            if (user.role === "doctor") {
                navigate("/doctor/dashboard");
            } else {
                navigate("/patient/dashboard");
            }

        } catch (err) {
            setLoading(false);
            setError(t("login.error_invalid"));
        }
    };

    return (
        <div className="login-page">

            {/* 🌍 Global Language Dropdown */}
            <LanguageDropdown />

            {loading && <Loader message={t("login.loading")} />}

            <form className="login-box" onSubmit={handleSubmit}>

                {/* ALWAYS CENTERED */}
                <h2 className="text-center-permanent">{t("login.title")}</h2>

                <p className="subtitle text-center-permanent">
                    {t("login.subtitle")}
                </p>

                {error && <div className="login-error">{error}</div>}

                {/* Email */}
                <div className="form-group">
                    <label>{t("login.email")}</label>
                    <input
                        type="email"
                        name="email"
                        placeholder={t("login.email_placeholder")}
                        value={form.email}
                        onChange={handleChange}
                    />
                </div>

                {/* Password */}
                <div className="form-group">
                    <label>{t("login.password")}</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="••••••••"
                        value={form.password}
                        onChange={handleChange}
                    />
                </div>

                {/* Button */}
                <PrimaryButton type="submit" disabled={loading} className="btn-full">
                    {t("login.button")}
                </PrimaryButton>

                {/* ALWAYS CENTERED */}
                <div className="login-extra text-center-permanent">
                    <p>
                        {t("login.no_account")}{" "}
                        <span className="signup-link" onClick={() => navigate("/register")}>
                            {t("login.signup")}
                        </span>
                    </p>
                </div>

            </form>
        </div>
    );
};

export default Login;
