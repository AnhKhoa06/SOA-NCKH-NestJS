export enum TrangThaiDangKy {
  CHO_DUYET = 'CHO_DUYET',
  DA_DUYET = 'DA_DUYET',
  BI_TU_CHOI = 'BI_TU_CHOI',
  DA_HUY = 'DA_HUY',
}

// Trạng thái còn hiệu lực: khớp với cột sinh HieuLuc trong CSDL
export const TRANG_THAI_CON_HIEU_LUC = [
  TrangThaiDangKy.CHO_DUYET,
  TrangThaiDangKy.DA_DUYET,
];
