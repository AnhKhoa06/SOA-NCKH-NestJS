import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  Download,
  Filter,
  GraduationCap,
  RefreshCw,
  Search,
  ShieldAlert,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";

function ThongKeSinhVien() {
  const toast = useToast();
  const user = auth.getUser() || {};
  const isQtv = user.role === "QTV";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    tongSinhVien: 0,
    soDaDangKy: 0,
    soChuaDangKy: 0,
    tyLeDaDangKy: 0,
    thongKeTheoNganh: [],
    thongKeTheoLop: [],
    danhSachChuaDangKy: [],
    totalChuaDangKy: 0,
    page: 1,
    size: 15,
    totalPages: 1,
  });

  const [filter, setFilter] = useState({
    maNganh: "",
    lop: "",
    page: 1,
  });

  const loadData = useCallback(async () => {
    if (!isQtv) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(filter.page),
        size: "15",
      });
      if (filter.maNganh) params.set("maNganh", filter.maNganh);
      if (filter.lop) params.set("lop", filter.lop);

      const res = await api.get(`/bao-cao/sinh-vien?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message || "Không thể tải thống kê sinh viên");
    } finally {
      setLoading(false);
    }
  }, [filter, isQtv]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!isQtv) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <ShieldAlert size={48} style={{ color: "#ef4444", marginBottom: "16px" }} />
        <h3 style={{ fontSize: "18px", color: "#1e293b", margin: "0 0 8px" }}>
          Quyền truy cập bị giới hạn
        </h3>
        <p style={{ color: "#64748b", fontSize: "14px", maxWidth: "450px", margin: "0 auto" }}>
          Chức năng Thống kê tình hình đăng ký của sinh viên (FR-18) chỉ dành riêng cho Quản trị viên (QTV).
        </p>
      </div>
    );
  }

  const handleExportCsv = async () => {
    try {
      toast.info("Đang tạo danh sách sinh viên chưa đăng ký...");
      const params = new URLSearchParams({
        loai: "sinh-vien-chua-dang-ky",
        dinhDang: "json",
      });
      if (filter.maNganh) params.set("maNganh", filter.maNganh);
      const res = await api.get(`/bao-cao/xuat?${params}`);

      if (res?.data && res.data.length > 0) {
        const keys = ["maSV", "hoTen", "lop", "maNganh", "gpa", "trangThai"];
        const headers = ["Mã SV", "Họ và tên", "Lớp", "Ngành", "GPA", "Trạng thái"];
        const csvContent =
          "\uFEFF" +
          headers.join(",") +
          "\r\n" +
          res.data
            .map((row) =>
              keys
                .map((k) => `"${String(row[k] ?? "").replace(/"/g, '""')}"`)
                .join(","),
            )
            .join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `SinhVien_ChuaDangKy_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Xuất danh sách sinh viên thành công!");
      } else {
        toast.warning("Không có sinh viên chưa đăng ký trong danh sách");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi xuất danh sách");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Thống kê tiến độ đăng ký của sinh viên
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Tỷ lệ tham gia NCKH theo ngành, lớp và danh sách sinh viên chưa đăng ký đề tài (FR-18)
          </div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={handleExportCsv}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "#10b981",
              color: "white",
              borderRadius: "8px",
              border: "none",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 600,
            }}
          >
            <Download size={15} />
            Xuất DS nhắc nhở
          </button>
          <button
            className="btn-secondary"
            onClick={loadData}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "white",
              color: "#475569",
              border: "1px solid #cbd5e1",
              borderRadius: "8px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Tải lại
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="card" style={{ padding: "18px", margin: 0, display: "flex", gap: "14px", alignItems: "center" }}>
          <div style={{ padding: "12px", background: "#eff6ff", color: "#2563eb", borderRadius: "10px" }}>
            <Users size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>TỔNG SINH VIÊN</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "2px" }}>
              {data.tongSinhVien}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Thuộc phạm vi xét NCKH</div>
          </div>
        </div>

        <div className="card" style={{ padding: "18px", margin: 0, display: "flex", gap: "14px", alignItems: "center" }}>
          <div style={{ padding: "12px", background: "#ecfdf5", color: "#10b981", borderRadius: "10px" }}>
            <UserCheck size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>ĐÃ ĐĂNG KÝ ĐỀ TÀI</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981", marginTop: "2px" }}>
              {data.soDaDangKy}{" "}
              <span style={{ fontSize: "14px", fontWeight: 500, color: "#059669" }}>
                ({data.tyLeDaDangKy}%)
              </span>
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Có đăng ký chờ duyệt / đã duyệt</div>
          </div>
        </div>

        <div className="card" style={{ padding: "18px", margin: 0, display: "flex", gap: "14px", alignItems: "center" }}>
          <div style={{ padding: "12px", background: "#fef2f2", color: "#ef4444", borderRadius: "10px" }}>
            <UserX size={24} />
          </div>
          <div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>CHƯA ĐĂNG KÝ</div>
            <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444", marginTop: "2px" }}>
              {data.soChuaDangKy}
            </div>
            <div style={{ fontSize: "11px", color: "#94a3b8" }}>Cần gửi thông báo nhắc hạn</div>
          </div>
        </div>
      </div>

      {/* Thống kê theo Ngành & Lớp */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "20px",
          marginBottom: "24px",
        }}
      >
        {/* Theo Ngành */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", marginBottom: "14px" }}>
            Tỷ lệ đăng ký theo chuyên ngành
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.thongKeTheoNganh.map((item) => (
              <div key={item.maNganh}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{item.maNganh}</span>
                  <span style={{ color: "#64748b" }}>
                    {item.daDangKy}/{item.tongSV} SV ({item.tyLeDaDangKy}%)
                  </span>
                </div>
                <div style={{ height: "7px", background: "#f1f5f9", borderRadius: "8px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${item.tyLeDaDangKy}%`,
                      height: "100%",
                      background: item.tyLeDaDangKy >= 80 ? "#10b981" : item.tyLeDaDangKy >= 50 ? "#3b82f6" : "#f59e0b",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Theo Lớp */}
        <div className="card" style={{ margin: 0 }}>
          <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#1e293b", marginBottom: "14px" }}>
            Tỷ lệ đăng ký theo lớp sinh hoạt
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {data.thongKeTheoLop.map((item) => (
              <div key={item.lop}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                  <span style={{ fontWeight: 600, color: "#334155" }}>{item.lop}</span>
                  <span style={{ color: "#64748b" }}>
                    {item.daDangKy}/{item.tongSV} SV ({item.tyLeDaDangKy}%)
                  </span>
                </div>
                <div style={{ height: "7px", background: "#f1f5f9", borderRadius: "8px", overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${item.tyLeDaDangKy}%`,
                      height: "100%",
                      background: item.tyLeDaDangKy >= 80 ? "#10b981" : item.tyLeDaDangKy >= 50 ? "#3b82f6" : "#f59e0b",
                      borderRadius: "8px",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Danh sách sinh viên chưa đăng ký */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Danh sách sinh viên chưa đăng ký đề tài
            </h3>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>
              Tổng cộng {data.totalChuaDangKy} sinh viên chưa có đề tài NCKH
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <select
              value={filter.maNganh}
              onChange={(e) => setFilter((f) => ({ ...f, maNganh: e.target.value, page: 1 }))}
              style={{ padding: "6px 10px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "12px" }}
            >
              <option value="">Tất cả ngành</option>
              <option value="CNTT">CNTT</option>
              <option value="KTPM">KTPM</option>
              <option value="HTTT">HTTT</option>
              <option value="KHMT">KHMT</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "10px", color: "#2563eb" }} />
            <div>Đang tải danh sách sinh viên...</div>
          </div>
        ) : data.danhSachChuaDangKy.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#10b981" }}>
            <UserCheck size={36} style={{ marginBottom: "10px" }} />
            <div style={{ fontWeight: 600 }}>Tất cả sinh viên trong bộ lọc đã đăng ký đề tài!</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "120px" }}>MÃ SINH VIÊN</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>HỌ VÀ TÊN</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "130px" }}>LỚP</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "110px" }}>NGÀNH</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", width: "100px" }}>GPA</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", width: "130px" }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {data.danhSachChuaDangKy.map((sv) => (
                  <tr key={sv.maSV} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#2563eb" }}>
                      {sv.maSV}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 600, color: "#1e293b" }}>
                      {sv.hoTen || "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "#475569" }}>
                      {sv.lop || "—"}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", fontWeight: 500, fontSize: "12px" }}>
                        {sv.maNganh || "—"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: sv.gpa >= 3.2 ? "#10b981" : sv.gpa >= 2.5 ? "#3b82f6" : "#64748b" }}>
                      {sv.gpa != null ? Number(sv.gpa).toFixed(2) : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "3px 8px",
                          borderRadius: "10px",
                          fontSize: "11px",
                          fontWeight: 600,
                          background: "#fee2e2",
                          color: "#ef4444",
                        }}
                      >
                        Chưa đăng ký
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Phân trang */}
        {data.totalPages > 1 && (
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "12px 20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ fontSize: "12px", color: "#64748b" }}>
              Hiển thị {data.danhSachChuaDangKy.length} / {data.totalChuaDangKy} sinh viên (Trang {data.page}/{data.totalPages})
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={data.page <= 1}
                onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: data.page <= 1 ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                Trước
              </button>
              <button
                disabled={data.page >= data.totalPages}
                onClick={() => setFilter((f) => ({ ...f, page: f.page + 1 }))}
                style={{
                  padding: "4px 10px",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  cursor: data.page >= data.totalPages ? "not-allowed" : "pointer",
                  fontSize: "12px",
                }}
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ThongKeSinhVien;
