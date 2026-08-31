import React from "react";

export default function SimpleModal({
  isOpen,
  onClose,
  title,
  children,
  showCloseButton = true,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {(title || showCloseButton) && (
          <div className="flex justify-between items-center p-4 border-b">
            {title && <h2 className="text-xl font-bold">{title}</h2>}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            )}
          </div>
        )}
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}
