import { useState } from "react";
import { Link } from "react-router-dom";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { api, logout } from "../api";
import { useToast } from "../components/Toast";
import "./DoiMatKhau.css";

const MIN_LEN = 8; // khớp PASSWORD_MIN_LENGTH ở Auth Service

// Chấm độ mạnh 0-4 (chỉ để gợi ý, backend mới là nơi kiểm tra thật)
function chamDiem(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= MIN_LEN) s++;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return Math.max(s, 1);
}

const NHAN_DIEM = ["", "Yếu", "Trung bình", "Khá", "Mạnh"];

function PasswordField({ label, value, onChange, autoComplete, children }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mk-field">
      <label>{label}</label>
      <div className="mk-input">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          className="mk-eye"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
        >
          {show ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {children}
    </div>
  );
}

function DoiMatKhau() {
  const toast = useToast();
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [nhapLai, setNhapLai] = useState("");
  const [busy, setBusy] = useState(false);

  const diem = chamDiem(moi);
  const khongKhop = nhapLai && moi !== nhapLai;

  const submit = async (e) => {
    e.preventDefault();
    if (moi.length < MIN_LEN)
      return toast.error(`Mật khẩu mới tối thiểu ${MIN_LEN} ký tự`);
    if (moi !== nhapLai) return toast.error("Mật khẩu nhập lại không khớp");
    if (moi === cu)
      return toast.error("Mật khẩu mới phải khác mật khẩu hiện tại");
    setBusy(true);
    try {
      await api.patch("/tai-khoan/me/mat-khau", {
        matKhauCu: cu,
        matKhauMoi: moi,
      });
      toast.success("Đã đổi mật khẩu, hãy đăng nhập lại");
      // Backend đã thu hồi mọi phiên cũ: xóa token và về trang đăng nhập
      await logout();
      window.dispatchEvent(new Event("auth:logout"));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Đổi mật khẩu</h2>
      </div>

      <div className="mk-wrap">
        <div className="mk-cover" />
        <div className="mk-icon">
          <KeyRound size={26} />
        </div>
        <form className="mk-body" onSubmit={submit}>
          <h3 className="mk-title">Cập nhật mật khẩu</h3>

          <PasswordField
            label="Mật khẩu hiện tại"
            value={cu}
            onChange={setCu}
            autoComplete="current-password"
          />

          <PasswordField
            label="Mật khẩu mới"
            value={moi}
            onChange={setMoi}
            autoComplete="new-password"
          >
            <div className={`mk-strength s${diem}`}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="mk-hint">
              {moi
                ? `Độ mạnh: ${NHAN_DIEM[diem]}`
                : `Tối thiểu ${MIN_LEN} ký tự`}
            </div>
          </PasswordField>

          <PasswordField
            label="Nhập lại mật khẩu mới"
            value={nhapLai}
            onChange={setNhapLai}
            autoComplete="new-password"
          >
            {khongKhop && (
              <div className="mk-hint error">Mật khẩu nhập lại chưa khớp</div>
            )}
          </PasswordField>

          <div className="mk-actions">
            <Link to="/ho-so-ca-nhan" className="mk-cancel">
              Hủy
            </Link>
            <button type="submit" className="mk-submit" disabled={busy}>
              {busy ? "Đang lưu..." : "Đổi mật khẩu"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

export default DoiMatKhau;
