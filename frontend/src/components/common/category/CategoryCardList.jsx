import React from "react";
import CategoryCard from "./CategoryCard";

const CategoryCardList = ({ data, onEdit, onDelete }) => {
  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <CategoryCard
          key={item.id}
          item={item}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
};

export default CategoryCardList;
