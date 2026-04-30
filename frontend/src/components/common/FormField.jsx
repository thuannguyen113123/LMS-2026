import React from "react";

const FormField = ({
  label,
  name,
  value,
  checked,
  onChange,
  error,
  type = "text",
  placeholder = "",
  options = [],
  rows = 4,
  required = false,
  disabled = false,
  className = "",
}) => {
  const baseClasses =
    "w-full rounded-md p-3 border border-border bg-card text-primary focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] transition";

  return (
    <div className="mb-4">
      {label && type !== "checkbox" && (
        <label
          htmlFor={name}
          className="block text-sm font-medium mb-1 text-primary"
        >
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          id={name}
          name={name}
          rows={rows}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`${baseClasses} ${
            error ? "border-red-500 ring-red-500" : ""
          } ${className}`}
        />
      ) : type === "select" ? (
        <select
          id={name}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          className={`${baseClasses} ${
            error ? "border-red-500 ring-red-500" : ""
          } ${className}`}
        >
          <option value="">-- Chọn --</option>
          {options.map((opt, idx) => (
            <option
              key={opt.value ?? idx}
              value={opt.value !== undefined ? String(opt.value) : ""}
            >
              {opt.label ?? String(opt.value)}
            </option>
          ))}
        </select>
      ) : type === "checkbox" ? (
        <div className="flex items-center space-x-2">
          <input
            id={name}
            type="checkbox"
            name={name}
            checked={!!checked}
            onChange={onChange}
            disabled={disabled}
            className="h-5 w-5  border-border"
          />
          <label htmlFor={name} className="text-sm font-medium text-primary">
            {label}
          </label>
        </div>
      ) : type === "phone" ? (
        <div>
          <div className="flex">
            <div className="flex items-center px-3 rounded-l-md border border-border bg-muted text-primary text-sm">
              +84
            </div>
            <input
              id={name}
              type="tel"
              name={name}
              value={value ?? ""}
              disabled={disabled}
              placeholder={placeholder}
              onChange={(e) => {
                const onlyNumber = e.target.value.replace(/\D/g, "");
                onChange({ target: { name, value: onlyNumber } });
              }}
              className={`${baseClasses} rounded-l-none ${
                error ? "border-red-500 ring-red-500" : ""
              } ${className}`}
            />
          </div>
          {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
        </div>
      ) : (
        <input
          id={name}
          type={type}
          name={name}
          value={value ?? ""}
          onChange={onChange}
          disabled={disabled}
          placeholder={placeholder}
          className={`${baseClasses} ${
            error ? "border-red-500 ring-red-500" : ""
          } ${className}`}
        />
      )}

      {type !== "phone" && error && (
        <p className="text-red-500 text-xs mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormField;
