import React from "react";

const EditableField = ({ type, value, onChange, options }) => {
  if (type === "select") {
    return (
      <select
        value={String(value)}
        onChange={(e) => {
          const val = e.target.value;

          if (val === "true") return onChange(true);
          if (val === "false") return onChange(false);

          onChange(val);
        }}
        className="border rounded px-1 py-0.5 w-full"
      >
        {options.map((opt) => (
          <option key={opt.value} value={String(opt.value)}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  }

  if (type === "number") {
    return (
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="border rounded px-1 py-0.5 w-full"
      />
    );
  }

  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border rounded px-1 py-0.5 w-full"
    />
  );
};

export default EditableField;
