"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Menu, X, Bell, ChevronDown, UserRound } from "lucide-react";
import { useEffect, useState } from "react";

// TODO: Thay bằng dữ liệu user thật (lấy từ session/auth của bạn)
// avatarUrl để null/undefined nếu user chưa có ảnh đại diện -> sẽ hiện icon mặc định
const currentUser: { name: string; avatarUrl?: string | null } = {
  name: "Freelancer",
  avatarUrl: null,
};

export function Header() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const showAvatarImage = Boolean(currentUser.avatarUrl) && !avatarError;

  useEffect(() => {
    const keyword = searchParams.get("keyword") ?? "";
    setSearchQuery(keyword);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    const params = new URLSearchParams(searchParams.toString());

    const trimmedKeyword = searchQuery.trim();

    if (trimmedKeyword) {
      params.set("keyword", trimmedKeyword);
    } else {
      params.delete("keyword");
    }

    params.set("page", "1");

    router.push(`/find-work?${params.toString()}`);
  };

  const navLinks = [
    { href: "/find-work", label: "Find Work" },
    { href: "/proposals", label: "Proposals" },
    { href: "/forum", label: "Forum" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#eaf8df] dark:bg-[#12331f]">
      <nav className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 shrink-0 font-bold text-xl text-[#4fae2e]"
        >
          <Image
            src="/Logo.png"
            alt="Frevia logo"
            width={28}
            height={28}
            className="h-7 w-7 object-contain"
            priority
          />
          Frevia
        </Link>

        {/* Search Bar */}
        <form
          onSubmit={handleSearch}
          className="hidden flex-1 max-w-md md:block"
        >
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search for projects, skills..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border-0 bg-white py-2 pl-10 pr-4 text-sm text-gray-700 placeholder-gray-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4fae2e]/30"
            />
          </div>
        </form>

        {/* Navigation Links */}
        <div className="hidden items-center gap-6 sm:flex">
          {navLinks.map((link, idx) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm font-medium transition-colors ${
                idx === 0
                  ? "text-[#4fae2e] underline underline-offset-4 decoration-2"
                  : "text-gray-700 hover:text-[#4fae2e] dark:text-gray-200"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Right side: Notifications + User */}
        <div className="flex items-center gap-4 ml-auto">
          {/* Notification bell */}
          <button
            aria-label="Notifications"
            className="relative hidden p-2 rounded-full hover:bg-black/5 sm:inline-flex"
          >
            <Bell className="h-5 w-5 text-gray-700 dark:text-gray-200" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-[#eaf8df]" />
          </button>

          {/* User avatar + dropdown */}
          <div className="relative hidden sm:block">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2"
            >
              {showAvatarImage ? (
                <Image
                  src={currentUser.avatarUrl as string}
                  alt="User avatar"
                  width={32}
                  height={32}
                  onError={() => setAvatarError(true)}
                  className="h-8 w-8 rounded-full object-cover border border-white"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white border border-white">
                  <UserRound className="h-5 w-5 text-gray-400" />
                </span>
              )}
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {currentUser.name}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-300" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border border-border bg-background py-1 shadow-lg">
                <Link
                  href="/profile"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <Link
                  href="/settings"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Settings
                </Link>
                <Link
                  href="/logout"
                  className="block px-4 py-2 text-sm text-foreground hover:bg-muted"
                  onClick={() => setIsUserMenuOpen(false)}
                >
                  Log Out
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="sm:hidden p-2 rounded-md hover:bg-black/5 transition-colors"
            aria-label="Toggle menu"
          >
            {isMenuOpen ? (
              <X className="h-5 w-5 text-gray-800" />
            ) : (
              <Menu className="h-5 w-5 text-gray-800" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="sm:hidden border-t border-black/10 bg-[#eaf8df] p-4 space-y-3">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-gray-700 hover:text-[#4fae2e] transition-colors"
              onClick={() => setIsMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 border-t border-black/10 flex items-center gap-2">
            {showAvatarImage ? (
              <Image
                src={currentUser.avatarUrl as string}
                alt="User avatar"
                width={28}
                height={28}
                onError={() => setAvatarError(true)}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white border border-gray-200">
                <UserRound className="h-4 w-4 text-gray-400" />
              </span>
            )}
            <span className="text-sm font-medium text-gray-800">
              {currentUser.name}
            </span>
          </div>
        </div>
      )}
    </header>
  );
}