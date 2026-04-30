import React from "react";
import { Menu } from "lucide-react";

const EmptyHeader = ({ onOpenSidebar }) => {
  return (
    <header className="h-14 px-3 flex items-center border-b md:hidden">
      <button onClick={onOpenSidebar} className="p-2">
        <Menu size={16} />
      </button>

      <h2 className="ml-2 text-sm font-medium text-gray-600">Chats</h2>
    </header>
  );
};

export default EmptyHeader;
