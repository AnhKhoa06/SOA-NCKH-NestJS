import { useCallback, useEffect, useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  GraduationCap,
  RefreshCw,
  Users,
} from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";

const VAI_TRO_HOI_DONG = {
  CHU_TICH: "Chủ tịch hội đồng",
  THU_KY: "Thư ký hội đồng",
  PHAN_BIEN: "Ủy viên phản biện",
  UY_VIEN: "Ủy viên hội đồng",
};

function GioNckh() {
  const toast = useToast();
  const user = auth.getUser() || {};
  const isQtv = user.role === "QTV";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [namHoc, setNamHoc] = useState("2025-2026");
  const [maGV, setMaGV] = useState(isQtv ? "" : user.maDinhDanh || "");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (namHoc) params.set("namHoc", namHoc);
      if (maGV && isQtv) params.set("maGV", maGV);

      const res = await api.get(`/bao-cao/gio-nckh?${params}`);
      setData(res);
    } catch (err) {
      toast.error(err.message || "Không thể tải bảng quy đổi giờ NCKH");
    } finally {
      setLoading(false);
    }
  }, [namHoc, maGV, isQtv]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCsv = async () => {
    try {
      toast.info("Đang tạo file bảng quy đổi giờ NCKH...");
      const params = new URLSearchParams({ loai: "gio-nckh", dinhDang: "json" });
      if (namHoc) params.set("namHoc", namHoc);
      const res = await api.get(`/bao-cao/xuat?${params}`);

      if (res?.data && res.data.length > 0) {
        const rows = res.data;
        const keys = ["maGV", "soDeTaiDat", "soHoiDong", "gioHuongDan", "gioHoiDong", "tongGio"];
        const headers = ["Mã Giảng viên", "Đề tài Đạt", "Lần Hội đồng", "Giờ HD (30h/ĐT)", "Giờ HĐ (3h/lần)", "Tổng giờ NCKH"];
        const csvContent =
          "\uFEFF" +
          headers.join(",") +
          "\r\n" +
          rows
            .map((r) =>
              keys
                .map((k) => `"${String(r[k] ?? "").replace(/"/g, '""')}"`)
                .join(","),
            )
            .join("\r\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `QuyDoi_GioNCKH_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success("Xuất bảng quy đổi thành công!");
      } else {
        toast.warning("Không có dữ liệu để xuất");
      }
    } catch (err) {
      toast.error(err.message || "Lỗi khi xuất bảng quy đổi");
    }
  };

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "20px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Quy đổi giờ nghiên cứu khoa học
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Căn cứ định mức: <strong>30 giờ</strong> / đề tài nghiệm thu Đạt + <strong>3 giờ</strong> / lần tham gia hội đồng (FR-31)
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
            onClick={loadData}
            disabled={loading}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 14px",
              background: "white",
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

      {/* Bộ lọc Năm học & Giảng viên */}
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

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "13px", color: "#64748b" }}>Năm học:</span>
          <select
            value={namHoc}
            onChange={(e) => setNamHoc(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "13px" }}
          >
            <option value="">Tất cả các năm</option>
            <option value="2025-2026">2025 - 2026</option>
            <option value="2024-2025">2024 - 2025</option>
            <option value="2023-2024">2023 - 2024</option>
          </select>
        </div>

        {isQtv && (
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "13px", color: "#64748b" }}>Mã GV:</span>
            <input
              type="text"
              placeholder="VD: GV001..."
              value={maGV}
              onChange={(e) => setMaGV(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                width: "140px",
              }}
            />
          </div>
        )}
      </div>

      {/* GIAO DIỆN GIẢNG VIÊN */}
      {!isQtv && data && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <div className="card" style={{ padding: "20px", margin: 0, borderTop: "4px solid #7c3aed" }}>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>TỔNG GIỜ QUY ĐỔI</div>
              <div style={{ fontSize: "32px", fontWeight: 800, color: "#7c3aed", marginTop: "4px" }}>
                {data.tongGio ?? 0} <span style={{ fontSize: "16px", fontWeight: 500 }}>giờ</span>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
                Năm học: {data.namHoc}
              </div>
            </div>

            <div className="card" style={{ padding: "20px", margin: 0, borderTop: "4px solid #2563eb" }}>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>HƯỚNG DẪN ĐỀ TÀI ĐẠT</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#2563eb", marginTop: "4px" }}>
                {data.gioHuongDan ?? 0} <span style={{ fontSize: "14px", fontWeight: 500 }}>giờ</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                {data.soDeTaiDat ?? 0} đề tài &times; 30 giờ/đề tài
              </div>
            </div>

            <div className="card" style={{ padding: "20px", margin: 0, borderTop: "4px solid #10b981" }}>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600 }}>THAM GIA HỘI ĐỒNG</div>
              <div style={{ fontSize: "28px", fontWeight: 700, color: "#10b981", marginTop: "4px" }}>
                {data.gioHoiDong ?? 0} <span style={{ fontSize: "14px", fontWeight: 500 }}>giờ</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "6px" }}>
                {data.soHoiDong ?? 0} lần &times; 3 giờ/hội đồng
              </div>
            </div>
          </div>

          {/* Chi tiết 2 bảng: Đề tài đạt & Hội đồng */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "24px",
            }}
          >
            {/* Danh sách đề tài đạt */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Đề tài hướng dẫn nghiệm thu Đạt ({data.danhSachDeTaiDat?.length || 0})
                </h3>
              </div>
              {data.danhSachDeTaiDat?.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                  Chưa có đề tài nào đạt nghiệm thu trong năm học này.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>TÊN ĐỀ TÀI</th>
                      <th style={{ padding: "10px 14px", textAlign: "center", width: "90px" }}>ĐIỂM TB</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", width: "90px" }}>QUY ĐỔI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.danhSachDeTaiDat.map((dt) => (
                      <tr key={dt.maDeTai} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", fontWeight: 500, color: "#1e293b" }}>
                          {dt.tenDeTai}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center", fontWeight: 700, color: "#059669" }}>
                          {Number(dt.diemTB).toFixed(2)}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#2563eb" }}>
                          +{dt.gioQuyDoi}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Danh sách tham gia hội đồng */}
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
                <h3 style={{ fontSize: "15px", fontWeight: 700, color: "#1e293b", margin: 0 }}>
                  Hội đồng tham gia ({data.danhSachHoiDong?.length || 0})
                </h3>
              </div>
              {data.danhSachHoiDong?.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "#64748b", fontSize: "13px" }}>
                  Chưa tham gia hội đồng nào trong năm học này.
                </div>
              ) : (
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <th style={{ padding: "10px 14px", textAlign: "left" }}>HỘI ĐỒNG</th>
                      <th style={{ padding: "10px 14px", textAlign: "left", width: "140px" }}>VAI TRÒ</th>
                      <th style={{ padding: "10px 14px", textAlign: "right", width: "90px" }}>QUY ĐỔI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.danhSachHoiDong.map((hd, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                        <td style={{ padding: "10px 14px", color: "#334155" }}>
                          Hội đồng #{hd.maHoiDong}
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {new Date(hd.ngayHop).toLocaleDateString("vi-VN")}
                          </div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ padding: "3px 8px", background: "#f1f5f9", borderRadius: "6px", fontSize: "12px", fontWeight: 500 }}>
                            {VAI_TRO_HOI_DONG[hd.vaiTro] || hd.vaiTro}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: 700, color: "#10b981" }}>
                          +{hd.gioQuyDoi}h
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* GIAO DIỆN QUẢN TRỊ VIÊN */}
      {isQtv && data && (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #e2e8f0" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Bảng tổng hợp giờ NCKH toàn Khoa
            </h3>
            <div style={{ fontSize: "12px", color: "#64748b", marginTop: "4px" }}>
              Tổng cộng {data.tongSoGiangVien || 0} giảng viên có dữ liệu hoạt động NCKH
            </div>
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <RefreshCw size={24} className="spin" style={{ marginBottom: "10px", color: "#2563eb" }} />
              <div>Đang tính toán giờ NCKH...</div>
            </div>
          ) : !data.danhSach || data.danhSach.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              Chưa có dữ liệu nghiệm thu hoặc hội đồng nào cho tiêu chí đã chọn.
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                <thead>
                  <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left" }}>MÃ GIẢNG VIÊN</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "140px" }}>ĐỀ TÀI ĐẠT</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "150px" }}>GIỜ HƯỚNG DẪN</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "140px" }}>LẦN HỘI ĐỒNG</th>
                    <th style={{ padding: "12px 16px", textAlign: "center", width: "140px" }}>GIỜ HỘI ĐỒNG</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", width: "150px" }}>TỔNG GIỜ NCKH</th>
                  </tr>
                </thead>
                <tbody>
                  {data.danhSach.map((gv) => (
                    <tr key={gv.maGV} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "#1e293b" }}>
                        {gv.maGV}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {gv.soDeTaiDat} đề tài
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#2563eb" }}>
                        {gv.gioHuongDan}h
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        {gv.soHoiDong} lần
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: 600, color: "#10b981" }}>
                        {gv.gioHoiDong}h
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: 800, fontSize: "15px", color: "#7c3aed" }}>
                        {gv.tongGio} giờ
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GioNckh;
