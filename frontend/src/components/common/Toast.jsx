import React, { useState, useEffect } from "react";

export const Toast = ({ message, type = "info", duration = 4000, onClose }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(progressInterval);
          return 0;
        }
        return prev - 100 / (duration / 100);
      });
    }, 100);

    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onClose && onClose(), 300);
    }, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(progressInterval);
    };
  }, [duration, onClose]);

  if (!visible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "success":
        return {
          background: "linear-gradient(135deg, #28a745 0%, #20c997 100%)",
          icon: "",
          shadowColor: "rgba(40, 167, 69, 0.3)",
        };
      case "error":
        return {
          background: "linear-gradient(135deg, #dc3545 0%, #e74c3c 100%)",
          icon: "",
          shadowColor: "rgba(220, 53, 69, 0.3)",
        };
      case "warning":
        return {
          background: "linear-gradient(135deg, #ffc107 0%, #ff9800 100%)",
          icon: "",
          shadowColor: "rgba(255, 193, 7, 0.3)",
        };
      case "info":
      default:
        return {
          background: "linear-gradient(135deg, #007bff 0%, #0056b3 100%)",
          icon: "",
          shadowColor: "rgba(0, 123, 255, 0.3)",
        };
    }
  };

  const styles = getTypeStyles();

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        background: styles.background,
        color: "white",
        padding: "16px 20px",
        borderRadius: "12px",
        boxShadow: `0 8px 25px ${styles.shadowColor}`,
        display: "flex",
        alignItems: "center",
        gap: "12px",
        minWidth: "320px",
        maxWidth: "450px",
        zIndex: 9999,
        transform: visible ? "translateX(0)" : "translateX(100%)",
        opacity: visible ? 1 : 0,
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        backdropFilter: "blur(10px)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
      }}
      onClick={() => {
        setVisible(false);
        setTimeout(() => onClose && onClose(), 300);
      }}
    >
      <div
        style={{
          fontSize: "1.2rem",
          flexShrink: 0,
        }}
      >
        {styles.icon}
      </div>

      <div
        style={{
          flex: 1,
          fontSize: "0.95rem",
          fontWeight: "500",
          lineHeight: "1.4",
        }}
      >
        {message}
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          setVisible(false);
          setTimeout(() => onClose && onClose(), 300);
        }}
        style={{
          background: "rgba(255, 255, 255, 0.2)",
          border: "none",
          borderRadius: "50%",
          width: "24px",
          height: "24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          color: "white",
          fontSize: "0.8rem",
          flexShrink: 0,
          transition: "background-color 0.2s ease",
        }}
        onMouseEnter={(e) =>
          (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.3)")
        }
        onMouseLeave={(e) =>
          (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.2)")
        }
      >
        ×
      </button>

      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "rgba(255, 255, 255, 0.3)",
          borderRadius: "0 0 12px 12px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            width: `${progress}%`,
            transition: "width 0.1s linear",
            borderRadius: "0 0 12px 12px",
          }}
        />
      </div>
    </div>
  );
};

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, duration + 500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showSuccess = (message, duration) =>
    showToast(message, "success", duration);
  const showError = (message, duration) =>
    showToast(message, "error", duration);
  const showWarning = (message, duration) =>
    showToast(message, "warning", duration);
  const showInfo = (message, duration) => showToast(message, "info", duration);

  return {
    toasts,
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast,
  };
};

export const ToastContainer = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
      }}
    >
      {toasts.map((toast, index) => (
        <div
          key={toast.id}
          style={{
            transform: `translateY(${index * 10}px)`,
            transition: "transform 0.3s ease",
          }}
        >
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
