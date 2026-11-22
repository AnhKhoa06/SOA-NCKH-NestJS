import { UserRound, LogOut, ChevronLeft, ChevronDown } from "lucide-react";
import logoImg from "./assets/logo.png";
import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  NavLink,
  Navigate,
} from "react-router-dom";
import Login from "./pages/Login";
import "./App.css";
import { ToastProvider } from "./components/Toast";
import Topbar from "./components/Topbar";
import { auth, logout } from "./api";
import { HOME, MENU_BY_ROLE, ROLES, ROLE_LABEL } from "./config/menu";
import { ROUTES } from "./config/routes";

// Phiên cũ (trước khi có phân quyền) lưu role "admin": coi như chưa đăng nhập
function readSession() {
  const user = auth.getUser();
  const ok = !!auth.getRefresh() && !!user && ROLES.includes(user.role);
  if (!ok && auth.getRefresh()) auth.clear();
  return ok ? user : null;
}

function App() {
  const [user, setUser] = useState(readSession);
  const isLoggedIn = !!user;
  const role = user?.role;

  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true",
  );
  const [closedGroups, setClosedGroups] = useState({});
  const toggleGroup = (key) =>
    setClosedGroups((g) => ({ ...g, [key]: !g[key] }));

  // api.js phát sự kiện này khi phiên hết hạn hẳn
  useEffect(() => {
    const onForceLogout = () => setUser(null);
    window.addEventListener("auth:logout", onForceLogout);
    return () => window.removeEventListener("auth:logout", onForceLogout);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", collapsed);
  }, [collapsed]);

  // Phím tắt Ctrl + B
  useEffect(() => {
    const onKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        setCollapsed((c) => !c);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  const menu = MENU_BY_ROLE[role] || [];

  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to={HOME} />
              ) : (
                <Login onLogin={() => setUser(readSession())} />
              )
            }
          />
          <Route
            path="/*"
            element={
              isLoggedIn ? (
                <div className="layout">
                  <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
                    <button
                      className="sidebar-toggle"
                      onClick={() => setCollapsed((c) => !c)}
                      aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                      title={
                        collapsed ? "Mở rộng (Ctrl+B)" : "Thu gọn (Ctrl+B)"
                      }
                    >
                      <ChevronLeft size={16} />
                    </button>

                    <div className="sidebar-logo">
                      <img src={logoImg} alt="Logo Trường Đại học Quy Nhơn" />
                    </div>

                    <div className="sidebar-profile">
                      <div className="profile-panel">
                        <div className="avatar">
                          <UserRound size={24} />
                        </div>
                        <div className="profile-info">
                          <div className="profile-name">{ROLE_LABEL[role]}</div>
                          <div className="profile-role">{user.username}</div>
                        </div>
                      </div>
                    </div>

                    <div className="sidebar-scroll">
                      {menu.map((group) => {
                        const isOpen = !closedGroups[group.key];
                        return (
                          <div className="nav-group" key={group.key}>
                            <button
                              className="nav-group-header"
                              onClick={() => toggleGroup(group.key)}
                            >
                              <span className="nav-group-title">
                                {group.title}
                              </span>
                              <ChevronDown
                                size={16}
                                className={isOpen ? "" : "rotated"}
                              />
                            </button>

                            <div
                              className={`nav-group-body ${isOpen ? "open" : ""}`}
                            >
                              <div className="nav-group-inner">
                                {group.items.map(
                                  ({ to, label, icon: Icon }) => (
                                    <NavLink
                                      key={to}
                                      to={to}
                                      className="nav-link"
                                      data-tooltip={label}
                                    >
                                      <Icon size={20} />
                                      <span className="nav-text">{label}</span>
                                    </NavLink>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="sidebar-footer">
                      <button
                        className="logout-btn"
                        onClick={handleLogout}
                        data-tooltip="Đăng xuất"
                      >
                        <LogOut size={20} />
                        <span className="nav-text">Đăng xuất</span>
                      </button>
                    </div>
                  </aside>

                  <div className="main-area">
                    <Topbar user={user} onLogout={handleLogout} />
                    <main className="content">
                      <Routes>
                        {ROUTES.map((r) => (
                          <Route
                            key={r.path}
                            path={r.path}
                            element={
                              r.roles.includes(role) ? (
                                r.element
                              ) : (
                                <Navigate to={HOME} replace />
                              )
                            }
                          />
                        ))}
                        <Route
                          path="*"
                          element={<Navigate to={HOME} replace />}
                        />
                      </Routes>
                    </main>
                  </div>
                </div>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;
