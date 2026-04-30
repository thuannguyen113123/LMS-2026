import React from "react";
import StatusBadge from "../StatusBadge";

const CategoryCard = ({ item, onEdit, onDelete }) => {
  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border space-y-2">
      <div className="flex justify-between items-center">
        <h3 className="font-semibold">{item.name}</h3>
        <StatusBadge status={item.status} />
      </div>

      <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>

      <div className="text-xs text-gray-400">{item.slug}</div>

      <div className="flex justify-end gap-2">
        {onEdit && <button onClick={() => onEdit(item)}>Edit</button>}
        {onDelete && <button onClick={() => onDelete(item.id)}>Delete</button>}
      </div>
    </div>
  );
};

export default CategoryCard;
