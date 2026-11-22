import { useCallback, useEffect, useState } from "react";
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
  tenDangNhap: "",
  matKhau: "",
  vaiTro: "SV",
  maDinhDanh: "",
};

function TaiKhoan() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vaiTro, setVaiTro] = useState("");
  const [q, setQ] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [lockTarget, setLockTarget] = useState(null);
  const [resetTarget, setResetTarget] = useState(null);
  const [newPass, setNewPass] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: 10 });
      if (vaiTro) params.set("vaiTro", vaiTro);
      if (q.trim()) params.set("q", q.trim());
      const res = await api.get(`/tai-khoan?${params}`);
      setRows(res.data);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, vaiTro, q]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const run = async (fn, okMsg, after) => {
    setBusy(true);
    try {
      await fn();
      toast.success(okMsg);
      after?.();
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const submitCreate = () =>
    run(
      () => api.post("/tai-khoan", form),
      "Đã tạo tài khoản",
      () => {
        setCreateOpen(false);
        setForm(EMPTY_FORM);
      },
    );

  const submitReset = () =>
    run(
      () =>
        api.patch(`/tai-khoan/${resetTarget.id}/dat-lai-mat-khau`, {
          matKhauMoi: newPass,
        }),
      "Đã đặt lại mật khẩu",
      () => {
        setResetTarget(null);
        setNewPass("");
      },
    );

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
            placeholder="Tìm theo tên đăng nhập"
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
                <th>Tên đăng nhập</th>
                <th>Vai trò</th>
                <th>Mã định danh</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((tk) => (
                <tr key={tk.id}>
                  <td>{tk.tenDangNhap}</td>
                  <td>{VAI_TRO[tk.vaiTro]}</td>
                  <td>{tk.maDinhDanh || "—"}</td>
                  <td>{TRANG_THAI[tk.trangThai] || tk.trangThai}</td>
                  <td>
                    <div className="table-actions">
                      <button
                        className="btn-edit"
                        onClick={() => setResetTarget(tk)}
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
        title="Thêm tài khoản"
        onClose={() => setCreateOpen(false)}
        footer={
          <>
            <button onClick={() => setCreateOpen(false)}>Hủy</button>
            <button disabled={busy} onClick={submitCreate}>
              Tạo
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Tên đăng nhập</label>
          <input
            value={form.tenDangNhap}
            onChange={(e) => setForm({ ...form, tenDangNhap: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Mật khẩu</label>
          <input
            type="password"
            value={form.matKhau}
            onChange={(e) => setForm({ ...form, matKhau: e.target.value })}
          />
        </div>
        <div className="form-group">
          <label>Vai trò</label>
          <select
            value={form.vaiTro}
            onChange={(e) => setForm({ ...form, vaiTro: e.target.value })}
          >
            <option value="SV">Sinh viên</option>
            <option value="GV">Giảng viên</option>
          </select>
        </div>
        <div className="form-group">
          <label>
            {form.vaiTro === "SV" ? "Mã sinh viên" : "Mã giảng viên"}
          </label>
          <input
            value={form.maDinhDanh}
            onChange={(e) => setForm({ ...form, maDinhDanh: e.target.value })}
          />
        </div>
      </Modal>

      <Modal
        open={!!resetTarget}
        title={`Đặt lại mật khẩu: ${resetTarget?.tenDangNhap ?? ""}`}
        onClose={() => setResetTarget(null)}
        footer={
          <>
            <button onClick={() => setResetTarget(null)}>Hủy</button>
            <button disabled={busy} onClick={submitReset}>
              Đặt lại
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Mật khẩu mới</label>
          <input
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
          />
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
