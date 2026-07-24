import React from "react";

const MainLayout = ({ children }) => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ممكن نضيف هيدر هنا لاحقاً */}
      <header
        style={{
          padding: "10px 20px",
          backgroundColor: "#6A0018",
          color: "#fff",
          fontWeight: 600,
        }}
      >
        KneeGuide
      </header>

      <main style={{ flex: 1, padding: "20px" }}>{children}</main>

      {/* فوتِر بسيط */}
      <footer
        style={{
          padding: "10px 20px",
          textAlign: "center",
          fontSize: "0.8rem",
          color: "#777",
          backgroundColor: "#fff",
          borderTop: "1px solid #ddd",
        }}
      >
        © {new Date().getFullYear()} KneeGuide
      </footer>
    </div>
  );
};

export default MainLayout;
