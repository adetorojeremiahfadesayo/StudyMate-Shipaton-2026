import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "StudyMate - Exam Prep With Matey",
  description:
    "Upload course material, learn with Matey, practise IRAC exam answers, earn XP, and unlock a revision PDF.",
  applicationName: "StudyMate",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "StudyMate - Exam Prep With Matey",
    description:
      "A hackathon-ready study demo that turns course materials into guided learning, story practice, XP, and revision PDFs.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[color:var(--background)] text-[color:var(--foreground)]">
        {children}
        <Toaster position="top-right" />
      </body>
    </html>
  );
}
