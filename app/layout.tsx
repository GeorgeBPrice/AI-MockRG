import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SessionProvider } from "@/components/layout/session-provider";
import { Toaster } from "@/components/ui/toaster";
import Navbar from "@/components/layout/navbar";
import { Footer } from "@/app/components/footer";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Mock Record Generator",
  description: "Generate realistic mock records for development and testing",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.className}`}>
        <SessionProvider>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 px-4 pb-6 pt-6 sm:px-6 lg:px-8">
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                {children}
              </div>
            </main>
            <Footer />
          </div>
          <Toaster />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
