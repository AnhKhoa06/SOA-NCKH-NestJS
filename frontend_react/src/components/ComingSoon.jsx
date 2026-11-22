// Khung cho trang chưa làm. Người phụ trách xóa dòng <ComingSoon .../>
// trong file trang của mình và viết giao diện thật.
function ComingSoon({ title, owner, fr }) {
  return (
    <>
      <div className="page-header">
        <h2>{title}</h2>
      </div>
      <div className="card">
        <div className="empty-state">
          <p>Trang này đang được xây dựng.</p>
          <p>
            Phụ trách: <strong>{owner}</strong>
            {fr ? ` · Yêu cầu ${fr}` : ""}
          </p>
        </div>
      </div>
    </>
  );
}

export default ComingSoon;
