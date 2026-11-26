import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  GraduationCap,
  IdCard,
  KeyRound,
  Mail,
  Pencil,
  Save,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";
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

function HoSoCaNhan() {
  const toast = useToast();
  const [me, setMe] = useState(null);
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ hoTen: "", email: "" });

  const load = useCallback(async () => {
    try {
      const account = await api.get("/tai-khoan/me");
      setMe(account);

      let academic = null;
      if (account?.vaiTro === "SV" && account.maDinhDanh) {
        academic = await api
          .get(`/sinh-vien/${encodeURIComponent(account.maDinhDanh)}`)
          .catch(() => null);
      } else if (account?.vaiTro === "GV" && account.maDinhDanh) {
        academic = await api
          .get(`/giang-vien/${encodeURIComponent(account.maDinhDanh)}`)
          .catch(() => null);
      }
      setProfile(academic);
      setForm({
        hoTen: academic?.hoTen || "",
        email: academic?.email || account?.email || "",
      });
    } catch (e) {
      toast.error(e.message);
    }
  }, [toast]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e) => {
    e.preventDefault();
    if ((me?.vaiTro === "SV" || me?.vaiTro === "GV") && !form.hoTen.trim()) {
      toast.error("Họ và tên không được để trống");
      return;
    }
    setSaving(true);
    try {
      const email = form.email.trim();
      if (me?.vaiTro === "SV" && me.maDinhDanh) {
        await api.patch(`/sinh-vien/${encodeURIComponent(me.maDinhDanh)}`, {
          hoTen: form.hoTen.trim(),
          email: email || undefined,
        });
      } else if (me?.vaiTro === "GV" && me.maDinhDanh) {
        await api.patch(`/giang-vien/${encodeURIComponent(me.maDinhDanh)}`, {
          hoTen: form.hoTen.trim(),
          email: email || undefined,
        });
      }
      await api.patch("/tai-khoan/me", { email: email || undefined });
      toast.success("Cập nhật thông tin thành công");
      setEditing(false);
      await load();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const tt = me && (TRANG_THAI[me.trangThai] || [me.trangThai, "badge"]);
  const displayName = profile?.hoTen || me?.tenDangNhap || "";

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
              <div className="hs-avatar">{displayName.charAt(0)}</div>
              <div className="hs-title">
                <h3 className="hs-name">{displayName}</h3>
                <div className="hs-tags">
                  <span className="badge info">{ROLE_LABEL[me.vaiTro]}</span>
                  <span className={tt[1]}>{tt[0]}</span>
                </div>
              </div>
            </div>

            {editing ? (
              <form className="hs-edit-form" onSubmit={handleSave}>
                {(me.vaiTro === "SV" || me.vaiTro === "GV") && (
                  <div className="form-group">
                    <label>Họ và tên *</label>
                    <input
                      type="text"
                      value={form.hoTen}
                      onChange={(e) =>
                        setForm({ ...form, hoTen: e.target.value })
                      }
                      required
                    />
                  </div>
                )}
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    placeholder="Nhập email"
                  />
                </div>
                <div className="hs-edit-actions">
                  <button
                    type="button"
                    className="btn-secondary hs-cancel-btn"
                    onClick={() => {
                      setEditing(false);
                      setForm({
                        hoTen: profile?.hoTen || "",
                        email: profile?.email || me?.email || "",
                      });
                    }}
                    disabled={saving}
                  >
                    <X size={16} />
                    Hủy
                  </button>
                  <button type="submit" disabled={saving}>
                    <Save size={16} />
                    {saving ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="hs-grid">
                <Item icon={UserRound} label="Mã đăng nhập">
                  {me.tenDangNhap}
                </Item>
                <Item icon={ShieldCheck} label="Vai trò">
                  {ROLE_LABEL[me.vaiTro]}
                </Item>
                <Item
                  icon={IdCard}
                  label={MA_LABEL[me.vaiTro] || "Mã định danh"}
                >
                  {me.maDinhDanh || "Không có"}
                </Item>
                <Item icon={Mail} label="Email">
                  {profile?.email || me.email || "Chưa cập nhật"}
                </Item>
                {me.vaiTro === "SV" && profile && (
                  <>
                    <Item icon={GraduationCap} label="Lớp / Khóa">
                      {[profile.lop, profile.khoaHoc].filter(Boolean).join(" - ") || "—"}
                    </Item>
                    <Item icon={Building2} label="Ngành">
                      {profile.maNganh || "—"}
                    </Item>
                  </>
                )}
                {me.vaiTro === "GV" && profile && (
                  <Item icon={Building2} label="Khoa">
                    {profile.maKhoa || "—"}
                  </Item>
                )}
              </div>
            )}

            <div className="hs-actions">
              <span className="hs-hint">
                Nên đổi mật khẩu định kỳ. Sau khi đổi, bạn cần đăng nhập lại.
              </span>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {!editing && (
                  <button
                    type="button"
                    className="btn-secondary hs-cancel-btn"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil size={16} /> Cập nhật thông tin
                  </button>
                )}
                <Link to="/doi-mat-khau" className="hs-btn">
                  <KeyRound size={16} /> Đổi mật khẩu
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}

export default HoSoCaNhan;
