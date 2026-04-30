import React from "react";

const Overlay = ({ onClick }) => {
  return (
    <div
      onClick={onClick}
      className="fixed top-0 bottom-0 left-64 right-0 bg-black/40 z-30 md:hidden"
    />
  );
};

export default Overlay;
