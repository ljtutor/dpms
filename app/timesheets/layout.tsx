import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Timesheets",
};

export default function TimesheetsLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return children;
}
