import React from "react";
import clsx from "clsx";

// Spinner component
// Props: size = 'sm' | 'md' | 'lg'; color = 'primary' | 'white' | custom hex
const Spinner = ({ size = "md", color = "primary" }) => {
  const sizeClasses = {
    sm: "h-6 w-6 border-2",
    md: "h-10 w-10 border-3",
    lg: "h-16 w-16 border-4",
  };

  const ringColor =
    color === "white"
      ? "border-t-white border-white/30"
      : color === "primary"
      ? "border-t-blue-600 border-gray-300"
      : ""; // custom hex handled separately

  return (
    <div
      role="status"
      aria-label="loading"
      className={clsx(
        "animate-spin rounded-full border-solid",
        sizeClasses[size],
        ringColor
      )}
      style={
        color !== "primary" && color !== "white"
          ? {
              borderColor: "#e5e7eb",
              borderTopColor: color, // supports custom hex
            }
          : {}
      }
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export default Spinner;
