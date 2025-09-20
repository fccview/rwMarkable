import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "@/app/_styles/globals.css";
import { ThemeProvider } from "@/app/_providers/ThemeProvider";
import { ChecklistProvider } from "@/app/_providers/ChecklistProvider";
import { AppModeProvider } from "@/app/_providers/AppModeProvider";
import { ToastProvider } from "@/app/_providers/ToastProvider";
import { NavigationGuardProvider } from "@/app/_providers/NavigationGuardProvider";
import { InstallPrompt } from "@/app/_components/ui/pwa/InstallPrompt";
import { checkForDocsFolder } from "./_server/actions/data/notes-actions";
import { redirect } from "next/navigation";
import { headers } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "rwMarkable",
  description: "A simple, fast, and lightweight checklist application",
  manifest: "/app-icons/site.webmanifest",
  icons: {
    icon: [
      {
        url: "/app-icons/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/app-icons/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/app-icons/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "rwMarkable",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") || "";

  const needsMigration = await checkForDocsFolder();
  if (needsMigration && pathname !== "/migration") {
    redirect("/migration");
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/app-icons/favicon.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="rwMarkable" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        <ThemeProvider>
          <AppModeProvider>
            <ChecklistProvider>
              <NavigationGuardProvider>
                <ToastProvider>
                  <div className="min-h-screen bg-background text-foreground transition-colors">
                    {children}
                    <InstallPrompt />
                  </div>
                </ToastProvider>
              </NavigationGuardProvider>
            </ChecklistProvider>
          </AppModeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
