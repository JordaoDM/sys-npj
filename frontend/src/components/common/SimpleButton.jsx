import React from "react";

export default function SimpleButton({
  children,
  onClick,
  type = "button",
  variant = "primary",
  disabled = false,
  className = "",
}) {
  const baseStyle =
    "px-4 py-2 rounded font-medium transition-colors duration-200 ";

  const variants = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 ",
    secondary: "bg-gray-500 text-white hover:bg-gray-600 ",
    danger: "bg-red-600 text-white hover:bg-red-700 ",
    success: "bg-green-600 text-white hover:bg-green-700 ",
  };

  const disabledStyle = disabled ? "opacity-50 cursor-not-allowed " : "";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={baseStyle + variants[variant] + disabledStyle + className}
    >
      {children}
    </button>
  );
}
