import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const TRANG_THAI = {
  HOAT_DONG: "Hoạt động",
  KHOA_TAM: "Khóa tạm",
  NGUNG_HOAT_DONG: "Ngừng hoạt động",
};
const VAI_TRO = { QTV: "Quản trị viên", GV: "Giảng viên", SV: "Sinh viên" };
const EMPTY_FORM = {
  vaiTro: "SV",
  maDinhDanh: "",
  hoTen: "",
  email: "",
  khoaHoc: "",
  maKhoa: "",
  maNganh: "",
  lop: "",
  matKhau: "",
};

const toList = (res) => (Array.isArray(res) ? res : res?.data || []);

function sinhMatKhauTam() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789@#";
  let s = "";
  for (let i = 0; i < 10; i++) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

function TaiKhoan() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vaiTro, setVaiTro] = useState("");
  const [q, setQ] = useState("");

  const [khoaList, setKhoaList] = useState([]);
  const [nganhList, setNganhList] = useState([]);
  const [lopList, setLopList] = useState([]);

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [lockTarget, setLockTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [createdInfo, setCreatedInfo] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (vaiTro) params.set("vaiTro", vaiTro);
      if (q.trim()) params.set("q", q.trim());
      const res = await api.get(`/tai-khoan?${params}`);
      setRows(res.data || []);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, vaiTro, q, toast]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    Promise.all([
      api.get("/khoa?size=100").catch(() => []),
      api.get("/nganh?size=100").catch(() => []),
      api.get("/lop").catch(() => []),
    ]).then(([k, n, l]) => {
      setKhoaList(toList(k));
      setNganhList(toList(n));
      setLopList(toList(l));
    });
  }, []);

  const nganhTheoKhoa = useMemo(() => {
    if (!form.maKhoa) return nganhList;
    return nganhList.filter((n) => n.maKhoa === form.maKhoa);
  }, [form.maKhoa, nganhList]);

  const lopFiltered = useMemo(() => {
    return lopList.filter((l) => {
      if (form.maNganh && l.maNganh !== form.maNganh) return false;
      if (form.khoaHoc && l.khoaHoc !== form.khoaHoc) return false;
      if (!form.maNganh && form.maKhoa) {
        const nganhIds = new Set(nganhTheoKhoa.map((n) => n.maNganh));
        if (!nganhIds.has(l.maNganh)) return false;
      }
      return true;
    });
  }, [form.khoaHoc, form.maKhoa, form.maNganh, lopList, nganhTheoKhoa]);

  const khoaHocList = useMemo(
    () => [...new Set(lopList.map((l) => l.khoaHoc).filter(Boolean))],
    [lopList],
  );

  const handleSelectKhoa = (maKhoa) => {
    setForm((f) => ({ ...f, maKhoa, maNganh: "", lop: "" }));
  };

  const handleSelectNganh = (maNganh) => {
    const nganh = nganhList.find((n) => n.maNganh === maNganh);
    setForm((f) => ({
      ...f,
      maNganh,
      maKhoa: nganh ? nganh.maKhoa : f.maKhoa,
      lop: "",
    }));
  };

  const handleSelectLop = (maLop) => {
    const lopObj = lopList.find((l) => l.maLop === maLop);
    if (!lopObj) {
      setForm((f) => ({ ...f, lop: "" }));
      return;
    }
    const nganh = nganhList.find((n) => n.maNganh === lopObj.maNganh);
    setForm((f) => ({
      ...f,
      lop: maLop,
      khoaHoc: lopObj.khoaHoc || f.khoaHoc,
      maNganh: lopObj.maNganh,
      maKhoa: nganh ? nganh.maKhoa : f.maKhoa,
    }));
  };

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try {
      const result = await fn();
      toast.success(okMsg);
      after?.(result);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = () => {
    if (!form.maDinhDanh.trim() || !form.hoTen.trim() || !form.email.trim()) {
      toast.error("Vui lòng nhập đầy đủ mã, họ tên và email");
      return;
    }
    if (form.vaiTro === "GV" && !form.maKhoa) {
      toast.error("Vui lòng chọn khoa cho giảng viên");
      return;
    }
    if (form.vaiTro === "SV" && (!form.maNganh || !form.lop)) {
      toast.error("Vui lòng chọn lớp / ngành cho sinh viên");
      return;
    }

    const matKhauGui = form.matKhau.trim() || sinhMatKhauTam();
    const payload = {
      vaiTro: form.vaiTro,
      maDinhDanh: form.maDinhDanh.trim().toUpperCase(),
      hoTen: form.hoTen.trim(),
      email: form.email.trim(),
      matKhau: matKhauGui,
      ...(form.vaiTro === "SV"
        ? {
            khoaHoc: form.khoaHoc,
            lop: form.lop,
            maNganh: form.maNganh,
          }
        : {
            maKhoa: form.maKhoa,
          }),
    };

    run(
      () => api.post("/tai-khoan", payload),
      "Đã tạo hồ sơ và tài khoản",
      () => {
        setCreateOpen(false);
        setCreatedInfo({
          ma: payload.maDinhDanh,
          hoTen: payload.hoTen,
          matKhau: matKhauGui,
        });
        setForm(EMPTY_FORM);
      },
    );
  };

  const submitReset = () => {
    const passToSend = newPass.trim();
    run(
      () =>
        api.patch(`/tai-khoan/${resetTarget.id}/dat-lai-mat-khau`, {
          ...(passToSend ? { matKhauMoi: passToSend } : {}),
        }),
      "Đã đặt lại mật khẩu",
      (res) => {
        const shownPass = passToSend || res?.matKhauTam;
        if (shownPass) {
          setCreatedInfo({
            ma: resetTarget.tenDangNhap,
            hoTen: resetTarget.maDinhDanh || resetTarget.tenDangNhap,
            matKhau: shownPass,
          });
        }
        setResetTarget(null);
        setNewPass("");
      },
    );
  };

  const confirmLock = () =>
    run(
      () => api.patch(`/tai-khoan/${lockTarget.id}/khoa`),
      "Đã khóa tài khoản",
      () => setLockTarget(null),
    );

  const unlock = (tk) =>
    run(() => api.patch(`/tai-khoan/${tk.id}/mo-khoa`), "Đã mở khóa tài khoản");

  return (
    <>
      <div className="page-header">
        <h2>Quản lý tài khoản</h2>
        <button onClick={() => setCreateOpen(true)}>Thêm tài khoản</button>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <input
            placeholder="Tìm theo mã tài khoản"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={vaiTro}
            onChange={(e) => {
              setVaiTro(e.target.value);
              setPage(1);
            }}
          >
            <option value="">Tất cả vai trò</option>
            <option value="QTV">Quản trị viên</option>
            <option value="GV">Giảng viên</option>
            <option value="SV">Sinh viên</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Không có tài khoản nào.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã tài khoản</th>
                <th>Vai trò</th>
                <th>Email</th>
                <th>Trạng thái</th>
                <th>Đổi MK lần đầu</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tk) => (
                <tr key={tk.id}>
                  <td>{tk.tenDangNhap}</td>
                  <td>{VAI_TRO[tk.vaiTro]}</td>
                  <td>{tk.email || "—"}</td>
                  <td>{TRANG_THAI[tk.trangThai] || tk.trangThai}</td>
                  <td>{tk.batBuocDoiMatKhau ? "Bắt buộc" : "Đã xong"}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-edit"
                        onClick={() => {
                          setResetTarget(tk);
                          setNewPass("");
                        }}
                      >
                        Đặt lại mật khẩu
                      </button>
                      {tk.trangThai === "HOAT_DONG" ? (
                        <button
                          className="btn-delete"
                          onClick={() => setLockTarget(tk)}
                        >
                          Khóa
                        </button>
                      ) : (
                        <button className="btn-edit" onClick={() => unlock(tk)}>
                          Mở khóa
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 12,
          }}
        >
          <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Trước
          </button>
          <span>
            Trang {page}/{totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Sau
          </button>
        </div>
      </div>

      <Modal
        open={createOpen}
        title="Tạo hồ sơ & tài khoản mới"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setCreateOpen(false)}
              disabled={busy}
            >
              Hủy
            </button>
            <button disabled={busy} onClick={submitCreate}>
              {busy ? "Đang tạo..." : "Tạo tài khoản"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Vai trò *</label>
          <select
            value={form.vaiTro}
            onChange={(e) => setForm({ ...EMPTY_FORM, vaiTro: e.target.value })}
          >
            <option value="SV">Sinh viên</option>
            <option value="GV">Giảng viên</option>
          </select>
        </div>
        <div className="form-group">
          <label>
            {form.vaiTro === "SV" ? "Mã sinh viên *" : "Mã giảng viên *"}
          </label>
          <input
            placeholder={form.vaiTro === "SV" ? "VD: SV003" : "VD: GV003"}
            value={form.maDinhDanh}
            onChange={(e) => setForm({ ...form, maDinhDanh: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Họ và tên *</label>
          <input
            placeholder="Nhập họ và tên"
            value={form.hoTen}
            onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            placeholder="VD: sv003@example.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="form-group">
          <label>Khoa *</label>
          <select
            value={form.maKhoa}
            onChange={(e) => handleSelectKhoa(e.target.value)}
          >
            <option value="">-- Chọn khoa --</option>
            {khoaList.map((k) => (
              <option key={k.maKhoa} value={k.maKhoa}>
                {k.maKhoa} - {k.tenKhoa}
              </option>
            ))}
          </select>
        </div>

        {form.vaiTro === "SV" && (
          <>
            <div className="form-group">
              <label>Ngành *</label>
              <select
                value={form.maNganh}
                onChange={(e) => handleSelectNganh(e.target.value)}
              >
                <option value="">-- Chọn ngành --</option>
                {nganhTheoKhoa.map((n) => (
                  <option key={n.maNganh} value={n.maNganh}>
                    {n.maNganh} - {n.tenNganh}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Khóa học</label>
              <select
                value={form.khoaHoc}
                onChange={(e) =>
                  setForm({ ...form, khoaHoc: e.target.value, lop: "" })
                }
              >
                <option value="">-- Tất cả khóa --</option>
                {khoaHocList.map((kh) => (
                  <option key={kh} value={kh}>
                    {kh}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Lớp *</label>
              <select
                value={form.lop}
                onChange={(e) => handleSelectLop(e.target.value)}
              >
                <option value="">-- Chọn lớp --</option>
                {lopFiltered.map((l) => (
                  <option key={l.maLop} value={l.maLop}>
                    {l.tenLop}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}

        <div className="form-group">
          <label>Mật khẩu khởi tạo (để trống để tự sinh)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Tối thiểu 8 ký tự"
              value={form.matKhau}
              onChange={(e) => setForm({ ...form, matKhau: e.target.value })}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setForm({ ...form, matKhau: sinhMatKhauTam() })}
            >
              Sinh ngẫu nhiên
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        title={`Đặt lại mật khẩu: ${resetTarget?.tenDangNhap ?? ""}`}
        onClose={() => setResetTarget(null)}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setResetTarget(null)}
            >
              Hủy
            </button>
            <button disabled={busy} onClick={submitReset}>
              Đặt lại
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Mật khẩu mới (để trống để tự sinh mật khẩu tạm)</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              type="text"
              placeholder="Tối thiểu 8 ký tự"
              value={newPass}
              onChange={(e) => setNewPass(e.target.value)}
            />
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setNewPass(sinhMatKhauTam())}
            >
              Sinh ngẫu nhiên
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!createdInfo}
        title="Thông tin đăng nhập (chỉ hiển thị 1 lần)"
        onClose={() => setCreatedInfo(null)}
        footer={
          <button onClick={() => setCreatedInfo(null)}>Đã ghi nhận</button>
        }
      >
        <p style={{ marginBottom: 8 }}>
          Tài khoản cho <strong>{createdInfo?.hoTen}</strong> đã sẵn sàng. Người
          dùng sẽ phải đổi mật khẩu ở lần đăng nhập đầu tiên.
        </p>
        <div
          style={{
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <div>
            Mã tài khoản: <strong>{createdInfo?.ma}</strong>
          </div>
          <div>
            Mật khẩu tạm: <strong>{createdInfo?.matKhau}</strong>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!lockTarget}
        message={`Khóa tài khoản "${lockTarget?.tenDangNhap ?? ""}"? Người này sẽ bị đăng xuất ngay.`}
        loading={busy}
        onConfirm={confirmLock}
        onCancel={() => setLockTarget(null)}
      />
    </>
  );
}

export default TaiKhoan;
