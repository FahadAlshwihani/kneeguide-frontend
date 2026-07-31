import React from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES } from "../utils/routes";

import PublicRoutes from "../routes/PublicRoutes";
import DashboardRoutes from "../routes/DashboardRoutes";

import NotFound from "../features/public/pages/NotFound";

const AppRoutes = () => {
  return (
    <Routes>
      {PublicRoutes}
      {DashboardRoutes}

      <Route path={ROUTES.NOT_FOUND} element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
