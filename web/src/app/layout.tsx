import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import Shell from "@/components/Shell";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Sport Market Review — спортивний бізнес України",
  description: "Ділова екосистема спортивного бізнесу України: матеріали, мережа, можливості та події.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="uk" className={`${manrope.variable} h-full`}>
      <body className="min-h-full">
        <Shell>{children}</Shell>
      </body>
    </html>
  );
}
