import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Check, X, Trash2 } from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const STATUS = {
  CHO_DUYET: { label: "Chờ duyệt", cls: "badge warning" },
  DA_DUYET: { label: "Đã duyệt", cls: "badge success" },
  BI_TU_CHOI: { label: "Từ chối", cls: "badge danger" },
  DA_HUY: { label: "Đã hủy", cls: "badge" },
  "Cho duyet": { label: "Chờ duyệt", cls: "badge warning" },
  "Da duyet": { label: "Đã duyệt", cls: "badge success" },
  "Tu choi": { label: "Từ chối", cls: "badge danger" },
};

const EMPTY_FORM = { maDeTai: "" };

const toList = (res) => (Array.isArray(res) ? res : res?.data || []);

function DangKy() {
  const toast = useToast();
  const user = auth.getUser() || {};
  const role = user.role || "SV";

  const [list, setList] = useState([]);
  const [sinhVien, setSinhVien] = useState([]);
  const [deTai, setDeTai] = useState([]);
  const [myMaSV, setMyMaSV] = useState(user.maDinhDanh || "");
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [rejecting, setRejecting] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  const load = useCallback(
    async (isCancelled = () => false) => {
      try {
        if (role === "SV") {
          let maSV = user.maDinhDanh;
          if (!maSV) {
            const me = await api.get("/tai-khoan/me").catch(() => null);
            maSV = me?.maDinhDanh || "";
          }
          if (!isCancelled()) setMyMaSV(maSV);

          const [dk, svProfile, dt] = await Promise.all([
            api.get("/dang-ky"),
            maSV
              ? api.get(`/sinh-vien/${encodeURIComponent(maSV)}`).catch(() => null)
              : Promise.resolve(null),
            api.get("/de-tai"),
          ]);
          if (isCancelled()) return;
          setList(toList(dk));
          setSinhVien(svProfile ? [svProfile] : []);
          setDeTai(toList(dt));
        } else {
          const [dk, sv, dt] = await Promise.all([
            api.get("/dang-ky"),
            api.get("/sinh-vien"),
            api.get("/de-tai"),
          ]);
          if (isCancelled()) return;
          setList(toList(dk));
          setSinhVien(toList(sv));
          setDeTai(toList(dt));
        }
      } catch (e) {
        if (!isCancelled()) toast.error(e.message);
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [role, toast, user.maDinhDanh],
  );

  useEffect(() => {
    let cancelled = false;
    load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  const svMap = useMemo(
    () => Object.fromEntries(sinhVien.map((s) => [s.MaSV || s.maSV, s])),
    [sinhVien],
  );
  const dtMap = useMemo(
    () => Object.fromEntries(deTai.map((d) => [d.maDeTai, d])),
    [deTai],
  );

  const used = useMemo(() => {
    const m = {};
    list.forEach((d) => {
      if (d.trangThai !== "BI_TU_CHOI" && d.trangThai !== "DA_HUY" && d.trangThai !== "Tu choi") {
        m[d.maDeTai] = (m[d.maDeTai] || 0) + 1;
      }
    });
    return m;
  }, [list]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.maDeTai) {
      toast.error("Vui lòng chọn đề tài");
      return;
    }
    setSaving(true);
    try {
      await api.post("/dang-ky", {
        maDeTai: Number(form.maDeTai),
      });
      toast.success("Đăng ký đề tài thành công");
      setModalOpen(false);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async (item) => {
    try {
      await api.patch(`/dang-ky/${item.maDangKy}/duyet`);
      toast.success("Đã duyệt đăng ký");
      await load();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error("Vui lòng nhập lý do từ chối");
      return;
    }
    setRejectLoading(true);
    try {
      await api.patch(`/dang-ky/${rejecting.maDangKy}/tu-choi`, {
        lyDo: rejectReason.trim(),
      });
      toast.success("Đã từ chối đăng ký");
      setRejecting(null);
      setRejectReason("");
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRejectLoading(false);
    }
  };

  const handleDeleteOrCancel = async () => {
    setDeleteLoading(true);
    try {
      if (role === "SV") {
        await api.patch(`/dang-ky/${deleting.maDangKy}/huy`);
        toast.success("Đã hủy đăng ký");
      } else {
        await api.delete(`/dang-ky/${deleting.maDangKy}`);
        toast.success("Đã xóa đăng ký");
      }
      setDeleting(null);
      await load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const formatDate = (v) => (v ? new Date(v).toLocaleString("vi-VN") : "");
  const isPending = (st) => st === "CHO_DUYET" || st === "Cho duyet";

  const pageTitle =
    role === "SV"
      ? "Đăng ký của tôi"
      : role === "GV"
        ? "Duyệt đăng ký"
        : "Quản lý đăng ký";

  return (
    <div>
      <div className="page-header">
        <h2>{pageTitle}</h2>
        {role === "SV" && (
          <button onClick={openAdd}>
            <Plus size={18} />
            Đăng ký đề tài
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">Chưa có đăng ký nào.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã ĐK</th>
                <th>Sinh viên</th>
                <th>Đề tài</th>
                <th>Giảng viên</th>
                <th>Ngày đăng ký</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => {
                const st = STATUS[item.trangThai] || {
                  label: item.trangThai,
                  cls: "badge",
                };
                const sv = svMap[item.maSV];
                const dt = dtMap[item.maDeTai];
                const svName =
                  sv?.hoTen || item.tenSV || (role === "SV" ? user.username : "(chưa có tên)");
                const dtName = dt?.tenDeTai || item.tenDeTai || `Đề tài ${item.maDeTai}`;

                return (
                  <tr key={item.maDangKy}>
                    <td>{item.maDangKy}</td>
                    <td>
                      {svName} <br />
                      <small>{item.maSV}</small>
                    </td>
                    <td>{dtName}</td>
                    <td>
                      {dt?.giangVienHuongDan || "—"}
                      {dt?.maGV && (
                        <>
                          <br />
                          <small>{dt.maGV}</small>
                        </>
                      )}
                    </td>
                    <td>{formatDate(item.ngayDangKy)}</td>
                    <td>
                      <span className={st.cls}>{st.label}</span>
                    </td>
                    <td>
                      <div className="table-actions">
                        {role === "GV" && isPending(item.trangThai) && (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => handleApprove(item)}
                            >
                              <Check size={16} />
                              Duyệt
                            </button>
                            <button
                              className="btn-secondary"
                              onClick={() => {
                                setRejecting(item);
                                setRejectReason("");
                              }}
                            >
                              <X size={16} />
                              Từ chối
                            </button>
                          </>
                        )}
                        {role === "SV" && isPending(item.trangThai) && (
                          <button
                            className="btn-delete"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 size={16} />
                            Hủy
                          </button>
                        )}
                        {role === "QTV" && (
                          <button
                            className="btn-delete"
                            onClick={() => setDeleting(item)}
                          >
                            <Trash2 size={16} />
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Đăng ký đề tài"
        onClose={() => setModalOpen(false)}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setModalOpen(false)}
              disabled={saving}
            >
              Hủy
            </button>
            <button onClick={handleSave} disabled={saving}>
              {saving ? "Đang lưu..." : "Đăng ký"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Mã sinh viên</label>
          <input type="text" value={myMaSV || user.username || ""} disabled />
        </div>
        <div className="form-group">
          <label>Đề tài *</label>
          <select
            value={form.maDeTai}
            onChange={(e) => setForm({ ...form, maDeTai: e.target.value })}
          >
            <option value="">-- Chọn đề tài --</option>
            {deTai.map((d) => {
              const conLai = d.soLuongToiDa - (used[d.maDeTai] || 0);
              return (
                <option key={d.maDeTai} value={d.maDeTai}>
                  {d.tenDeTai} (còn {Math.max(conLai, 0)}/{d.soLuongToiDa} chỗ)
                </option>
              );
            })}
          </select>
        </div>
      </Modal>

      <Modal
        open={!!rejecting}
        title="Từ chối đăng ký"
        onClose={() => setRejecting(null)}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setRejecting(null)}
              disabled={rejectLoading}
            >
              Hủy
            </button>
            <button
              className="btn-delete-solid"
              onClick={handleReject}
              disabled={rejectLoading}
            >
              {rejectLoading ? "Đang xử lý..." : "Xác nhận từ chối"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Lý do từ chối *</label>
          <textarea
            rows={3}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Nhập lý do từ chối đăng ký"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title={role === "SV" ? "Xác nhận hủy đăng ký" : "Xác nhận xóa"}
        message={
          deleting
            ? `Hủy đăng ký #${deleting.maDangKy} của sinh viên ${deleting.maSV}?`
            : ""
        }
        confirmText={role === "SV" ? "Hủy đăng ký" : "Xóa"}
        loading={deleteLoading}
        onConfirm={handleDeleteOrCancel}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}

export default DangKy;
