import TongQuan from "../pages/TongQuan";
import Khoa from "../pages/Khoa";
import Nganh from "../pages/Nganh";
import GiangVien from "../pages/GiangVien";
import SinhVien from "../pages/SinhVien";
import DotDeTai from "../pages/DotDeTai";
import DeTai from "../pages/DeTai";
import DangKy from "../pages/DangKy";
import HoiDong from "../pages/HoiDong";
import ThongKeDeTai from "../pages/ThongKeDeTai";
import ThongKeSinhVien from "../pages/ThongKeSinhVien";
import GioNckh from "../pages/GioNckh";
import TaiKhoan from "../pages/TaiKhoan";
import NhatKy from "../pages/NhatKy";
import ThongBao from "../pages/ThongBao";
import DoiMatKhau from "../pages/DoiMatKhau";

const ALL = ["QTV", "GV", "SV"];

// path, trang, vai trò được vào. Người dùng sai vai trò sẽ bị đưa về trang chủ.
export const ROUTES = [
  { path: "/tong-quan", element: <TongQuan />, roles: ALL },
  { path: "/khoa", element: <Khoa />, roles: ["QTV"] },
  { path: "/nganh", element: <Nganh />, roles: ["QTV"] },
  { path: "/giang-vien", element: <GiangVien />, roles: ["QTV"] },
  { path: "/sinh-vien", element: <SinhVien />, roles: ["QTV"] },
  { path: "/dot-de-tai", element: <DotDeTai />, roles: ["QTV", "GV"] },
  { path: "/de-tai", element: <DeTai />, roles: ALL },
  { path: "/dang-ky", element: <DangKy />, roles: ALL },
  { path: "/hoi-dong", element: <HoiDong />, roles: ["QTV", "GV"] },
  { path: "/bao-cao/de-tai", element: <ThongKeDeTai />, roles: ["QTV", "GV"] },
  { path: "/bao-cao/sinh-vien", element: <ThongKeSinhVien />, roles: ["QTV"] },
  { path: "/bao-cao/gio-nckh", element: <GioNckh />, roles: ["QTV", "GV"] },
  { path: "/tai-khoan", element: <TaiKhoan />, roles: ["QTV"] },
  { path: "/nhat-ky", element: <NhatKy />, roles: ["QTV"] },
  { path: "/thong-bao", element: <ThongBao />, roles: ALL },
  { path: "/doi-mat-khau", element: <DoiMatKhau />, roles: ALL },
];
