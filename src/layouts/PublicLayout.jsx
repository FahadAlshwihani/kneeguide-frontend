import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/public/Header/Header";
import Footer from "../components/public/Footer/Footer";

const PublicLayout = () => {
  return (
    <>
      <Header />
      <Outlet />
      <Footer />
    </>
  );
};

export default PublicLayout;
