import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MobileNav } from "@/components/navigation/MobileNav";
import { RegisterServiceWorker } from './register-sw';
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduExplorer - AI-Powered Learning Assistant",
  description: "Explore any topic with AI-powered research and content generation",
};

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <body className={inter.className}>
//         <SessionProvider>
//           {children}
//         </SessionProvider>
//       </body>
//     </html>
//   );
// }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Viewport meta for mobile */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {/* iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#667eea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="LearnAI" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="pb-16 md:pb-0"> {/* Space for bottom nav */}
        <SessionProvider>
          {children}
        </SessionProvider>
         <Toaster />
       <RegisterServiceWorker />
       <MobileNav /> 
      </body>
    </html>
  );
}