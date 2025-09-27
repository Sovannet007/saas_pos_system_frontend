// src/pages/DashboardPage.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getMenuAccess } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Card as AntCard, Typography, Tag, Avatar, Divider } from "antd";
import Spinner from "../components/Spinner";
import * as LucideIcons from "lucide-react";

const { Title, Text } = Typography;

const PERM_LABELS = {
  list: "បង្ហាញ",
  add: "បន្ថែម",
  edit: "កែប្រែ",
  delete: "លុប",
  cost: "ថ្លៃដើម",
  print: "បោះពុម្ព",
};

function ModuleCard({ module }) {
  const { label, path, perms, icon } = module;
  const Icon = LucideIcons[icon] || LucideIcons.Circle;

  return (
    <div className="group rounded-2xl bg-white border hover:shadow-lg transition overflow-hidden">
      <div className="p-5 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gray-900 text-white grid place-items-center">
            <Icon size={18} />
          </div>
          <div className="truncate">
            <div className="text-base font-semibold truncate">{label}</div>
          </div>
        </div>
        <Link
          to={path || "/"}
          className="rounded-xl bg-gray-900 text-white text-xs px-3 py-1.5 hover:opacity-90"
        >
          បើក
        </Link>
      </div>
      <Divider className="!my-0" />
      <div className="px-5 py-3 flex flex-wrap gap-1.5">
        {Object.entries(PERM_LABELS).map(([k, kh]) =>
          perms?.[k] ? (
            <Tag
              key={k}
              color="success"
              className="!m-0 !rounded-full px-2 py-0.5 text-xs"
            >
              {kh}
            </Tag>
          ) : (
            <Tag
              key={k}
              color="default"
              className="!m-0 !rounded-full px-2 py-0.5 text-xs opacity-60"
            >
              {kh}
            </Tag>
          )
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { user, logout, isSystemOwner, companies, currentCompany } = useAuth();
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    todaySales: 0,
    weekSales: 0,
    monthSales: 0,
    totalProducts: 0,
    totalUsersCompany: 0,
    totalCompanies: 0,
    totalUsers: 0,
    totalRoles: 0,
  });

  const normalizeMenu = (apiMenu) => {
    const sorted = [...(apiMenu || [])].sort(
      (a, b) =>
        (a.sort_order ?? 0) - (b.sort_order ?? 0) ||
        String(a.module_name || "").localeCompare(String(b.module_name || ""))
    );
    return sorted.map((m, i) => ({
      key: m.module_id ?? i,
      label: m.module_name ?? "Module",
      path: m.module_route || "/",
      icon: m.module_icon || "Circle",
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
    setLoading(true);
    try {
      const { data } = await getMenuAccess({
        companyId: user?.company_id || 0,
      });
      setMenu(normalizeMenu(data?.menu || []));
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (isSystemOwner) {
      setStats({
        totalCompanies: companies?.length || 0,
        totalUsers: 120, // mock data
        totalRoles: 5, // mock data
      });
    } else {
      setStats({
        todaySales: 250.75,
        weekSales: 1700.5,
        monthSales: 5300.2,
        totalProducts: 85,
        totalUsersCompany: 12,
      });
    }
  };

  useEffect(
    () => {
      fetchMenu();
      fetchStats();
    },
    // watch company_id
    // eslint-disable-next-line
    [user?.company_id]
  );

  const totalPerms = useMemo(() => menu.length, [menu]);

  return (
    <div className="min-h-[calc(100vh-56px)] p-6 bg-gray-50">
      {/* Header */}
      <div className="max-w-7xl mx-auto flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Avatar style={{ backgroundColor: "#111827" }}>
            {(user?.username || "?").slice(0, 2).toUpperCase()}
          </Avatar>
          <div>
            <Title level={4} className="!mb-0">
              សួស្តី {user?.username}
            </Title>
            <Text type="secondary" className="text-xs">
              {isSystemOwner
                ? "System Owner"
                : `Role: ${user?.role_name} • Company: ${currentCompany?.name}`}
            </Text>
          </div>
        </div>
        <button
          className="rounded-xl bg-gray-900 text-white px-4 py-2 hover:opacity-90"
          onClick={logout}
        >
          ចាកចេញ
        </button>
      </div>

      {/* Dashboard content */}
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Quick stats */}
        {isSystemOwner ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">ក្រុមហ៊ុនសរុប</div>
              <div className="text-3xl font-bold mt-1">
                {stats.totalCompanies}
              </div>
              <div className="text-xs text-gray-400">គ្រប់ក្រុមហ៊ុន</div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">អ្នកប្រើប្រាស់សរុប</div>
              <div className="text-3xl font-bold mt-1">{stats.totalUsers}</div>
              <div className="text-xs text-gray-400">គ្រប់គណនី</div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">តួនាទីសរុប</div>
              <div className="text-3xl font-bold mt-1">{stats.totalRoles}</div>
              <div className="text-xs text-gray-400">គ្រប់តួនាទី</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">លក់ថ្ងៃនេះ</div>
              <div className="text-2xl font-bold mt-1 text-green-600">
                ${stats.todaySales}
              </div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">លក់សប្ដាហ៍នេះ</div>
              <div className="text-2xl font-bold mt-1 text-blue-600">
                ${stats.weekSales}
              </div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">លក់ខែនេះ</div>
              <div className="text-2xl font-bold mt-1 text-purple-600">
                ${stats.monthSales}
              </div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">ទំនិញសរុប</div>
              <div className="text-2xl font-bold mt-1">
                {stats.totalProducts}
              </div>
            </div>
            <div className="rounded-2xl bg-white border p-5">
              <div className="text-sm text-gray-500">
                អ្នកប្រើប្រាស់ក្នុងក្រុមហ៊ុន
              </div>
              <div className="text-2xl font-bold mt-1">
                {stats.totalUsersCompany}
              </div>
            </div>
          </div>
        )}

        {/* Modules */}
        <AntCard className="rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <Title level={4} className="!mb-0">
              ម៉ឺនុយដែលអ្នកមានសិទ្ទប្រើប្រាស់
            </Title>
            <Text type="secondary" className="text-xs">
              សរុប {totalPerms} ម៉ូឌុល
            </Text>
          </div>

          {loading ? (
            <div className="py-8 grid place-items-center">
              <Spinner label="កំពុងទាញទិន្នន័យ..." />
            </div>
          ) : menu.length === 0 ? (
            <div className="py-8 grid place-items-center text-gray-500">
              មិនមានម៉ូឌុលសម្រាប់អ្នក
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {menu.map((m) => (
                <ModuleCard key={m.key} module={m} />
              ))}
            </div>
          )}
        </AntCard>
      </div>
    </div>
  );
}
