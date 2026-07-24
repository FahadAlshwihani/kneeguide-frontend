import React from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "../context/AuthContext";
import { useTranslation } from "react-i18next";

import AppRoutes from "./AppRoutes";

import "../i18n"; // <<< IMPORTANT
import { applyDirection } from "../utils/dir";

applyDirection();

const App = () => {
  const { i18n } = useTranslation();

  return (
    <BrowserRouter>
      <AuthProvider>
        {/* Apply RTL or LTR globally */}
        <div dir={i18n.language === "ar" ? "rtl" : "ltr"}>
          <AppRoutes />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
