import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

const SIZE = 15;
const VAI_TRO = { QTV: "Quản trị viên", GV: "Giảng viên", SV: "Sinh viên" };
const KET_QUA = { THANH_CONG: "Thành công", THAT_BAI: "Thất bại" };
const HANH_DONG = {
  DANG_NHAP: "Đăng nhập",
  DANG_XUAT: "Đăng xuất",
  TAO_TAI_KHOAN: "Tạo tài khoản",
  DOI_MAT_KHAU: "Đổi mật khẩu",
  CAP_NHAT_HO_SO: "Cập nhật hồ sơ",
  KHOA_TAI_KHOAN: "Khóa tài khoản",
  MO_KHOA_TAI_KHOAN: "Mở khóa tài khoản",
  DAT_LAI_MAT_KHAU: "Đặt lại mật khẩu",
  DANG_KY_DE_TAI: "Đăng ký đề tài",
  HUY_DANG_KY: "Hủy đăng ký",
  DUYET_DANG_KY: "Duyệt đăng ký",
  TU_CHOI_DANG_KY: "Từ chối đăng ký",
  XOA_DANG_KY: "Xóa đăng ký",
  THEM_DE_TAI: "Thêm đề tài",
  SUA_DE_TAI: "Sửa đề tài",
  XOA_DE_TAI: "Xóa đề tài",
  THEM_SINH_VIEN: "Thêm sinh viên",
  SUA_SINH_VIEN: "Cập nhật sinh viên",
  XOA_SINH_VIEN: "Xóa sinh viên",
  IMPORT_SINH_VIEN: "Nhập Excel sinh viên",
  THEM_GIANG_VIEN: "Thêm giảng viên",
  SUA_GIANG_VIEN: "Cập nhật giảng viên",
  XOA_GIANG_VIEN: "Xóa giảng viên",
  THEM_KHOA: "Thêm khoa",
  SUA_KHOA: "Cập nhật khoa",
  XOA_KHOA: "Xóa khoa",
  THEM_NGANH: "Thêm ngành",
  SUA_NGANH: "Cập nhật ngành",
  XOA_NGANH: "Xóa ngành",
};
const BO_LOC_RONG = { tu: "", den: "", nguoiThucHien: "", hanhDong: "" };

function formatThoiGian(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}

function NhatKy() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  // boLoc: giá trị đang nhập; apDung: giá trị đã bấm "Áp dụng" (dùng để gọi API)
  const [boLoc, setBoLoc] = useState(BO_LOC_RONG);
  const [apDung, setApDung] = useState(BO_LOC_RONG);
  const [filterOpts, setFilterOpts] = useState({
    nguoiThucHien: [],
    hanhDong: [],
  });

  useEffect(() => {
    api
      .get("/nhat-ky/bo-loc")
      .then((res) =>
        setFilterOpts({
          nguoiThucHien: res?.nguoiThucHien || [],
          hanhDong: res?.hanhDong || [],
        }),
      )
      .catch(() => null);
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: SIZE });
      if (apDung.tu) {
        params.set("tu", new Date(`${apDung.tu}T00:00:00`).toISOString());
      }
      if (apDung.den) {
        params.set("den", new Date(`${apDung.den}T23:59:59`).toISOString());
      }
      if (apDung.nguoiThucHien.trim()) {
        params.set("nguoiThucHien", apDung.nguoiThucHien.trim());
      }
      if (apDung.hanhDong.trim()) {
        params.set("hanhDong", apDung.hanhDong.trim());
      }
      const res = await api.get(`/nhat-ky?${params}`);
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, apDung]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const apDungBoLoc = () => {
    setApDung(boLoc);
    setPage(1);
  };

  const xoaBoLoc = () => {
    setBoLoc(BO_LOC_RONG);
    setApDung(BO_LOC_RONG);
    setPage(1);
  };

  return (
    <>
      <div className="page-header">
        <h2>Nhật ký hoạt động</h2>
      </div>

      <div className="card">
        <div
          style={{
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            alignItems: "flex-end",
            marginBottom: 12,
          }}
        >
          <div className="form-group">
            <label>Từ ngày</label>
            <input
              type="date"
              value={boLoc.tu}
              onChange={(e) => setBoLoc({ ...boLoc, tu: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Đến ngày</label>
            <input
              type="date"
              value={boLoc.den}
              onChange={(e) => setBoLoc({ ...boLoc, den: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Người thực hiện</label>
            <select
              value={boLoc.nguoiThucHien}
              onChange={(e) =>
                setBoLoc({ ...boLoc, nguoiThucHien: e.target.value })
              }
            >
              <option value="">-- Tất cả người thực hiện --</option>
              {filterOpts.nguoiThucHien.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Hành động</label>
            <select
              value={boLoc.hanhDong}
              onChange={(e) => setBoLoc({ ...boLoc, hanhDong: e.target.value })}
            >
              <option value="">-- Tất cả hành động --</option>
              {filterOpts.hanhDong.map((h) => (
                <option key={h} value={h}>
                  {HANH_DONG[h] || h}
                </option>
              ))}
            </select>
          </div>
          <button style={{ marginBottom: 16 }} onClick={apDungBoLoc}>
            Áp dụng
          </button>
          <button
            style={{ marginBottom: 16 }}
            className="btn-secondary"
            onClick={xoaBoLoc}
          >
            Xóa lọc
          </button>
        </div>

        <div style={{ marginBottom: 8 }}>Tổng: {total}</div>

        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Không có bản ghi nào.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Thời điểm</th>
                <th>Người thực hiện</th>
                <th>Vai trò</th>
                <th>Hành động</th>
                <th>Đối tượng</th>
                <th>Kết quả</th>
                <th>IP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((nk) => (
                <tr key={nk.idNhatKy}>
                  <td>{formatThoiGian(nk.thoiDiem)}</td>
                  <td>{nk.nguoiThucHien || "—"}</td>
                  <td>{VAI_TRO[nk.vaiTro] || nk.vaiTro || "—"}</td>
                  <td>{HANH_DONG[nk.hanhDong] || nk.hanhDong}</td>
                  <td>{nk.doiTuong || "—"}</td>
                  <td>{KET_QUA[nk.ketQua] || nk.ketQua || "—"}</td>
                  <td>{nk.diaChiIp || "—"}</td>
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
    </>
  );
}

export default NhatKy;