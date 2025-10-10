import { createContext, useContext, useMemo, useState, useEffect } from "react";
import {
  login as loginApi,
  selectCompany as selectCompanyApi,
} from "../services/api";
import { notify } from "../services/notify";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("auth_token"));

  // ✅ users list
  const [user, setUser] = useState(() => {
    const raw = localStorage.getItem("auth_user");
    return raw ? JSON.parse(raw) : null;
  });

  // ✅ companies list
  const [companies, setCompanies] = useState(() => {
    const raw = localStorage.getItem("auth_companies");
    return raw ? JSON.parse(raw) : [];
  });

  // ✅ flag if role is system owner
  const [isSystemOwner, setIsSystemOwner] = useState(false);

  // ✅ recompute isSystemOwner base on user ( this system role_id==1 is developer)
  useEffect(() => {
    setIsSystemOwner(!!user && user.role_id === 1);
  }, [user]);

  const login = async (username, password) => {
    const { data } = await loginApi({ username, password });
    if (data?.code !== 200) throw new Error(data?.message || "Login failed");

    setToken(data.token);
    localStorage.setItem("auth_token", data.token);

    // ✅ Normal user: server gives company_name/code.
    setUser(data.user);
    localStorage.setItem("auth_user", JSON.stringify(data.user));

    // ✅ System owner: server gives companies list
    const list = data.companies || [];
    setCompanies(list);
    localStorage.setItem("auth_companies", JSON.stringify(list));

    return data;
  };

  const selectCompany = async (companyId) => {
    const { data } = await selectCompanyApi({ companyId });
    if (data?.code !== 200)
      throw new Error(data?.message || "Select company failed");

    // replace token with company-bound token
    setToken(data.token);
    localStorage.setItem("auth_token", data.token);

    // Make sure user snapshot has company_id + name + code
    // (server now returns name/code; if not, fallback to local companies list)
    const fallback = (companies || []).find((c) => c.company_id === companyId);
    const newUser = {
      ...(user || {}),
      company_id: data.company_id ?? companyId,
      company_name: data.company_name ?? fallback?.company_name ?? null,
      company_code: data.company_code ?? fallback?.company_code ?? null,
    };

    setUser(newUser);
    localStorage.setItem("auth_user", JSON.stringify(newUser));

    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setCompanies([]);
    setIsSystemOwner(false);
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("auth_companies");
  };

  // ✅ Always-available current company object for UI
  const currentCompany = useMemo(() => {
    // 1) if user already has name/code, use them
    if (user?.company_id && (user.company_name || user.company_code)) {
      return {
        id: user.company_id,
        name: user.company_name ?? null,
        code: user.company_code ?? null,
      };
    }
    // 2) otherwise, try to find from companies list (owner after select)
    if (user?.company_id && Array.isArray(companies) && companies.length) {
      const hit = companies.find((c) => c.company_id === user.company_id);
      if (hit)
        return {
          id: hit.company_id,
          name: hit.company_name,
          code: hit.company_code,
        };
    }
    // 3) nothing selected yet
    return { id: null, name: null, code: null };
  }, [user?.company_id, user?.company_name, user?.company_code, companies]);

  const value = useMemo(
    () => ({
      token,
      user,
      isSystemOwner,
      companies,
      currentCompany, // 👈 expose this to the app
      login,
      selectCompany,
      logout,
      isAuthenticated: !!token,
    }),
    [token, user, isSystemOwner, companies, currentCompany]
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
};
