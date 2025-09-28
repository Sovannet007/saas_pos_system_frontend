import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ConfigProvider, App as AntApp, theme } from "antd";
import { AuthProvider } from "./context/AuthContext";
import { MenuProvider } from "./context/MenuContext"; // ⬅️ add this

import LoginPage from "./pages/LoginPage";
import SelectCompanyPage from "./pages/SelectCompanyPage";
import UnauthorizedPage from "./pages/UnauthorizedPage";
import NoPermissionPage from "./pages/NoPermissionPage";
import NotFoundPage from "./pages/NotFoundPage";

import ProtectedRoute from "./components/ProtectedRoute";
import GuestRoute from "./components/GuestRoute";
import RequireCompany from "./components/RequireCompany";
import MasterLayout from "./components/layout/MasterLayout";
import NotificationListener from "./components/NotificationListener";
// import GlobalLoader from "./components/GlobalLoader";

export default function App() {
  return (
    <ConfigProvider
      theme={{
        token: {
          fontFamily: '"Noto Sans Khmer", system-ui, sans-serif',
          colorPrimary: "#111827",
          borderRadius: 12,
        },
        algorithm: theme.defaultAlgorithm,
      }}
    >
      <AntApp>
        {/* 👇 listen for notifications */}
        <NotificationListener />
        {/* 👇 show loading indicator */}

        {/* <GlobalLoader /> */}

        {/* Providers order matters: Auth first, then Menu, then Router */}
        <AuthProvider>
          <MenuProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />

                {/* guest only */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <LoginPage />
                    </GuestRoute>
                  }
                />

                {/* system owner must select company first */}
                <Route
                  path="/select-company"
                  element={
                    <ProtectedRoute>
                      <SelectCompanyPage />
                    </ProtectedRoute>
                  }
                />

                {/* authenticated pages (MasterLayout contains its own nested <Routes/>) */}
                <Route
                  path="/*"
                  element={
                    <ProtectedRoute>
                      <RequireCompany>
                        <MasterLayout />
                      </RequireCompany>
                    </ProtectedRoute>
                  }
                />

                {/* fallback */}
                <Route path="/unauthorized" element={<UnauthorizedPage />} />
                <Route path="/no-permission" element={<NoPermissionPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
            </BrowserRouter>
          </MenuProvider>
        </AuthProvider>
      </AntApp>
    </ConfigProvider>
  );
}
