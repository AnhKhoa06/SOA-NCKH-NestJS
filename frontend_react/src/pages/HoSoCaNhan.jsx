import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IdCard, KeyRound, ShieldCheck, UserRound } from "lucide-react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import { ROLE_LABEL } from "../config/menu";
import "./HoSoCaNhan.css";

const TRANG_THAI = {
  HOAT_DONG: ["Hoạt động", "badge success"],
  KHOA_TAM: ["Bị khóa", "badge danger"],
  NGUNG_HOAT_DONG: ["Ngừng hoạt động", "badge"],
};

const MA_LABEL = { GV: "Mã giảng viên", SV: "Mã sinh viên" };

function Item({ icon: Icon, label, children }) {
  return (
    <div className="hs-item">
      <span className="hs-item-icon">
        <Icon size={18} />
      </span>
      <div>
        <span className="hs-item-label">{label}</span>
        <span className="hs-item-value">{children}</span>
      </div>
    </div>
  );
}

// Hồ sơ tài khoản của chính mình (GET /tai-khoan/me).
// TODO (Khương): hiển thị thêm họ tên, khoa, lớp... lấy từ Academic theo maDinhDanh.
function HoSoCaNhan() {
  const toast = useToast();
  const [me, setMe] = useState(null);

  useEffect(() => {
    api
      .get("/tai-khoan/me")
      .then(setMe)
      .catch((e) => toast.error(e.message));
  }, [toast]);

  const tt = me && (TRANG_THAI[me.trangThai] || [me.trangThai, "badge"]);

  return (
    <>
      <div className="page-header">
        <h2>Hồ sơ cá nhân</h2>
      </div>

      <div className="hs-wrap">
        <div className="hs-cover" />
        {!me ? (
          <div className="hs-skeleton">Đang tải...</div>
        ) : (
          <>
            <div className="hs-head">
              <div className="hs-avatar">{me.tenDangNhap.charAt(0)}</div>
              <div className="hs-title">
                <h3 className="hs-name">{me.tenDangNhap}</h3>
                <div className="hs-tags">
                  <span className="badge info">{ROLE_LABEL[me.vaiTro]}</span>
                  <span className={tt[1]}>{tt[0]}</span>
                </div>
              </div>
            </div>

            <div className="hs-grid">
              <Item icon={UserRound} label="Tên đăng nhập">
                {me.tenDangNhap}
              </Item>
              <Item icon={ShieldCheck} label="Vai trò">
                {ROLE_LABEL[me.vaiTro]}
              </Item>
              <Item icon={IdCard} label={MA_LABEL[me.vaiTro] || "Mã định danh"}>
                {me.maDinhDanh || "Không có"}
              </Item>
              <Item icon={ShieldCheck} label="Trạng thái">
                {tt[0]}
              </Item>
            </div>

            <div className="hs-actions">
              <span className="hs-hint">
                Nên đổi mật khẩu định kỳ. Sau khi đổi, bạn cần đăng nhập lại.
              </span>
              <Link to="/doi-mat-khau" className="hs-btn">
                <KeyRound size={16} /> Đổi mật khẩu
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default HoSoCaNhan;
