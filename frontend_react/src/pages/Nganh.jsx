import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { api } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

export default function Nganh() {
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
    maNganh: "",
    tenNganh: "",
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

      const res = await api.get(`/nganh?${params.toString()}`);
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
      maNganh: "",
      tenNganh: "",
      maKhoa: khoaOptions[0]?.maKhoa ?? "",
    });
    setModalOpen(true);
  };

  const openEdit = (nganh) => {
    setEditing(nganh);
    setForm({
      maNganh: nganh.maNganh,
      tenNganh: nganh.tenNganh,
      maKhoa: nganh.maKhoa,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const maNganh = form.maNganh.trim();
    const tenNganh = form.tenNganh.trim();
    if (!maNganh || !tenNganh || !form.maKhoa) {
      toast.error("Vui lòng nhập đủ thông tin");
      return;
    }

    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/nganh/${editing.maNganh}`, {
          tenNganh,
          maKhoa: form.maKhoa,
        });
        toast.success("Cập nhật ngành thành công");
      } else {
        await api.post("/nganh", { maNganh, tenNganh, maKhoa: form.maKhoa });
        toast.success("Thêm ngành thành công");
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
      await api.delete(`/nganh/${deleteTarget.maNganh}`);
      toast.success("Xóa ngành thành công");
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
        <h2>Quản lý Ngành</h2>
        <button onClick={openAdd}>
          <Plus size={16} /> Thêm ngành
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 16 }}>
          <input
            placeholder="Tìm theo mã hoặc tên ngành..."
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
          <div className="empty-state">Không có ngành nào</div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Mã Ngành</th>
                  <th>Tên Ngành</th>
                  <th>Mã Khoa</th>
                  <th>Trạng thái</th>
                  <th style={{ width: 140 }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {list.map((nganh) => (
                  <tr key={nganh.maNganh}>
                    <td>{nganh.maNganh}</td>
                    <td>{nganh.tenNganh}</td>
                    <td>{nganh.maKhoa}</td>
                    <td>{nganh.trangThai}</td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="btn-edit"
                          onClick={() => openEdit(nganh)}
                        >
                          <Pencil size={14} /> Sửa
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => setDeleteTarget(nganh)}
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
        title={editing ? "Sửa Ngành" : "Thêm Ngành"}
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
          <label>Mã Ngành *</label>
          <input
            value={form.maNganh}
            onChange={(e) => setForm({ ...form, maNganh: e.target.value })}
            disabled={Boolean(editing)}
            placeholder="VD: KTPM"
          />
        </div>
        <div className="form-group">
          <label>Tên Ngành *</label>
          <input
            value={form.tenNganh}
            onChange={(e) => setForm({ ...form, tenNganh: e.target.value })}
            placeholder="VD: Kỹ thuật phần mềm"
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
        message={`Bạn có chắc muốn xóa ngành "${deleteTarget?.tenNganh}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
