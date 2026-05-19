import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CampusMind",
  description: "面向大学生的 AI 课程学习助手"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
