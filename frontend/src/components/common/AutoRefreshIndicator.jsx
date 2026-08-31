import React, { useState, useEffect } from "react";

const AutoRefreshIndicator = ({
  isActive = true,
  interval = 30000,
  lastUpdate = null,
  onForceRefresh = null,
}) => {
  const [timeLeft, setTimeLeft] = useState(interval / 1000);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isActive) return;

    setTimeLeft(interval / 1000);

    const countdown = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return interval / 1000;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [interval, isActive]);

  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
  };

  return null;
};

export default AutoRefreshIndicator;
