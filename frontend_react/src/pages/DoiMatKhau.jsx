import { useState } from "react";
import { api, logout } from "../api";
import { useToast } from "../components/Toast";

function DoiMatKhau() {
  const toast = useToast();
  const [cu, setCu] = useState("");
  const [moi, setMoi] = useState("");
  const [nhapLai, setNhapLai] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (moi !== nhapLai) return toast.error("Mật khẩu nhập lại không khớp");
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
      <div className="card" style={{ maxWidth: 420 }}>
        <form onSubmit={submit}>
          <div className="form-group">
            <label>Mật khẩu hiện tại</label>
            <input
              type="password"
              value={cu}
              onChange={(e) => setCu(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Mật khẩu mới</label>
            <input
              type="password"
              value={moi}
              onChange={(e) => setMoi(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Nhập lại mật khẩu mới</label>
            <input
              type="password"
              value={nhapLai}
              onChange={(e) => setNhapLai(e.target.value)}
              required
            />
          </div>
          <button type="submit" disabled={busy}>
            {busy ? "Đang lưu..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </>
  );
}

export default DoiMatKhau;
