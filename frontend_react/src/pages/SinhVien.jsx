import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function SinhVien() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [nganhOptions, setNganhOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    MaSV: "",
    hoTen: "",
    email: "",
    lop: "",
    maNganh: "",
    gpa: "",
  });
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        size: "10",
      });
      if (search.trim()) params.set("q", search.trim());

      const res = await api.get(`/sinh-vien?${params.toString()}`);
      const pages = Math.max(res.totalPages || 0, 1);
      setList(res.data ?? []);
      setTotalPages(pages);
      if (page > pages) setPage(pages);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  const fetchNganhOptions = useCallback(async () => {
    try {
      const res = await api.get("/nganh?size=100");
      setNganhOptions(res.data ?? []);
    } catch (e) {
      toast.error(`Không tải được danh sách ngành: ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchNganhOptions();
  }, [fetchNganhOptions]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      MaSV: "",
      hoTen: "",
      email: "",
      lop: "",
      maNganh: nganhOptions[0]?.maNganh ?? "",
      gpa: "",
    });
    setModalOpen(true);
  };

  const openEdit = (sv) => {
    setEditing(sv);
    setForm({
      MaSV: sv.MaSV,
      hoTen: sv.hoTen ?? "",
      email: sv.email ?? "",
      lop: sv.lop ?? "",
      maNganh: sv.maNganh ?? "",
      gpa: sv.gpa == null ? "" : String(sv.gpa),
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const MaSV = form.MaSV.trim();
    const hoTen = form.hoTen.trim();
    if (!MaSV || !hoTen) {
      toast.error("Vui lòng nhập Mã SV và Họ tên");
      return;
    }

    const gpa = form.gpa.trim() ? Number(form.gpa) : null;
    if (gpa !== null && (!Number.isFinite(gpa) || gpa < 0 || gpa > 4)) {
      toast.error("GPA phải là số từ 0 đến 4");
      return;
    }

    const data = {
      hoTen,
      email: form.email.trim() || null,
      lop: form.lop.trim() || null,
      maNganh: form.maNganh || null,
      gpa,
    };

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/sinh-vien/${editing.MaSV}`, data);
        toast.success("Cập nhật sinh viên thành công");
      } else {
        await api.post("/sinh-vien", { MaSV, ...data });
        toast.success("Thêm sinh viên thành công");
      }
      setModalOpen(false);
      fetchList();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/sinh-vien/${deleteTarget.MaSV}`);
      toast.success("Xóa sinh viên thành công");
      setDeleteTarget(null);
      fetchList();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <h2>Quản lý Sinh viên</h2>
        <button onClick={openAdd}>
          <Plus size={16} /> Thêm sinh viên
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Tìm theo mã hoặc tên sinh viên..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ maxWidth: 300, padding: 8 }}
          />
        </div>

        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">Không có sinh viên nào</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã SV</th>
                  <th>Họ Tên</th>
                  <th>Lớp</th>
                  <th>Mã Ngành</th>
                  <th>GPA</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((sv) => (
                  <tr key={sv.MaSV}>
                    <td>{sv.MaSV}</td>
                    <td>{sv.hoTen}</td>
                    <td>{sv.lop || "—"}</td>
                    <td>{sv.maNganh || "—"}</td>
                    <td>{sv.gpa ?? "—"}</td>
                    <td>{sv.trangThai}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-edit"
                          onClick={() => openEdit(sv)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteTarget(sv)}
                        >
                          <Trash2 size={14} /> Xóa
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                disabled={page === 1}
                onClick={() => setPage((current) => current - 1)}
              >
                Trang trước
              </button>
              <span style={{ alignSelf: "center" }}>
                Trang {page} / {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((current) => current + 1)}
              >
                Trang sau
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Sửa Sinh viên" : "Thêm Sinh viên"}
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
              {saving ? "Đang lưu..." : "Lưu"}
            </button>
          </>
        }
      >
        <div className="form-group">
          <label>Mã Sinh viên *</label>
          <input
            value={form.MaSV}
            onChange={(e) => setForm({ ...form, MaSV: e.target.value })}
            disabled={Boolean(editing)}
            placeholder="VD: SV001"
          />
        </div>
        <div className="form-group">
          <label>Họ Tên *</label>
          <input
            value={form.hoTen}
            onChange={(e) => setForm({ ...form, hoTen: e.target.value })}
            placeholder="VD: Nguyễn Văn A"
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="sv@example.com"
          />
        </div>
        <div className="form-group">
          <label>Lớp</label>
          <input
            value={form.lop}
            onChange={(e) => setForm({ ...form, lop: e.target.value })}
            placeholder="VD: K46D"
          />
        </div>
        <div className="form-group">
          <label>Thuộc Ngành</label>
          <select
            value={form.maNganh}
            onChange={(e) => setForm({ ...form, maNganh: e.target.value })}
          >
            <option value="">-- Chọn Ngành --</option>
            {nganhOptions.map((nganh) => (
              <option key={nganh.maNganh} value={nganh.maNganh}>
                {nganh.maNganh} - {nganh.tenNganh}
              </option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>Điểm GPA (Hệ 4)</label>
          <input
            type="number"
            step="0.01"
            min="0"
            max="4"
            value={form.gpa}
            onChange={(e) => setForm({ ...form, gpa: e.target.value })}
            placeholder="VD: 3.5"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Bạn có chắc muốn xóa sinh viên "${deleteTarget?.hoTen}" (${deleteTarget?.MaSV})?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
