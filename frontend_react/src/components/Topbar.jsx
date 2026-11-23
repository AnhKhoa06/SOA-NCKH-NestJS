import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Bell, ChevronDown, KeyRound, LogOut, UserRound } from "lucide-react";
import { ROLE_LABEL, findTitle } from "../config/menu";
import "./Topbar.css";

// unread: số thông báo chưa đọc. Lịch (Notification) sẽ nối vào đây sau.
function Topbar({ user, onLogout, unread = 0 }) {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header className="topbar">
      <h1 className="topbar-title">{findTitle(pathname, user.role)}</h1>

      <div className="topbar-right">
        <Link to="/thong-bao" className="topbar-bell" title="Thông báo">
          <Bell size={20} />
          {unread > 0 && (
            <span className="topbar-badge">{unread > 99 ? "99+" : unread}</span>
          )}
        </Link>

        <div className="topbar-user" ref={boxRef}>
          <button
            className="topbar-user-btn"
            onClick={() => setOpen((o) => !o)}
          >
            <span className="topbar-avatar">
              <UserRound size={18} />
            </span>
            <span className="topbar-user-text">
              <span className="topbar-user-name">{user.username}</span>
              <span className="topbar-user-role">{ROLE_LABEL[user.role]}</span>
            </span>
            <ChevronDown size={16} />
          </button>

          {open && (
            <div className="topbar-menu">
              <Link to="/ho-so-ca-nhan">
                <UserRound size={16} /> Hồ sơ cá nhân
              </Link>
              <Link to="/doi-mat-khau">
                <KeyRound size={16} /> Đổi mật khẩu
              </Link>
              <button onClick={onLogout}>
                <LogOut size={16} /> Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Topbar;
