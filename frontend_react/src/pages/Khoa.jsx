import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Khoa() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ maKhoa: "", tenKhoa: "" });
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

      const res = await api.get(`/khoa?${params.toString()}`);
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

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  const openAdd = () => {
    setEditing(null);
    setForm({ maKhoa: "", tenKhoa: "" });
    setModalOpen(true);
  };

  const openEdit = (khoa) => {
    setEditing(khoa);
    setForm({ maKhoa: khoa.maKhoa, tenKhoa: khoa.tenKhoa });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const maKhoa = form.maKhoa.trim();
    const tenKhoa = form.tenKhoa.trim();
    if (!maKhoa || !tenKhoa) {
      toast.error("Vui lòng nhập đủ Mã khoa và Tên khoa");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/khoa/${editing.maKhoa}`, { tenKhoa });
        toast.success("Cập nhật khoa thành công");
      } else {
        await api.post("/khoa", { maKhoa, tenKhoa });
        toast.success("Thêm khoa thành công");
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
      await api.delete(`/khoa/${deleteTarget.maKhoa}`);
      toast.success("Xóa khoa thành công");
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
        <h2>Quản lý Khoa</h2>
        <button onClick={openAdd}>
          <Plus size={16} /> Thêm khoa
        </button>
      </div>

      <div className="card">
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            maxWidth: 340,
          }}
        >
          <Search size={16} aria-hidden="true" />
          <input
            placeholder="Tìm theo mã hoặc tên khoa..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            style={{ padding: 8 }}
          />
        </div>

        {loading ? (
          <div className="loading-state">Đang tải dữ liệu...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">Không có khoa nào</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã Khoa</th>
                  <th>Tên Khoa</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((khoa) => (
                  <tr key={khoa.maKhoa}>
                    <td>{khoa.maKhoa}</td>
                    <td>{khoa.tenKhoa}</td>
                    <td>{khoa.trangThai}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-edit"
                          onClick={() => openEdit(khoa)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteTarget(khoa)}
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
        title={editing ? "Sửa Khoa" : "Thêm Khoa"}
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
          <label>Mã Khoa *</label>
          <input
            value={form.maKhoa}
            onChange={(e) => setForm({ ...form, maKhoa: e.target.value })}
            disabled={Boolean(editing)}
            placeholder="VD: CNTT"
          />
        </div>
        <div className="form-group">
          <label>Tên Khoa *</label>
          <input
            value={form.tenKhoa}
            onChange={(e) => setForm({ ...form, tenKhoa: e.target.value })}
            placeholder="VD: Công nghệ thông tin"
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Bạn có chắc muốn xóa khoa "${deleteTarget?.tenKhoa}" (${deleteTarget?.maKhoa})?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
