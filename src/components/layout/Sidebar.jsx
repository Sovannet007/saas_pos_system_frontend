import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import * as LucideIcons from "lucide-react";
import { ChevronLeft, ChevronRight } from "lucide-react"; // ✅ better toggle icons

export default function Sidebar({ items = [], collapsed, onToggle }) {
  const { pathname } = useLocation();
  const { currentCompany } = useAuth();

  const companyName =
    currentCompany?.name ||
    (currentCompany?.id
      ? `Company #${currentCompany.id}`
      : "មិនទាន់ជ្រើសរើសក្រុមហ៊ុន");
  const companyCode = currentCompany?.code || null;

  const isActive = (path) =>
    path && (pathname === path || (path !== "/" && pathname.startsWith(path)));

  return (
    <aside
      className={`h-screen sticky top-0 bg-white border-r shadow-sm transition-all duration-300
        ${collapsed ? "w-[80px]" : "w-[260px]"}`}
    >
      {/* Header */}
      <div className="h-14 flex items-center justify-between px-3 border-b">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gray-900 text-white grid place-items-center text-[11px] font-semibold">
            SP
          </div>

          {/* Company info with fade */}
          <div
            className={`flex flex-col min-w-0 transition-opacity duration-300 ${
              collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
            }`}
          >
            <span className="font-semibold truncate">SaaS Pos</span>
            <span className="text-[11px] text-gray-500 truncate">
              {companyName} {companyCode ? `(${companyCode})` : ""}
            </span>
          </div>
        </div>

        <button
          onClick={onToggle}
          aria-label={collapsed ? "ពង្រីកផ្ទាំង" : "បង្រួមផ្ទាំង"}
          className="w-9 h-9 grid place-items-center rounded-xl hover:bg-gray-100 transition"
        >
          {collapsed ? (
            <ChevronRight size={18} className="text-gray-600" />
          ) : (
            <ChevronLeft size={18} className="text-gray-600" />
          )}
        </button>
      </div>

      {/* Menu */}
      <nav className="p-2 overflow-y-auto h-[calc(100vh-56px)]">
        {items.map((m) => {
          const Icon = LucideIcons[m.icon] || LucideIcons.Circle;
          const active = isActive(m.path);

          return (
            <Link
              key={m.key}
              to={m.path}
              className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors
                ${
                  active
                    ? "bg-gray-900 text-white shadow-sm"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              title={collapsed ? m.label : undefined}
            >
              <span className="w-7 h-7 grid place-items-center">
                <Icon
                  size={18}
                  strokeWidth={2}
                  className={active ? "text-white" : "text-gray-600"}
                />
              </span>

              {/* Label with smooth hide/show */}
              <span
                className={`truncate transition-all duration-300 ${
                  collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"
                }`}
              >
                {m.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
