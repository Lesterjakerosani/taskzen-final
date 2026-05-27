import type { Metadata } from "next";
import { Space_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-geist-mono",
});

export const metadata: Metadata = {
  title: "TaskZen",
  description: "Combine the Pomodoro technique with AI-powered study assistance for more productive, focused sessions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={spaceMono.variable}>
      <body className="font-sans antialiased min-h-screen bg-background">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
