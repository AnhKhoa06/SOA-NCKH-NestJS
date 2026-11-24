import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { useToast } from "../components/Toast";

const SIZE = 10;

function formatThoiGian(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("vi-VN");
}

function ThongBao() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [chiChuaDoc, setChiChuaDoc] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, size: SIZE });
      if (chiChuaDoc) params.set("chuaDoc", "true");
      const res = await api.get(`/thong-bao?${params}`);
      // Trang hiện tại không còn dữ liệu (vừa đọc hết): lùi về trang trước
      if (res.data.length === 0 && page > 1) {
        setPage(page - 1);
        return;
      }
      setRows(res.data);
      setTotal(res.total);
      setTotalPages(res.totalPages || 1);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, chiChuaDoc]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    load();
  }, [load]);

  const lamMoi = () => (page === 1 ? load() : setPage(1));

  const danhDauDaDoc = async (id) => {
    setBusy(true);
    try {
      await api.patch(`/thong-bao/${id}/da-doc`);
      load();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  const danhDauTatCa = async () => {
    setBusy(true);
    try {
      const res = await api.patch("/thong-bao/da-doc-tat-ca");
      toast.success(
        res?.soLuong > 0
          ? `Đã đánh dấu ${res.soLuong} thông báo là đã đọc`
          : "Không có thông báo chưa đọc",
      );
      lamMoi();
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h2>Thông báo</h2>
        <button disabled={busy} onClick={danhDauTatCa}>
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="card">
        <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
          <label style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input
              type="checkbox"
              checked={chiChuaDoc}
              onChange={(e) => {
                setChiChuaDoc(e.target.checked);
                setPage(1);
              }}
            />
            Chỉ hiện thông báo chưa đọc
          </label>
          <span style={{ marginLeft: "auto" }}>Tổng: {total}</span>
        </div>

        {loading ? (
          <div className="loading-state">Đang tải...</div>
        ) : rows.length === 0 ? (
          <div className="empty-state">Không có thông báo nào.</div>
        ) : (
          <div>
            {rows.map((tb) => (
              <div
                key={tb.idThongBao}
                style={{
                  display: "flex",
                  gap: 12,
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  padding: "12px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div>
                  <div style={{ fontWeight: tb.daDoc ? 400 : 700 }}>
                    {!tb.daDoc && (
                      <span style={{ color: "#dc2626", marginRight: 8 }}>
                        ● Mới
                      </span>
                    )}
                    {tb.tieuDe}
                  </div>
                  {tb.noiDung && (
                    <div style={{ marginTop: 4 }}>{tb.noiDung}</div>
                  )}
                  <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                    {formatThoiGian(tb.ngayTao)}
                  </div>
                </div>
                {!tb.daDoc && (
                  <button
                    className="btn-edit"
                    disabled={busy}
                    onClick={() => danhDauDaDoc(tb.idThongBao)}
                  >
                    Đã đọc
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        <div
          style={{
            display: "flex",
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

export default ThongBao;