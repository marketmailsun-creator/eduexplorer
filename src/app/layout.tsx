import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { MobileNav } from "@/components/navigation/MobileNav";
import { RegisterServiceWorker } from './register-sw';
import { Toaster } from "@/components/ui/toaster";
import { Footer } from '@/components/layout/Footer';

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
        {/* Viewport: viewport-fit=cover extends webview under iOS notch */}
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        {/* PWA / iOS home screen */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        {/* black-translucent: status bar overlays the webview; env(safe-area-inset-top) in Header handles content offset */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="EduExplorer" />
        <meta name="theme-color" content="#667eea" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="pb-16 lg:pb-0"> {/* Space for bottom nav */}
        <SessionProvider>
          {children}
        </SessionProvider>
         <Toaster />
       <RegisterServiceWorker />
       <Footer /> 
       <MobileNav /> 

       <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && 'caches' in window) {
                // Force service worker update
                navigator.serviceWorker.getRegistrations().then(registrations => {
                  registrations.forEach(registration => {
                    registration.update();
                  });
                });
                
                // Clear any old caches
                caches.keys().then(cacheNames => {
                  cacheNames.forEach(cacheName => {
                    if (!cacheName.includes('v3')) { // Match your CACHE_VERSION
                      console.log('🗑️ Clearing old cache:', cacheName);
                      caches.delete(cacheName);
                    }
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}