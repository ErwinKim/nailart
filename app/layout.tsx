import type { Metadata } from "next";
import { Baloo_2 } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";

const baloo = Baloo_2({
  variable: "--font-baloo-2",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "nailart ",
  description: "Thumbnail Generator",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${baloo.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
