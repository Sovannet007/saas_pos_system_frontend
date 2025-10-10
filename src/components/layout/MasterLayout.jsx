import { useEffect, useMemo, useState } from "react";
import { Routes, Route, NavLink } from "react-router-dom";
import { getMenuAccess } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import {
  useMenu,
  normalizeMenu as ctxNormalize,
} from "../../context/MenuContext";
import { Avatar, Dropdown, Modal, Button, Select } from "antd";
import * as LucideIcons from "lucide-react";
import SimpleBar from "simplebar-react";

// ✅ Page imports
import DashboardPage from "../../pages/DashboardPage";
import ProductPage from "../../pages/ProductPage";
import InvoicePage from "../../pages/invoice/InvoiceMainPage";
import RoleManagementPage from "../../pages/RoleManagementPage";
import MasterDataPage from "../../pages/MasterDataPage";
import UserManagementPage from "../../pages/UserManagementPage";
import SystemSettings from "../../pages/SystemSetting";

const pageMap = {
  // module_name: Page
  Dashboard: DashboardPage,
  Product: ProductPage,
  Invoice: InvoicePage,
  Role: RoleManagementPage,
  Master: MasterDataPage,
  User: UserManagementPage,
  SysSetting: SystemSettings,
};

function LoadingOverlay({ show, label = "កំពុងទាញទិន្នន័យ..." }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[60] grid place-items-center bg-white/70 backdrop-blur-[2px]">
      <div className="flex flex-col items-center gap-3">
        <span className="animate-spin inline-block w-10 h-10 border-[3px] border-gray-300 border-t-gray-900 rounded-full" />
        <div className="text-sm text-gray-700">{label}</div>
      </div>
    </div>
  );
}

export default function MasterLayout() {
  const {
    user,
    isSystemOwner,
    companies,
    currentCompany,
    selectCompany,
    logout,
  } = useAuth();

  const companyName =
    currentCompany?.name ||
    (currentCompany?.id
      ? `Company #${currentCompany.id}`
      : "មិនទាន់ជ្រើសរើសក្រុមហ៊ុន");
  const companyCode = currentCompany?.code || null;
  const { setMenu: setCtxMenu } = useMenu();

  const [menu, setMenu] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ✅ normalize menu from API (same logic as sidebar)
  const normalizeMenu = (apiMenu) => {
    const seen = new Set();
    return (apiMenu || [])
      .filter((m) => {
        const key = `${m.module_id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .map((m) => ({
        key: m.module_id,
        label: m.module_display,
        path: "/" + m.module_route.replace(/^\//, ""),
        route: m.module_route.replace(/^\//, ""),
        moduleName: m.module_name,
        icon: m.module_icon,
        perms: {
          full: !!m.full,
          list: !!m.list,
          add: !!m.add,
          edit: !!m.edit,
          delete: !!m.delete,
          cost: !!m.cost,
          print: !!m.print,
        },
      }));
  };

  const fetchMenu = async () => {
    const { data } = await getMenuAccess({ companyId: user?.company_id || 0 });
    const normalized = data?.menu ? normalizeMenu(data.menu) : [];
    setMenu(normalized);
    setCtxMenu(ctxNormalize(data?.menu || []));
  };

  useEffect(() => {
    fetchMenu();
  }, [user?.company_id]);

  const companyOptions = useMemo(
    () =>
      (companies || []).map((c) => ({
        value: c.company_id,
        label: `${c.company_name} (${c.company_code})`,
      })),
    [companies]
  );

  const handleSwitchCompany = async (companyId) => {
    setSwitching(true);
    await new Promise((r) => setTimeout(r, 1200));
    try {
      await selectCompany(Number(companyId));
      await fetchMenu();
    } finally {
      setSwitching(false);
    }
  };

  const userMenu = {
    items: [
      {
        key: "settings",
        label: (
          <span
            className="text-sm cursor-pointer"
            onClick={() => setSettingsOpen(true)}
          >
            ព័ត៌មានអ្នកប្រើប្រាស់
          </span>
        ),
      },
      { type: "divider" },
      {
        key: "logout",
        label: (
          <span
            className="text-sm text-red-600 cursor-pointer"
            onClick={() => setLogoutOpen(true)}
          >
            ចេញពីគណនី
          </span>
        ),
      },
    ],
  };

  return (
    <>
      <LoadingOverlay show={switching} label="កំពុងប្ដូរក្រុមហ៊ុន..." />

      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* ✅ Horizontal Navigation Bar (Enhanced) */}
        <div className="sticky top-0 z-30 bg-white border-b shadow-sm">
          <div className="flex items-center justify-between px-6 h-14">
            {/* 🔹 Left Section: Logo + Company Info + Menu */}
            <div className="flex items-center space-x-6">
              {/* Logo + Company Info */}
              <div className="flex items-center border-r pr-6">
                <div className="w-9 h-9 rounded-xl bg-gray-900 text-white grid place-items-center text-[11px] font-semibold">
                  SP
                </div>
                <div className="flex flex-col ml-3 min-w-0">
                  <span className="font-semibold truncate">SaaS Pos</span>
                  <span className="text-[11px] text-gray-500 truncate">
                    {companyName} {companyCode ? `(${companyCode})` : ""}
                  </span>
                </div>
              </div>

              {/* Menu items */}
              <div className="flex items-center space-x-6">
                {/* Home */}
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) =>
                    `flex flex-col items-center text-xs ${
                      isActive ? "text-blue-600 font-semibold" : "text-gray-600"
                    } hover:text-blue-500`
                  }
                >
                  <LucideIcons.Home size={20} />
                  Home
                </NavLink>

                {/* Dynamic menu */}
                {menu.map((m) => {
                  const Icon = LucideIcons[m.icon] || LucideIcons.Circle;
                  return (
                    <NavLink
                      key={m.key}
                      to={m.path}
                      className={({ isActive }) =>
                        `flex flex-col items-center text-xs ${
                          isActive
                            ? "text-blue-600 font-semibold"
                            : "text-gray-600"
                        } hover:text-blue-500`
                      }
                    >
                      <Icon size={20} />
                      {m.label}
                    </NavLink>
                  );
                })}
              </div>
            </div>

            {/* 🔹 Right Section: Actions */}
            <div className="flex items-center space-x-4">
              {/* Company Switcher */}
              {isSystemOwner && companyOptions.length > 0 && (
                <>
                  <div className="border-r pr-4">
                    <Select
                      size="small"
                      style={{ width: 220 }}
                      placeholder="ជ្រើសរើសក្រុមហ៊ុន"
                      value={currentCompany?.id ?? undefined}
                      options={companyOptions}
                      onChange={handleSwitchCompany}
                    />
                  </div>
                </>
              )}

              {/* Notifications */}
              <div className="relative border-r pr-4">
                <button
                  className="relative text-gray-600 hover:text-blue-600 transition-colors"
                  title="Notifications"
                >
                  <LucideIcons.Bell size={20} />
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-semibold px-[4px] py-[1px] rounded-full">
                    3
                  </span>
                </button>
              </div>

              {/* User Profile */}
              <Dropdown menu={userMenu} trigger={["click"]}>
                <div className="flex items-center gap-2 cursor-pointer">
                  <Avatar
                    src="https://cdn-icons-png.flaticon.com/512/219/219970.png"
                    size={32}
                  />
                </div>
              </Dropdown>
            </div>
          </div>
        </div>

        {/* ✅ Content Area */}
        <SimpleBar style={{ height: "calc(100vh - 56px)" }} autoHide={false}>
          <div className="p-6">
            <Routes>
              <Route path="dashboard" element={<DashboardPage />} />
              {menu.map((m) => {
                const Page = pageMap[m.moduleName];
                return Page ? (
                  <Route key={m.key} path={m.route} element={<Page />} />
                ) : (
                  <Route
                    key={m.key}
                    path={m.route}
                    element={<div>🚧 {m.moduleName} not implemented</div>}
                  />
                );
              })}
              <Route path="*" element={<DashboardPage />} />
            </Routes>
          </div>
        </SimpleBar>
      </div>

      {/* ✅ User Settings Modal */}
      <Modal
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        centered
        width={700}
        footer={null}
        title={<span className="font-semibold">ព័ត៌មានអ្នកប្រើប្រាស់</span>}
      >
        <div className="space-y-4">
          <div className="flex justify-evenly text-[18px] text-gray-500">
            <div>ឈ្មោះ : {user?.username}</div>
            <div>ក្រុមហ៊ុន : {currentCompany?.name}</div>
            <div>តួនាទី : {user?.role_name}</div>
          </div>

          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm border-collapse">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left">Menu</th>
                  <th className="px-3 py-2">List</th>
                  <th className="px-3 py-2">Add</th>
                  <th className="px-3 py-2">Edit</th>
                  <th className="px-3 py-2">Delete</th>
                  <th className="px-3 py-2">Print</th>
                  <th className="px-3 py-2">Cost</th>
                </tr>
              </thead>
              <tbody>
                {menu.map((m) => (
                  <tr key={m.key} className="border-t">
                    <td className="px-3 py-2 font-medium">{m.label}</td>
                    {["list", "add", "edit", "delete", "print", "cost"].map(
                      (perm) => (
                        <td key={perm} className="text-center px-2 py-2">
                          {m.perms?.[perm] ? "✅" : "❌"}
                        </td>
                      )
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>

      {/* ✅ Logout Modal */}
      <Modal
        open={logoutOpen}
        onCancel={() => setLogoutOpen(false)}
        centered
        footer={null}
        title={<span className="text-red-600 font-semibold">ចេញពីគណនី</span>}
      >
        <div className="text-center space-y-4">
          <p>តើអ្នកពិតជាចង់ចេញពីគណនីឬ?</p>
          <div className="flex justify-center gap-3">
            <Button onClick={() => setLogoutOpen(false)}>មិនចង់ទេ</Button>
            <Button type="primary" danger onClick={logout}>
              បាទ/ចាស
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
