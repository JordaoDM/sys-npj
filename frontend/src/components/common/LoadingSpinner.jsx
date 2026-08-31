import React from "react";

const LoadingSpinner = ({
  message = "Carregando...",
  size = "medium",
  type = "spinner",
  fullScreen = false,
}) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-8 w-8",
    large: "h-12 w-12",
  };

  const containerClasses = fullScreen
    ? "fixed inset-0 flex items-center justify-center bg-white bg-opacity-75 z-50"
    : "flex flex-col items-center justify-center py-8";

  const SpinnerComponent = () => {
    switch (type) {
      case "dots":
        return (
          <div className="flex space-x-2">
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"></div>
            <div
              className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-3 h-3 bg-blue-600 rounded-full animate-pulse"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        );
      case "pulse":
        return (
          <div
            className={`${sizeClasses[size]} bg-blue-600 rounded-full animate-pulse`}
          ></div>
        );
      default:
        return (
          <div
            className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}
          ></div>
        );
    }
  };

  return (
    <div className={containerClasses}>
      <SpinnerComponent />
      {message && (
        <p className="mt-3 text-gray-600 text-sm font-medium">{message}</p>
      )}
    </div>
  );
};

export default LoadingSpinner;
