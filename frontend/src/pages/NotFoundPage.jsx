import React from "react";
import { Link } from "react-router-dom";

const NotFoundPage = () => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        padding: "20px",
        textAlign: "center",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "40px",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
          maxWidth: "500px",
          width: "100%",
        }}
      >
        <div style={{ fontSize: "72px", marginBottom: "20px" }}></div>
        <h1
          style={{
            fontSize: "36px",
            color: "#333",
            marginBottom: "16px",
            fontWeight: "600",
          }}
        >
          404
        </h1>
        <h2
          style={{
            fontSize: "24px",
            color: "#666",
            marginBottom: "20px",
            fontWeight: "400",
          }}
        >
          Página não encontrada
        </h2>
        <p
          style={{
            fontSize: "16px",
            color: "#888",
            marginBottom: "30px",
            lineHeight: "1.5",
          }}
        >
          A página que você está procurando não existe ou foi movida.
        </p>
        <div
          style={{
            display: "flex",
            gap: "12px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            to="/dashboard"
            style={{
              padding: "12px 24px",
              backgroundColor: "#0066cc",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
          >
            Ir para Dashboard
          </Link>
          <Link
            to="/processos"
            style={{
              padding: "12px 24px",
              backgroundColor: "#28a745",
              color: "white",
              textDecoration: "none",
              borderRadius: "6px",
              fontSize: "14px",
              fontWeight: "500",
              transition: "background-color 0.2s",
            }}
          >
            Ver Processos
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
