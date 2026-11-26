import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, ClipboardCheck } from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";
import Modal from "../components/Modal";
import ConfirmDialog from "../components/ConfirmDialog";

const toList = (res) => (Array.isArray(res) ? res : res?.data || []);

export default function DeTai() {
  const user = auth.getUser() || {};
  const role = user.role || "SV";
  const canManage = role === "GV" || role === "QTV";
  const myMaGV = (user.maDinhDanh || "").trim().toUpperCase();

  const [list, setList] = useState([]);
  const [giangVien, setGiangVien] = useState([]);
  const [gvSearch, setGvSearch] = useState("");
  const [myGvName, setMyGvName] = useState("");
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    tenDeTai: "",
    moTa: "",
    maGV: "",
    soLuongToiDa: 1,
  });
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [registerTarget, setRegisterTarget] = useState(null);
  const [registering, setRegistering] = useState(false);

  const fetchList = useCallback(
    async (isCancelled = () => false) => {
      try {
        setLoading(true);
        const topicPath =
          role === "GV" && myMaGV
            ? `/de-tai?maGV=${encodeURIComponent(myMaGV)}`
            : "/de-tai";
        const requests = [api.get(topicPath)];
        if (role === "QTV") {
          requests.push(api.get("/giang-vien?size=100").catch(() => []));
        } else if (role === "GV" && myMaGV) {
          requests.push(
            api.get(`/giang-vien/${encodeURIComponent(myMaGV)}`).catch(() => null),
          );
        }
        const [data, extra] = await Promise.all(requests);
        if (isCancelled()) return;
        setList(toList(data));
        if (role === "QTV") {
          setGiangVien(toList(extra));
        } else if (role === "GV" && extra) {
          setMyGvName(extra.hoTen || extra.HoTen || "");
        }
      } catch (e) {
        if (!isCancelled()) toast.error(e.message);
      } finally {
        if (!isCancelled()) setLoading(false);
      }
    },
    [myMaGV, role, toast],
  );

  useEffect(() => {
    let cancelled = false;
    fetchList(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [fetchList]);

  const filteredGv = useMemo(() => {
    const kw = gvSearch.trim().toLowerCase();
    if (!kw) return giangVien;
    return giangVien.filter((g) =>
      `${g.maGV} ${g.hoTen} ${g.maKhoa}`.toLowerCase().includes(kw),
    );
  }, [giangVien, gvSearch]);

  const handleOpenAdd = () => {
    setForm({
      tenDeTai: "",
      moTa: "",
      maGV: role === "GV" ? myMaGV : "",
      soLuongToiDa: 1,
    });
    setGvSearch("");
    setEditingId(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setForm({
      tenDeTai: item.tenDeTai,
      moTa: item.moTa || "",
      maGV: item.maGV || "",
      soLuongToiDa: item.soLuongToiDa,
    });
    setGvSearch("");
    setEditingId(item.maDeTai);
    setModalOpen(true);
  };

  const handleOpenDelete = (item) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  const handleSave = async () => {
    if (!form.tenDeTai.trim()) {
      toast.error("Tên đề tài là bắt buộc");
      return;
    }
    if (role === "QTV" && !form.maGV) {
      toast.error("Vui lòng chọn giảng viên hướng dẫn");
      return;
    }
    const soLuong = parseInt(form.soLuongToiDa, 10);
    if (!Number.isInteger(soLuong) || soLuong < 1) {
      toast.error("Số lượng tối đa phải là số nguyên từ 1 trở lên");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        tenDeTai: form.tenDeTai.trim(),
        moTa: form.moTa,
        soLuongToiDa: soLuong,
        ...(role === "QTV" ? { maGV: form.maGV } : {}),
      };

      if (editingId) {
        await api.put(`/de-tai/${editingId}`, payload);
        toast.success("Cập nhật đề tài thành công");
      } else {
        await api.post("/de-tai", payload);
        toast.success("Thêm đề tài thành công");
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
    try {
      setDeleting(true);
      await api.delete(`/de-tai/${itemToDelete.maDeTai}`);
      toast.success("Xóa đề tài thành công");
      setDeleteOpen(false);
      fetchList();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRegister = async () => {
    if (!registerTarget) return;
    try {
      setRegistering(true);
      await api.post("/dang-ky", { maDeTai: registerTarget.maDeTai });
      toast.success("Đăng ký đề tài thành công");
      setRegisterTarget(null);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setRegistering(false);
    }
  };

  const canModifyRow = (item) =>
    role === "QTV" ||
    (role === "GV" &&
      myMaGV &&
      String(item.maGV || "").trim().toUpperCase() === myMaGV);

  return (
    <div>
      <div className="page-header">
        <h2>{role === "SV" ? "Đề tài đang mở" : "Quản lý đề tài"}</h2>
        {canManage && (
          <button onClick={handleOpenAdd}>
            <Plus size={18} />
            Thêm đề tài
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div className="loading-state">Đang tải danh sách...</div>
        ) : list.length === 0 ? (
          <div className="empty-state">Chưa có đề tài nào.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Mã ĐT</th>
                <th>Tên Đề Tài</th>
                <th>Mô Tả</th>
                <th>Giảng Viên</th>
                <th>SL Tối Đa</th>
                <th>Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((item) => (
                <tr key={item.maDeTai}>
                  <td>{item.maDeTai}</td>
                  <td>{item.tenDeTai}</td>
                  <td>{item.moTa}</td>
                  <td>
                    {item.giangVienHuongDan || "—"}
                    {item.maGV && (
                      <>
                        <br />
                        <small>{item.maGV}</small>
                      </>
                    )}
                  </td>
                  <td>{item.soLuongToiDa}</td>
                  <td>
                    <div className="table-actions">
                      {canManage ? (
                        canModifyRow(item) ? (
                          <>
                            <button
                              className="btn-edit"
                              onClick={() => handleOpenEdit(item)}
                            >
                              <Pencil size={16} />
                              Sửa
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleOpenDelete(item)}
                            >
                              <Trash2 size={16} />
                              Xóa
                            </button>
                          </>
                        ) : (
                          <small style={{ color: "#94a3b8" }}>Chỉ xem</small>
                        )
                      ) : (
                        <button
                          className="btn-edit"
                          onClick={() => setRegisterTarget(item)}
                        >
                          <ClipboardCheck size={16} />
                          Đăng ký
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title={editingId ? "Sửa đề tài" : "Thêm đề tài"}
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
          <label>Tên đề tài *</label>
          <input
            type="text"
            value={form.tenDeTai}
            onChange={(e) => setForm({ ...form, tenDeTai: e.target.value })}
            placeholder="Nhập tên đề tài"
          />
        </div>
        <div className="form-group">
          <label>Mô tả</label>
          <textarea
            value={form.moTa}
            onChange={(e) => setForm({ ...form, moTa: e.target.value })}
            placeholder="Mô tả chi tiết"
            rows={3}
          />
        </div>
        {role === "GV" ? (
          <div className="form-group">
            <label>Giảng viên hướng dẫn</label>
            <input
              type="text"
              value={myGvName ? `${myMaGV} - ${myGvName}` : myMaGV}
              disabled
            />
          </div>
        ) : (
          <div className="form-group">
            <label>Giảng viên hướng dẫn *</label>
            <input
              type="text"
              placeholder="Tìm mã, tên giảng viên hoặc khoa..."
              value={gvSearch}
              onChange={(e) => setGvSearch(e.target.value)}
              style={{ marginBottom: 8 }}
            />
            <select
              value={form.maGV}
              onChange={(e) => setForm({ ...form, maGV: e.target.value })}
            >
              <option value="">-- Chọn giảng viên --</option>
              {filteredGv.map((g) => (
                <option key={g.maGV} value={g.maGV}>
                  {g.maGV} – {g.hoTen} – {g.maKhoa}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="form-group">
          <label>Số lượng tối đa</label>
          <input
            type="number"
            min="1"
            value={form.soLuongToiDa}
            onChange={(e) => setForm({ ...form, soLuongToiDa: e.target.value })}
          />
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        message={`Bạn có chắc chắn muốn xóa đề tài "${itemToDelete?.tenDeTai}"?`}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />

      <ConfirmDialog
        open={!!registerTarget}
        title="Xác nhận đăng ký"
        message={`Bạn muốn đăng ký đề tài "${registerTarget?.tenDeTai}"?`}
        confirmText="Đăng ký"
        confirmClassName=""
        loading={registering}
        onConfirm={handleRegister}
        onCancel={() => setRegisterTarget(null)}
      />
    </div>
  );
}
