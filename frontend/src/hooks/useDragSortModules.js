import { useState, useCallback } from "react";

const useDragSortModules = (modules = [], onSaveOrder) => {
  const [dragItems, setDragItems] = useState(modules);

  // sync khi modules từ redux đổi
  const syncItems = useCallback((newModules) => {
    setDragItems([...newModules].sort((a, b) => a.order - b.order));
  }, []);

  const onDragEnd = useCallback(
    (sourceIndex, destinationIndex) => {
      if (destinationIndex == null) return;

      const updated = Array.from(dragItems);
      const [moved] = updated.splice(sourceIndex, 1);
      updated.splice(destinationIndex, 0, moved);

      const items = updated.map((m, index) => ({
        id: m.id,
        order: index + 1,
      }));

      setDragItems(updated.map((m, index) => ({ ...m, order: index + 1 })));

      onSaveOrder(items);
    },
    [dragItems, onSaveOrder]
  );

  return {
    dragItems,
    syncItems,
    onDragEnd,
  };
};

export default useDragSortModules;
