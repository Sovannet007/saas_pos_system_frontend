import { useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { getMenuAccess } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import { Select, Avatar, Dropdown, Modal, Button } from "antd";
import { HomeOutlined } from "@ant-design/icons";
import SimpleBar from "simplebar-react";

// ✅ page imports
import DashboardPage from "../../pages/DashboardPage";
import ProductPage from "../../pages/ProductPage";
import InvoicePage from "../../pages/InvoicePage";
import RoleManagementPage from "../../pages/RoleManagementPage";

// ✅ Page map (module_name from backend → actual React Pages)
const pageMap = {
  Dashboard: DashboardPage,
  Product: ProductPage,
  Invoice: InvoicePage,
  "Role Management": RoleManagementPage,
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
  const navigate = useNavigate();

  const [collapsed, setCollapsed] = useState(false);
  const [menu, setMenu] = useState([]);
  const [switching, setSwitching] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // ✅ Normalize menu
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
        label: m.module_name,
        path: "/" + m.module_route.replace(/^\//, ""), // absolute for Sidebar
        route: m.module_route.replace(/^\//, ""), // relative for <Route>
        moduleName: m.module_name,
        icon: m.module_icon, // e.g. "Package", "FileText"
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

  // ✅ Fetch menu
  const fetchMenu = async () => {
    const { data } = await getMenuAccess({ companyId: user?.company_id || 0 });
    setMenu(data?.menu ? normalizeMenu(data.menu) : []);
  };

  // ✅ Fetch menu when company changes
  useEffect(
    () => {
      fetchMenu();
    },
    // watch company_id
    // eslint-disable-next-line
    [user?.company_id]
  );

  const companyOptions = useMemo(
    () =>
      (companies || []).map((c) => ({
        value: c.company_id,
        label: `${c.company_name} (${c.company_code})`,
        name: c.company_name,
        code: c.company_code,
      })),
    [companies]
  );

  const handleSwitchCompany = async (companyId) => {
    setSwitching(true);
    await new Promise((r) => setTimeout(r, 2000));
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
            ព័ត៏មានអ្នកប្រើប្រាស់
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
      <LoadingOverlay
        show={switching}
        label="កំពុងប្ដូរក្រុមហ៊ុន សូមរង់ចាំ..."
      />

      <div className="flex min-h-screen">
        {/* ✅ Sidebar: Dashboard + dynamic menu */}
        <Sidebar
          items={[
            {
              key: "dashboard",
              label: "Dashboard",
              path: "/dashboard",
              icon: "Home",
            },
            ...menu, // dynamic menu from API
          ]}
          collapsed={collapsed}
          onToggle={() => setCollapsed((v) => !v)}
        />

        {/* Right content */}
        <div className="flex-1 flex flex-col">
          {/* Top bar */}
          <div className="sticky top-0 z-20 bg-white border-b">
            <div className="h-14 flex items-center justify-between px-4">
              <div className="font-semibold">
                ក្រុមហ៊ុន {currentCompany?.name}
              </div>
              <div className="flex items-center gap-3">
                {isSystemOwner && companyOptions.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Select
                      className="min-w-[300px]"
                      placeholder="ជ្រើសរើសក្រុមហ៊ុន"
                      value={currentCompany?.id ?? undefined}
                      options={companyOptions}
                      onChange={handleSwitchCompany}
                      optionFilterProp="label"
                    />
                    <Button
                      type="default"
                      shape="circle"
                      icon={<HomeOutlined />}
                      title="ទៅផ្ទាំងដើម"
                      onClick={() => navigate("/dashboard")}
                    />
                  </div>
                )}
                {/* ✅ User dropdown */}
                <Dropdown menu={userMenu} trigger={["click"]}>
                  <Avatar
                    style={{ backgroundColor: "#111827" }}
                    className="cursor-pointer"
                  >
                    {(user?.username || "?").slice(0, 2).toUpperCase()}
                  </Avatar>
                </Dropdown>
              </div>
            </div>
          </div>

          {/* Scrollable content */}
          <SimpleBar style={{ height: "calc(100vh - 56px)" }} autoHide={false}>
            <div className="p-6">
              <Routes>
                {/* ✅ Fixed dashboard */}
                <Route path="dashboard" element={<DashboardPage />} />

                {/* ✅ Dynamic routes from api */}
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

                {/* fallback → dashboard */}
                <Route path="*" element={<DashboardPage />} />
              </Routes>
            </div>
          </SimpleBar>
        </div>
      </div>

      {/* User Settings Modal */}
      <Modal
        open={settingsOpen}
        onCancel={() => setSettingsOpen(false)}
        centered
        width={700}
        footer={null}
        title={<span className="font-semibold">ព័ត៏មានអ្នកប្រើប្រាស់</span>}
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex justify-evenly flex-1">
              <div className="text-[18px] text-gray-500">
                ឈ្មោះ : {user?.username}
              </div>
              <div className="text-[18px] text-gray-500">
                ក្រុមហ៊ុន : {currentCompany?.name}
              </div>
              <div className="text-[18px] text-gray-500">
                តួនាទី : {user?.role_name}
              </div>
            </div>
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

      {/* Logout Modal */}
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
