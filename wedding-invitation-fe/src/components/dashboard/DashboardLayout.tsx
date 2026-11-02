"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Wand2,
  ExternalLink,
  Heart,
  Menu,
  X,
  LogOut,
  ArrowLeft,
  Images,
  Palette,
} from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import GuestsTab from "./tabs/GuestsTab";
import GalleryTab from "./tabs/GalleryTab";
import ThemeTab from "./tabs/ThemeTab";
import { useInvitationStore } from "@/store/useInvitationStore";
import { useAuthStore } from "@/store/useAuthStore";

type TabId = "overview" | "guests" | "galeri" | "tema";

const NAV_ITEMS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "guests", label: "Tamu & RSVP", icon: Users },
  { id: "galeri", label: "Galeri", icon: Images },
  { id: "tema", label: "Tema", icon: Palette },
];

function NavItem({
  item,
  active,
  onClick,
  collapsed,
}: {
  item: (typeof NAV_ITEMS)[0];
  active: boolean;
  onClick: () => void;
  collapsed?: boolean;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={`group flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? "bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/25"
          : "text-gray-600 hover:bg-gray-200/60 hover:text-gray-900"
      } ${collapsed ? "justify-center" : ""}`}
    >
      <Icon className="w-4.5 h-4.5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
}

export default function DashboardLayout() {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();
  const { groomName, brideName, slug } = useInvitationStore();
  const { user, clearAuth } = useAuthStore();
  const resetInvitation = useInvitationStore((s) => s.resetInvitation);
  const displayName = groomName && brideName ? `${groomName} & ${brideName}` : "Undangan Saya";
  const avatarLetter = groomName?.[0]?.toUpperCase() ?? "U";

  function handleLogout() {
    clearAuth();
    resetInvitation();
    router.push("/login");
  }

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab />;
      case "guests": return <GuestsTab />;
      case "galeri": return <GalleryTab />;
      case "tema": return <ThemeTab />;
    }
  };

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 flex flex-col w-64 bg-[#F3F4F6] border-r border-gray-200 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-5 py-5 border-b border-gray-200">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#D4AF37] flex items-center justify-center">
              <Heart className="w-4 h-4 text-white" fill="white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-none" style={{ fontFamily: "var(--font-playfair)" }}>
                Undanganku
              </p>
              <Link href="/dashboard" className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#D4AF37] mt-0.5 transition-colors">
                <ArrowLeft className="w-3 h-3" />Semua Undangan
              </Link>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1 rounded-lg text-gray-400 hover:text-gray-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2.5 px-3 py-2.5 bg-white rounded-xl border border-gray-200">
            <div className="w-7 h-7 rounded-full bg-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37] text-xs font-bold">{avatarLetter}</div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 truncate">{displayName}</p>
              <p className="text-xs text-gray-400 truncate">{slug || "—"}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu</p>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.id}
              item={item}
              active={activeTab === item.id}
              onClick={() => { setActiveTab(item.id); setSidebarOpen(false); }}
            />
          ))}
        </nav>

        <div className="px-3 py-4 border-t border-gray-200 space-y-1">
          <button
            onClick={() => { router.push("/dashboard/editor"); setSidebarOpen(false); }}
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#D4AF37] hover:bg-[#b8962e] transition-all shadow-sm shadow-[#D4AF37]/20 w-full"
          >
            <Wand2 className="w-4 h-4 shrink-0" />
            <span>Buka Editor</span>
          </button>
          <a
            href={slug ? `/${slug}` : "/"}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-gray-600 hover:bg-gray-200/60 hover:text-gray-900 transition-all"
          >
            <ExternalLink className="w-4 h-4 shrink-0" />
            <span>Lihat Undangan</span>
          </a>
          {user && (
            <div className="pt-2 border-t border-gray-200 mt-2">
              <p className="px-3 text-xs text-gray-400 truncate mb-1">{user.email}</p>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all w-full"
              >
                <LogOut className="w-4 h-4 shrink-0" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3.5 border-b border-gray-200 bg-white">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-[#D4AF37] flex items-center justify-center">
              <Heart className="w-3 h-3 text-white" fill="white" />
            </div>
            <span className="text-sm font-bold text-gray-900" style={{ fontFamily: "var(--font-playfair)" }}>Undanganku</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 lg:pb-8">
            {renderContent()}
          </div>
        </main>

        <nav className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 z-10">
          <div className="flex">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors ${
                    active ? "text-[#D4AF37]" : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  <Icon className={`w-5 h-5 transition-transform ${active ? "scale-110" : ""}`} />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}
