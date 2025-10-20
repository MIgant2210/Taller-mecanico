import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { NAVIGATION } from "../utils/constants";

import {
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Users,
  Wrench,
  Boxes,
  CalendarDays,
  Ticket,
  FileText,
  FileSpreadsheet,
  Settings,
} from "lucide-react";

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems =
    NAVIGATION?.filter((item) => item.roles?.includes(user?.rol?.nombre_rol)) ||
    [];

  return (
    <div className="min-h-screen flex bg-gray-100">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 shadow-xl transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* LOGO */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-blue-700">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg ring-2 ring-blue-400/20">
              <LayoutDashboard className="text-blue-700" size={26} />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-tight tracking-wide">
                AutoPro
              </h1>
              <p className="text-blue-300 text-xs">Sistema de Gestión</p>
            </div>
          </div>

          <button
            onClick={() => setSidebarOpen(false)}
            className="text-white hover:text-blue-300 transition-colors"
            title="Cerrar barra"
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 mt-6 overflow-y-auto px-4">
          {menuItems.map((item) => {
            const active = location.pathname === item.path;
            const IconComponent = item.icon;

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 text-sm font-medium transition-all ${
                  active
                    ? "bg-blue-700 text-white shadow-md"
                    : "text-blue-100 hover:bg-blue-700/40 hover:text-white"
                }`}
              >
                {IconComponent && (
                  <IconComponent size={20} className="opacity-90" />
                )}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* USER INFO + LOGOUT */}
        <div className="mt-auto border-t border-blue-700 p-4 bg-blue-900/80 backdrop-blur-sm">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-700 rounded-full flex items-center justify-center font-semibold text-sm uppercase shadow-md">
                {user?.empleado?.nombres
                  ?.split(" ")
                  .slice(0, 2)
                  .map((n) => n.charAt(0))
                  .join("")}
              </div>
              <div>
                <p className="font-medium text-sm leading-tight">
                  {user?.empleado?.nombres || "Usuario"}
                </p>
                <p className="text-xs text-blue-300">
                  {user?.rol?.nombre_rol || "Rol"}
                </p>
              </div>
            </div>

            <button
              onClick={logout}
              className="p-2 bg-red-600 rounded-lg hover:bg-red-700 transition-transform transform hover:scale-105 shadow-md"
              title="Cerrar sesión"
            >
              <LogOut className="text-white" size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`flex-1 transition-all duration-300 ${
          sidebarOpen ? "ml-64" : "ml-0"
        }`}
      >
        {/* HEADER */}
        <header className="bg-white shadow-sm border-b sticky top-0 z-40">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              {sidebarOpen ? (
                <ChevronLeft className="text-gray-700" size={22} />
              ) : (
                <ChevronRight className="text-gray-700" size={22} />
              )}
            </button>

            <span className="text-sm text-gray-600 capitalize">
              {new Date().toLocaleDateString("es-ES", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </header>

        {/* CONTENT */}
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

