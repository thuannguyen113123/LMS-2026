import React from "react";

const PageHeader = ({ title, onAddClick, addButtonText = "+ Add New" }) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
      <h1 className="text-2xl font-bold">{title}</h1>

      {onAddClick && (
        <button
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow"
          onClick={onAddClick}
        >
          {addButtonText}
        </button>
      )}
    </div>
  );
};

export default PageHeader;
