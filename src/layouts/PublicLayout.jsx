import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../features/public/components/Header";
import Footer from "../features/public/components/Footer";

const PublicLayout = () => {
  return (
    <div className="public-root">
      <Header />
      <Outlet />
      <Footer />
    </div>
  );
};

export default PublicLayout;
