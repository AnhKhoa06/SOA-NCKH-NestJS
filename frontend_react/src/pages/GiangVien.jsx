import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function GiangVien() {
  const toast = useToast();
  const [list, setList] = useState([]);
  const [khoaOptions, setKhoaOptions] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    maGV: "",
    hoTen: "",
    email: "",
    maKhoa: "",
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

      const res = await api.get(`/giang-vien?${params.toString()}`);
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

  const fetchKhoaOptions = useCallback(async () => {
    try {
      const res = await api.get("/khoa?size=100");
      setKhoaOptions(res.data ?? []);
    } catch (e) {
      toast.error(`Không tải được danh sách khoa: ${e.message}`);
    }
  }, [toast]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  useEffect(() => {
    fetchKhoaOptions();
  }, [fetchKhoaOptions]);

  const openAdd = () => {
    setEditing(null);
    setForm({
      maGV: "",
      hoTen: "",
      email: "",
      maKhoa: khoaOptions[0]?.maKhoa ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (gv) => {
    setEditing(gv);
    setForm({
      maGV: gv.maGV,
      hoTen: gv.hoTen,
      email: gv.email ?? "",
      maKhoa: gv.maKhoa,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const maGV = form.maGV.trim();
    const hoTen = form.hoTen.trim();
    if (!maGV || !hoTen || !form.maKhoa) {
      toast.error("Vui lòng nhập đủ thông tin");
      return;
    }

    const email = form.email.trim() || null;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/giang-vien/${editing.maGV}`, {
          hoTen,
          email,
          maKhoa: form.maKhoa,
        });
        toast.success("Cập nhật giảng viên thành công");
      } else {
        await api.post("/giang-vien", { maGV, hoTen, email, maKhoa: form.maKhoa });
        toast.success("Thêm giảng viên thành công");
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
      await api.delete(`/giang-vien/${deleteTarget.maGV}`);
      toast.success("Xóa giảng viên thành công");
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
        <h2>Quản lý Giảng viên</h2>
        <button onClick={openAdd}>
          <Plus size={16} /> Thêm giảng viên
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Tìm theo mã hoặc tên giảng viên..."
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
          <div className="empty-state">Không có giảng viên nào</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã GV</th>
                  <th>Họ Tên</th>
                  <th>Email</th>
                  <th>Mã Khoa</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((gv) => (
                  <tr key={gv.maGV}>
                    <td>{gv.maGV}</td>
                    <td>{gv.hoTen}</td>
                    <td>{gv.email || "—"}</td>
                    <td>{gv.maKhoa}</td>
                    <td>{gv.trangThai}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-edit"
                          onClick={() => openEdit(gv)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteTarget(gv)}
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
        title={editing ? "Sửa Giảng viên" : "Thêm Giảng viên"}
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
          <label>Mã Giảng viên *</label>
          <input
            value={form.maGV}
            onChange={(e) => setForm({ ...form, maGV: e.target.value })}
            disabled={Boolean(editing)}
            placeholder="VD: GV002"
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
            placeholder="gv@example.com"
          />
        </div>
        <div className="form-group">
          <label>Thuộc Khoa *</label>
          <select
            value={form.maKhoa}
            onChange={(e) => setForm({ ...form, maKhoa: e.target.value })}
          >
            <option value="">-- Chọn Khoa --</option>
            {khoaOptions.map((khoa) => (
              <option key={khoa.maKhoa} value={khoa.maKhoa}>
                {khoa.maKhoa} - {khoa.tenKhoa}
              </option>
            ))}
          </select>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        message={`Bạn có chắc muốn xóa giảng viên "${deleteTarget?.hoTen}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
