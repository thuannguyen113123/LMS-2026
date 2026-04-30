import React from "react";
import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";

const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-app">
      <Header overlay />

      <main className="flex-1 flex flex-col pt-16">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default PublicLayout;
