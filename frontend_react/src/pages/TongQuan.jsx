import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock,
  GraduationCap,
  RefreshCw,
  TrendingUp,
  Users,
} from "lucide-react";
import { api, auth } from "../api";
import { useToast } from "../components/Toast";

const TRANG_THAI_DE_TAI = {
  CHO_DUYET: { label: "Chờ duyệt", color: "#f59e0b", bg: "#fef3c7" },
  DANG_MO: { label: "Đang mở đăng ký", color: "#10b981", bg: "#d1fae5" },
  DA_DONG: { label: "Đã đóng đăng ký", color: "#64748b", bg: "#f1f5f9" },
  DANG_THUC_HIEN: { label: "Đang thực hiện", color: "#3b82f6", bg: "#dbeafe" },
  CHO_NGHIEM_THU: { label: "Chờ nghiệm thu", color: "#8b5cf6", bg: "#ede9fe" },
  DA_NGHIEM_THU: { label: "Đã nghiệm thu", color: "#059669", bg: "#ecfdf5" },
  DA_HUY: { label: "Đã hủy", color: "#ef4444", bg: "#fee2e2" },
  BI_TU_CHOI: { label: "Bị từ chối", color: "#dc2626", bg: "#fee2e2" },
};

const TRANG_THAI_DANG_KY = {
  CHO_DUYET: { label: "Chờ duyệt", color: "#f59e0b", bg: "#fef3c7" },
  DA_DUYET: { label: "Đã duyệt", color: "#10b981", bg: "#d1fae5" },
  BI_TU_CHOI: { label: "Bị từ chối", color: "#ef4444", bg: "#fee2e2" },
  DA_HUY: { label: "Đã hủy", color: "#64748b", bg: "#f1f5f9" },
  CHUA_DANG_KY: { label: "Chưa đăng ký", color: "#94a3b8", bg: "#f8fafc" },
};

function StatCard({ icon: Icon, title, value, subtext, color = "#2563eb", bg = "#eff6ff" }) {
  return (
    <div
      style={{
        background: "white",
        border: "1px solid #e2e8f0",
        borderRadius: "14px",
        padding: "20px",
        display: "flex",
        alignItems: "flex-start",
        gap: "16px",
        boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "12px",
          background: bg,
          color: color,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Icon size={24} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ fontSize: "26px", fontWeight: 700, color: "#1e293b", lineHeight: 1.2 }}>
          {value}
        </div>
        {subtext && (
          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "6px" }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

function TongQuan() {
  const toast = useToast();
  const user = auth.getUser() || {};
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/bao-cao/tong-quan");
      setData(res);
    } catch (err) {
      toast.error(err.message || "Không thể tải số liệu tổng quan");
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading && !data) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "60px 20px" }}>
        <RefreshCw size={36} className="spin" style={{ color: "#2563eb", marginBottom: "16px" }} />
        <div style={{ color: "#64748b", fontSize: "15px" }}>Đang tải số liệu tổng quan hệ thống...</div>
      </div>
    );
  }

  const role = user.role || data?.role || "SV";

  return (
    <div>
      <div className="page-header" style={{ marginBottom: "24px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Tổng quan hệ thống NCKH
          </h2>
          <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>
            Xin chào, <strong>{user.username}</strong> ({role === "QTV" ? "Quản trị viên" : role === "GV" ? "Giảng viên" : "Sinh viên"})
          </div>
        </div>
        <button
          onClick={loadData}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            background: "white",
            cursor: "pointer",
            fontSize: "13px",
            fontWeight: 500,
          }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} />
          Làm mới
        </button>
      </div>

      {/* =============================================================== */}
      {/* 1. GIAO DIỆN QUẢN TRỊ VIÊN (QTV)                                */}
      {/* =============================================================== */}
      {role === "QTV" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <StatCard
              icon={Users}
              title="Tổng sinh viên"
              value={data?.tongSinhVien ?? 0}
              subtext="Đang hoạt động trong hệ thống"
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              icon={GraduationCap}
              title="Tổng giảng viên"
              value={data?.tongGiangVien ?? 0}
              subtext="Tham gia hướng dẫn / hội đồng"
              color="#0d9488"
              bg="#ccfbf1"
            />
            <StatCard
              icon={BookOpen}
              title="Tổng đề tài"
              value={data?.tongDeTai ?? 0}
              subtext={`Tổng chỉ tiêu: ${data?.tongChiTieu ?? 0} sinh viên`}
              color="#7c3aed"
              bg="#f5f3ff"
            />
            <StatCard
              icon={TrendingUp}
              title="Tỷ lệ lấp đầy"
              value={`${data?.tyLeLapDayChung ?? 0}%`}
              subtext={`${data?.tongDaDuyet ?? 0} / ${data?.tongChiTieu ?? 0} chỉ tiêu`}
              color="#ea580c"
              bg="#fff7ed"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
              marginBottom: "24px",
            }}
          >
            {/* Phân bố Đề tài */}
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <BarChart3 size={18} color="#2563eb" />
                  Đề tài theo trạng thái
                </h3>
                <Link to="/thong-ke-de-tai" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                  Xem chi tiết &rarr;
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(TRANG_THAI_DE_TAI).map(([stKey, cfg]) => {
                  const count = data?.deTaiTheoTrangThai?.[stKey] || 0;
                  const total = data?.tongDeTai || 1;
                  const pct = Math.round((count / total) * 100);
                  return (
                    <div key={stKey}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginBottom: "4px" }}>
                        <span style={{ color: "#475569", fontWeight: 500 }}>{cfg.label}</span>
                        <span style={{ fontWeight: 600, color: "#0f172a" }}>
                          {count} <span style={{ color: "#94a3b8", fontWeight: 400 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: "7px", background: "#f1f5f9", borderRadius: "10px", overflow: "hidden" }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: cfg.color,
                            borderRadius: "10px",
                            transition: "width 0.4s ease",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Phân bố Đăng ký */}
            <div className="card" style={{ margin: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Users size={18} color="#0d9488" />
                  Đăng ký theo trạng thái
                </h3>
                <Link to="/dang-ky" style={{ fontSize: "13px", color: "#2563eb", textDecoration: "none", fontWeight: 500 }}>
                  Quản lý &rarr;
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {Object.entries(TRANG_THAI_DANG_KY)
                  .filter(([k]) => k !== "CHUA_DANG_KY")
                  .map(([stKey, cfg]) => {
                    const count = data?.dangKyTheoTrangThai?.[stKey] || 0;
                    return (
                      <div
                        key={stKey}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "12px 16px",
                          borderRadius: "10px",
                          background: cfg.bg,
                        }}
                      >
                        <span style={{ fontWeight: 600, color: cfg.color }}>{cfg.label}</span>
                        <span style={{ fontSize: "18px", fontWeight: 700, color: cfg.color }}>{count}</span>
                      </div>
                    );
                  })}
              </div>

              <div
                style={{
                  marginTop: "20px",
                  padding: "14px",
                  borderRadius: "10px",
                  background: "#f8fafc",
                  border: "1px dashed #cbd5e1",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <div style={{ fontSize: "12px", color: "#64748b" }}>Cần xử lý ngay</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#d97706" }}>
                    {data?.soDeTaiChoDuyet ?? 0} đề tài chờ duyệt
                  </div>
                </div>
                <Link
                  to="/de-tai"
                  style={{
                    padding: "6px 12px",
                    background: "#f59e0b",
                    color: "white",
                    borderRadius: "6px",
                    fontSize: "12px",
                    textDecoration: "none",
                    fontWeight: 600,
                  }}
                >
                  Duyệt ngay
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =============================================================== */}
      {/* 2. GIAO DIỆN GIẢNG VIÊN (GV)                                    */}
      {/* =============================================================== */}
      {role === "GV" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
              gap: "18px",
              marginBottom: "24px",
            }}
          >
            <StatCard
              icon={BookOpen}
              title="Đề tài của tôi"
              value={data?.soDeTaiCuaToi ?? 0}
              subtext={`Chỉ tiêu: ${data?.tongChiTieu ?? 0} SV`}
              color="#2563eb"
              bg="#eff6ff"
            />
            <StatCard
              icon={Clock}
              title="Đăng ký chờ duyệt"
              value={data?.soDangKyChoDuyet ?? 0}
              subtext="Cần xử lý phê duyệt sinh viên"
              color="#f59e0b"
              bg="#fef3c7"
            />
            <StatCard
              icon={TrendingUp}
              title="Tỷ lệ lấp đầy"
              value={`${data?.tyLeLapDay ?? 0}%`}
              subtext={`${data?.tongDaDuyet ?? 0} SV đã được duyệt`}
              color="#10b981"
              bg="#d1fae5"
            />
            <StatCard
              icon={Award}
              title="Đề tài nghiệm thu Đạt"
              value={data?.soDeTaiDat ?? 0}
              subtext={`${data?.soHoiDongThamGia ?? 0} lần tham gia hội đồng`}
              color="#7c3aed"
              bg="#f5f3ff"
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px",
            }}
          >
            <div className="card">
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>
                Trạng thái các đề tài phụ trách
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {Object.entries(TRANG_THAI_DE_TAI).map(([stKey, cfg]) => {
                  const count = data?.deTaiTheoTrangThai?.[stKey] || 0;
                  return (
                    <div
                      key={stKey}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        background: count > 0 ? cfg.bg : "#f8fafc",
                        border: "1px solid",
                        borderColor: count > 0 ? `${cfg.color}33` : "#e2e8f0",
                      }}
                    >
                      <span style={{ fontSize: "13px", fontWeight: 500, color: count > 0 ? cfg.color : "#94a3b8" }}>
                        {cfg.label}
                      </span>
                      <span style={{ fontSize: "15px", fontWeight: 700, color: count > 0 ? cfg.color : "#94a3b8" }}>
                        {count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="card">
              <h3 style={{ fontSize: "16px", fontWeight: 600, color: "#1e293b", marginBottom: "16px" }}>
                Thao tác nhanh
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <Link
                  to="/thong-ke-de-tai"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  <BarChart3 size={20} color="#2563eb" />
                  <div>
                    <div>Xem chi tiết tỷ lệ lấp đầy đề tài</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>Báo cáo tỷ lệ chỉ tiêu sinh viên</div>
                  </div>
                </Link>

                <Link
                  to="/gio-nckh"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "10px",
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    textDecoration: "none",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  <Award size={20} color="#7c3aed" />
                  <div>
                    <div>Bảng quy đổi giờ NCKH của tôi</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>30 giờ / đề tài đạt + 3 giờ / hội đồng</div>
                  </div>
                </Link>

                <Link
                  to="/dang-ky"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px",
                    borderRadius: "10px",
                    background: data?.soDangKyChoDuyet > 0 ? "#fef3c7" : "#f8fafc",
                    border: "1px solid",
                    borderColor: data?.soDangKyChoDuyet > 0 ? "#f59e0b" : "#e2e8f0",
                    textDecoration: "none",
                    color: "#1e293b",
                    fontWeight: 500,
                  }}
                >
                  <Clock size={20} color="#f59e0b" />
                  <div>
                    <div>Duyệt đăng ký của sinh viên</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>
                      {data?.soDangKyChoDuyet > 0 ? `Có ${data.soDangKyChoDuyet} đăng ký đang chờ bạn duyệt!` : "Không có đăng ký tồn đọng"}
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =============================================================== */}
      {/* 3. GIAO DIỆN SINH VIÊN (SV)                                     */}
      {/* =============================================================== */}
      {role === "SV" && (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
              gap: "20px",
              marginBottom: "24px",
            }}
          >
            <div className="card" style={{ margin: 0 }}>
              <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500, marginBottom: "8px" }}>
                Trạng thái đăng ký NCKH
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                {data?.trangThaiDangKy === "DA_DUYET" ? (
                  <CheckCircle2 size={28} color="#10b981" />
                ) : data?.trangThaiDangKy === "CHO_DUYET" ? (
                  <Clock size={28} color="#f59e0b" />
                ) : (
                  <BookOpen size={28} color="#64748b" />
                )}
                <span
                  style={{
                    fontSize: "18px",
                    fontWeight: 700,
                    color: TRANG_THAI_DANG_KY[data?.trangThaiDangKy]?.color || "#475569",
                  }}
                >
                  {TRANG_THAI_DANG_KY[data?.trangThaiDangKy]?.label || "Chưa đăng ký"}
                </span>
              </div>

              {data?.dangKyHienTai ? (
                <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "8px", fontSize: "13px" }}>
                  <div style={{ fontWeight: 600, color: "#1e293b", marginBottom: "4px" }}>
                    {data.dangKyHienTai.tenDeTai}
                  </div>
                  {data.dangKyHienTai.maGV && (
                    <div style={{ color: "#64748b" }}>GVHD: {data.dangKyHienTai.maGV}</div>
                  )}
                  <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                    Ngày gửi: {new Date(data.dangKyHienTai.ngayDangKy).toLocaleDateString("vi-VN")}
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "14px" }}>
                  Bạn hiện chưa tham gia đề tài nào. Hãy xem danh sách các đề tài đang mở!
                </div>
              )}

              <div style={{ marginTop: "16px" }}>
                <Link
                  to="/de-tai"
                  style={{
                    display: "inline-block",
                    padding: "8px 16px",
                    background: "#2563eb",
                    color: "white",
                    borderRadius: "8px",
                    fontSize: "13px",
                    fontWeight: 600,
                    textDecoration: "none",
                  }}
                >
                  Xem danh sách đề tài &rarr;
                </Link>
              </div>
            </div>

            <StatCard
              icon={BookOpen}
              title="Đề tài đang mở phù hợp ngành"
              value={data?.soDeTaiDangMoPhuHopNganh ?? 0}
              subtext={data?.maNganh ? `Ngành: ${data.maNganh}` : "Toàn trường"}
              color="#10b981"
              bg="#d1fae5"
            />

            <StatCard
              icon={GraduationCap}
              title="Thông tin học vụ"
              value={data?.gpa ? `GPA: ${data.gpa}` : "—"}
              subtext={`Lớp: ${data?.lop || "—"} | Mã SV: ${data?.maSV || "—"}`}
              color="#7c3aed"
              bg="#f5f3ff"
            />
          </div>
        </>
      )}
    </div>
  );
}

export default TongQuan;
