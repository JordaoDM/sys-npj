import React from "react";

export function SimpleForm({ children, onSubmit, className = "" }) {
  return (
    <form onSubmit={onSubmit} className={`space-y-4 ${className}`}>
      {children}
    </form>
  );
}

export function SimpleInput({
  label,
  type = "text",
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  className = "",
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${className}`}
      />
    </div>
  );
}

export function SimpleTextarea({
  label,
  name,
  value,
  onChange,
  required = false,
  placeholder = "",
  rows = 3,
  className = "",
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${className}`}
      />
    </div>
  );
}

export function SimpleSelect({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  placeholder = "Selecione...",
  className = "",
}) {
  return (
    <div>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:border-blue-500 ${className}`}
      >
        <option value="">{placeholder}</option>
        {options.map((option, index) => (
          <option key={index} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
