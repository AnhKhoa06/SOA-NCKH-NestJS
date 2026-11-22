import {
  LayoutDashboard,
  Building2,
  Layers,
  GraduationCap,
  Users,
  CalendarRange,
  BookOpen,
  ClipboardList,
  Gavel,
  BarChart3,
  PieChart,
  Clock,
  KeyRound,
  ScrollText,
} from "lucide-react";

export const ROLES = ["QTV", "GV", "SV"];

export const ROLE_LABEL = {
  QTV: "Quản trị viên",
  GV: "Giảng viên",
  SV: "Sinh viên",
};

// Trang chủ sau đăng nhập (mọi vai trò đều vào Tổng quan)
export const HOME = "/tong-quan";

const overview = {
  key: "overview",
  title: "TỔNG QUAN",
  items: [{ to: "/tong-quan", label: "Tổng quan", icon: LayoutDashboard }],
};

// Menu theo vai trò. Muốn thêm trang: thêm vào đây VÀ vào src/config/routes.jsx
export const MENU_BY_ROLE = {
  QTV: [
    overview,
    {
      key: "hocvu",
      title: "HỌC VỤ",
      items: [
        { to: "/khoa", label: "Khoa", icon: Building2 },
        { to: "/nganh", label: "Ngành", icon: Layers },
        { to: "/giang-vien", label: "Giảng viên", icon: GraduationCap },
        { to: "/sinh-vien", label: "Sinh viên", icon: Users },
      ],
    },
    {
      key: "nckh",
      title: "NGHIÊN CỨU KHOA HỌC",
      items: [
        { to: "/dot-de-tai", label: "Đợt đề tài", icon: CalendarRange },
        { to: "/de-tai", label: "Đề tài", icon: BookOpen },
        { to: "/dang-ky", label: "Đăng ký", icon: ClipboardList },
        { to: "/hoi-dong", label: "Hội đồng nghiệm thu", icon: Gavel },
      ],
    },
    {
      key: "baocao",
      title: "BÁO CÁO",
      items: [
        { to: "/bao-cao/de-tai", label: "Thống kê đề tài", icon: BarChart3 },
        {
          to: "/bao-cao/sinh-vien",
          label: "Thống kê sinh viên",
          icon: PieChart,
        },
        { to: "/bao-cao/gio-nckh", label: "Giờ NCKH", icon: Clock },
      ],
    },
    {
      key: "hethong",
      title: "HỆ THỐNG",
      items: [
        { to: "/tai-khoan", label: "Tài khoản", icon: KeyRound },
        { to: "/nhat-ky", label: "Nhật ký hoạt động", icon: ScrollText },
      ],
    },
  ],
  GV: [
    overview,
    {
      key: "nckh",
      title: "NGHIÊN CỨU KHOA HỌC",
      items: [
        { to: "/dot-de-tai", label: "Đợt đề tài", icon: CalendarRange },
        { to: "/de-tai", label: "Đề tài", icon: BookOpen },
        { to: "/dang-ky", label: "Duyệt đăng ký", icon: ClipboardList },
        { to: "/hoi-dong", label: "Hội đồng nghiệm thu", icon: Gavel },
      ],
    },
    {
      key: "baocao",
      title: "BÁO CÁO",
      items: [
        { to: "/bao-cao/de-tai", label: "Thống kê đề tài", icon: BarChart3 },
        { to: "/bao-cao/gio-nckh", label: "Giờ NCKH", icon: Clock },
      ],
    },
  ],
  SV: [
    overview,
    {
      key: "nckh",
      title: "NGHIÊN CỨU KHOA HỌC",
      items: [
        { to: "/de-tai", label: "Đề tài đang mở", icon: BookOpen },
        { to: "/dang-ky", label: "Đăng ký của tôi", icon: ClipboardList },
      ],
    },
  ],
};

// Tiêu đề cho các trang không nằm trong menu
const EXTRA_TITLES = {
  "/thong-bao": "Thông báo",
  "/doi-mat-khau": "Đổi mật khẩu",
};

export function findTitle(pathname, role) {
  if (EXTRA_TITLES[pathname]) return EXTRA_TITLES[pathname];
  const groups = MENU_BY_ROLE[role] || [];
  for (const g of groups) {
    const hit = g.items.find((i) => i.to === pathname);
    if (hit) return hit.label;
  }
  return "";
}
