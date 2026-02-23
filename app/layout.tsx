import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/navigation/BottomNav";
import TopNavClient from "@/components/navigation/TopNavClient";
import { CartProvider } from "@/context/CartContext";
import { Toaster } from "sonner";
import AddToHomeScreen from "@/components/pwa/AddToHomeScreen";
import { createClient } from "@/utils/supabase/server";
import { getProfile, getUserRole } from "@/lib/database/profiles";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Honest Meals — Real Food, Transparent Pricing",
  description:
    "No hidden fees. No tiny portions. Macro-counted, honestly priced meals delivered to your door. Order healthy vegetarian & non-vegetarian meals.",
  keywords: ["meal delivery", "healthy food", "macro counted", "honest pricing", "vegetarian meals"],
  openGraph: {
    title: "Honest Meals — Real Food, Transparent Pricing",
    description: "No hidden fees. No tiny portions. Just honest food for honest people.",
    type: "website",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Single auth call for the entire layout — no more redundant getUser() calls
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch profile and role in parallel (only if user exists)
  let profile = null;
  let userRole: any = null;

  if (user) {
    [profile, userRole] = await Promise.all([
      getProfile(user.id),
      getUserRole(user.id),
    ]);
  }

  return (
    <html lang="en">
      <body className={`${geistSans.variable} antialiased`}>
        <CartProvider>
          <TopNavClient user={user} profile={profile} />
          <div className="pb-16 md:pb-0">{children}</div>
          {user && <BottomNav userRole={userRole ?? undefined} />}
          <AddToHomeScreen />
          <Toaster />
        </CartProvider>
      </body>
    </html>
  );
}
