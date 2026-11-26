import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  BarChart3,
  Download,
  Filter,
  RefreshCw,
  Search,
} from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";

const TRANG_THAI_MAP = {
  CHO_DUYET: { label: "Chờ duyệt", color: "#f59e0b", bg: "#fef3c7" },
  DANG_MO: { label: "Đang mở", color: "#10b981", bg: "#d1fae5" },
  DA_DONG: { label: "Đã đóng", color: "#64748b", bg: "#f1f5f9" },
  DANG_THUC_HIEN: { label: "Đang làm", color: "#3b82f6", bg: "#dbeafe" },
  CHO_NGHIEM_THU: { label: "Chờ nghiệm thu", color: "#8b5cf6", bg: "#ede9fe" },
  DA_NGHIEM_THU: { label: "Đã nghiệm thu", color: "#059669", bg: "#ecfdf5" },
  BI_TU_CHOI: { label: "Từ chối", color: "#dc2626", bg: "#fee2e2" },
  DA_HUY: { label: "Đã hủy", color: "#ef4444", bg: "#fee2e2" },
};

function ThongKeDeTai() {
  const toast = useToast();
  const user = auth.getUser() || {};
  const isQtv = user.role === "QTV";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    data: [],
    total: 0,
    page: 1,
    size: 15,
    totalPages: 1,
    tongChiTieu: 0,
    tongDaDuyet: 0,
    tyLeLapDayTrungBinh: 0,
    soDeTaiChuaCoSinhVien: 0,
    thongKeTheoNganh: [],
    thongKeTheoGiangVien: [],
  });

  const [filter, setFilter] = useState({
    maNganh: "",
    maGV: "",
    trangThai: "",
    page: 1,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(filter.page),
        size: "15",
      });
      if (filter.maNganh) params.set("maNganh", filter.maNganh);
      if (filter.maGV && isQtv) params.set("maGV", filter.maGV);
      if (filter.trangThai) params.set("trangThai", filter.trangThai);

      const res = await api.get(`/bao-cao/de-tai?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message || "Không thể tải dữ liệu thống kê đề tài");
    } finally {
      setLoading(false);
    }
  }, [filter, isQtv]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      toast.info("Đang tạo file xuất...");
      const params = new URLSearchParams({ loai: "de-tai", dinhDang: "json" });
      if (filter.maNganh) params.set("maNganh", filter.maNganh);
      const res = await api.get(`/bao-cao/xuat?${params}`);

      if (res?.data && res.data.length > 0) {
        // Xuất file CSV từ dữ liệu json trả về
        const keys = Object.keys(res.data[0]);
        const csvContent =
          "\uFEFF" +
          keys.join(",") +
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
        a.download = `BaoCao_DeTai_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Xuất file báo cáo thành công!");
      } else {
        toast.warning("Không có dữ liệu để xuất");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi xuất báo cáo");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Thống kê đề tài nghiên cứu khoa học
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Tỷ lệ lấp đầy chỉ tiêu theo đề tài, chuyên ngành và giảng viên hướng dẫn (FR-17)
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
            Xuất Excel/CSV
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
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "16px",
          marginBottom: "20px",
        }}
      >
        <div className="card" style={{ padding: "16px", margin: 0 }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>TỔNG ĐỀ TÀI</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#1e293b", marginTop: "4px" }}>
            {data.total}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Đang quản lý trong hệ thống
          </div>
        </div>

        <div className="card" style={{ padding: "16px", margin: 0 }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>CHỈ TIÊU & ĐÃ DUYỆT</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
            {data.tongDaDuyet} / {data.tongChiTieu}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            {data.tongChiTieu - data.tongDaDuyet} chỗ trống còn lại
          </div>
        </div>

        <div className="card" style={{ padding: "16px", margin: 0 }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>TỶ LỆ LẤP ĐẦY TRUNG BÌNH</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
            {data.tyLeLapDayTrungBinh}%
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Tính trên tổng chỉ tiêu
          </div>
        </div>

        <div className="card" style={{ padding: "16px", margin: 0 }}>
          <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>CHƯA CÓ SINH VIÊN</div>
          <div style={{ fontSize: "24px", fontWeight: 700, color: "#ef4444", marginTop: "4px" }}>
            {data.soDeTaiChuaCoSinhVien}
          </div>
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
            Đề tài 0 sinh viên đăng ký
          </div>
        </div>
      </div>

      {/* Bộ lọc */}
      <div
        className="card"
        style={{
          padding: "16px 20px",
          marginBottom: "20px",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#475569", fontWeight: 600, fontSize: "14px" }}>
          <Filter size={16} /> Bộ lọc:
        </div>

        <select
          value={filter.maNganh}
          onChange={(e) => setFilter((f) => ({ ...f, maNganh: e.target.value, page: 1 }))}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
        >
          <option value="">-- Tất cả ngành --</option>
          <option value="CNTT">Công nghệ thông tin</option>
          <option value="KTPM">Kỹ thuật phần mềm</option>
          <option value="HTTT">Hệ thống thông tin</option>
          <option value="KHMT">Khoa học máy tính</option>
        </select>

        {isQtv && (
          <input
            type="text"
            placeholder="Mã giảng viên..."
            value={filter.maGV}
            onChange={(e) => setFilter((f) => ({ ...f, maGV: e.target.value, page: 1 }))}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "13px",
              width: "160px",
            }}
          />
        )}

        <select
          value={filter.trangThai}
          onChange={(e) => setFilter((f) => ({ ...f, trangThai: e.target.value, page: 1 }))}
          style={{ padding: "7px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
        >
          <option value="">-- Mọi trạng thái --</option>
          <option value="DANG_MO">Đang mở đăng ký</option>
          <option value="CHO_DUYET">Chờ duyệt</option>
          <option value="DANG_THUC_HIEN">Đang thực hiện</option>
          <option value="DA_NGHIEM_THU">Đã nghiệm thu</option>
          <option value="DA_DONG">Đã đóng</option>
        </select>

        {(filter.maNganh || filter.maGV || filter.trangThai) && (
          <button
            onClick={() => setFilter({ maNganh: "", maGV: "", trangThai: "", page: 1 })}
            style={{
              padding: "7px 12px",
              borderRadius: "8px",
              background: "#f1f5f9",
              border: "none",
              color: "#475569",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Xóa lọc
          </button>
        )}
      </div>

      {/* Bảng dữ liệu đề tài */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <RefreshCw size={24} className="spin" style={{ marginBottom: "10px", color: "#2563eb" }} />
            <div>Đang tải danh sách đề tài...</div>
          </div>
        ) : data.data.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
            <AlertCircle size={32} style={{ color: "#94a3b8", marginBottom: "10px" }} />
            <div>Không tìm thấy đề tài nào phù hợp với bộ lọc</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "70px" }}>MÃ</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>TÊN ĐỀ TÀI</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "110px" }}>GVHD</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "100px" }}>NGÀNH</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", width: "110px" }}>CHỈ TIÊU</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "180px" }}>TỶ LỆ LẤP ĐẦY</th>
                  <th style={{ padding: "12px 16px", textAlign: "center", width: "140px" }}>TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((row) => {
                  const stCfg = TRANG_THAI_MAP[row.trangThai] || { label: row.trangThai, color: "#64748b", bg: "#f1f5f9" };
                  const fillPct = Math.min(100, row.tyLeLapDay || 0);
                  const barColor = fillPct >= 100 ? "#10b981" : fillPct > 0 ? "#3b82f6" : "#cbd5e1";

                  return (
                    <tr key={row.maDeTai} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: "#475569" }}>
                        #{row.maDeTai}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: 600, color: "#0f172a" }}>{row.tenDeTai}</div>
                        {row.soChoTrong > 0 && (
                          <div style={{ fontSize: "11px", color: "#10b981", marginTop: "2px" }}>
                            Còn {row.soChoTrong} chỗ đăng ký
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", color: "#334155" }}>
                        {row.maGV || <span style={{ color: "#94a3b8" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", fontWeight: 500, fontSize: "12px" }}>
                          {row.maNganh || "Chung"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600 }}>
                        <span style={{ color: "#2563eb" }}>{row.soDaDuyet}</span> / {row.chiTieu}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: 600, color: "#334155" }}>{row.tyLeLapDay}%</span>
                          <span style={{ color: "#94a3b8" }}>{row.soDaDuyet}/{row.chiTieu} SV</span>
                        </div>
                        <div style={{ height: "6px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                          <div style={{ width: `${fillPct}%`, height: "100%", background: barColor, borderRadius: "10px" }} />
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontSize: "11px",
                            fontWeight: 600,
                            background: stCfg.bg,
                            color: stCfg.color,
                          }}
                        >
                          {stCfg.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
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
              padding: "14px 20px",
              borderTop: "1px solid #f1f5f9",
            }}
          >
            <div style={{ fontSize: "13px", color: "#64748b" }}>
              Hiển thị {data.data.length} trên tổng số {data.total} đề tài (Trang {data.page}/{data.totalPages})
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                disabled={data.page <= 1}
                onClick={() => setFilter((f) => ({ ...f, page: f.page - 1 }))}
                style={{
                  padding: "5px 12px",
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
                  padding: "5px 12px",
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

export default ThongKeDeTai;
