import React from "react";
import { getStatusColor, getStatusLabel } from "../../utils/commonUtils";

const StatusBadge = ({ status, customColors = {} }) => {
  const statusText = getStatusLabel(status);
  const colors = customColors[statusText] || getStatusColor(statusText);

  return (
    <span
      style={{
        padding: "6px 12px",
        borderRadius: "20px",
        fontSize: "0.8rem",
        fontWeight: "bold",
        backgroundColor: colors.bg,
        color: colors.color,
        display: "inline-block",
        textAlign: "center",
        minWidth: "70px",
      }}
    >
      {statusText}
    </span>
  );
};

export default StatusBadge;
