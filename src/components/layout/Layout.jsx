import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-page">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Navbar onMenuClick={() => setSidebarOpen((prev) => !prev)} />

      <main
        className={`transition-all duration-300 ease-in-out px-4 pb-4 lg:px-8 lg:pb-8 pt-16 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        <Outlet />
      </main>
    </div>
  );
}
