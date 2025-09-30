import { createContext, useContext, useState, useMemo } from "react";

const MenuCtx = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useMenu = () => {
  const ctx = useContext(MenuCtx);
  if (!ctx) throw new Error("useMenu must be used inside <MenuProvider>.");
  return ctx;
};

// --- keep your normalizer exactly as you built it ---
// eslint-disable-next-line react-refresh/only-export-components
export const normalizeMenu = (apiMenu) => {
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
      path: "/" + String(m.module_route || "").replace(/^\//, ""),
      route: String(m.module_route || "").replace(/^\//, ""),
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

export function MenuProvider({ children }) {
  const [menu, setMenu] = useState([]);

  // ------- helpers to read perms wherever you need -------
  const empty = {
    full: false,
    list: false,
    add: false,
    edit: false,
    delete: false,
    cost: false,
    print: false,
  };

  const normalizePerms = (p) => {
    if (!p) return { ...empty };
    if (p.full)
      return {
        full: true,
        list: true,
        add: true,
        edit: true,
        delete: true,
        cost: true,
        print: true,
      };
    return {
      ...empty,
      list: !!p.list,
      add: !!p.add,
      edit: !!p.edit,
      delete: !!p.delete,
      cost: !!p.cost,
      print: !!p.print,
    };
  };

  const getPermsByModuleName = (name) => {
    if (!name) return { ...empty };
    const hit = (menu || []).find((m) => m.moduleName === name);
    return normalizePerms(hit?.perms);
  };

  // get permission by route
  const getPermsByRoute = (route) => {
    if (!route) return { ...empty };
    const r = String(route).replace(/^\//, "");
    const hit = (menu || []).find(
      (m) => (m.route || "").replace(/^\//, "") === r
    );
    return normalizePerms(hit?.perms);
  };

  // Hook you can import directly in pages (lives inside context)
  const _usePagePermsInner = (key) => {
    if (typeof key === "string") return getPermsByModuleName(key);
    if (key && typeof key === "object" && key.route)
      return getPermsByRoute(key.route);
    return { ...empty };
  };

  const value = useMemo(
    () => ({
      menu,
      setMenu,
      getPermsByModuleName,
      getPermsByRoute,
      usePagePerms: _usePagePermsInner,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [menu]
  );

  return <MenuCtx.Provider value={value}>{children}</MenuCtx.Provider>;
}

/**
 * 👉 Export a top-level hook so pages can:
 *    import { usePagePerms } from ".../MenuContext";
 */
// eslint-disable-next-line react-refresh/only-export-components
export const usePagePerms = (key) => {
  const { usePagePerms: _inner } = useMenu();
  return _inner(key);
};

/** Optional: quick gate for buttons/sections */
export function PermissionGate({
  moduleName,
  route,
  need = "list",
  children,
  fallback = null,
}) {
  const { usePagePerms } = useMenu();
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const perms = moduleName ? usePagePerms(moduleName) : usePagePerms({ route });
  const ok = perms.full || (need ? perms[need] : true);
  return ok ? children : fallback;
}
