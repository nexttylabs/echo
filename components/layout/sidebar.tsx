"use client";


/*
 * Copyright (c) 2026 Nexttylabs Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import {
  LayoutDashboard,
  MessageSquare,
  Settings,
  LogOut,
  ChevronUp,
  Building2,
  Plus,
  Check,
  Languages,
} from "lucide-react";
import type { UserRole } from "@/lib/auth/permissions";
import { authClient } from "@/lib/auth/client";
import { useLocale } from "next-intl";
import { useTransition, useEffect, useRef } from "react";
import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config";
import {
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";

interface SidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
  organizations?: Array<{ id: string; name: string; slug: string; role: string }>;
  currentOrgId?: string | null;
  onClose?: () => void;
}

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function Sidebar({ user, organizations = [], currentOrgId, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("navigation");
  const tLang = useTranslations("language");
  const locale = useLocale() as AppLocale;
  const [isPending, startTransition] = useTransition();
  const pendingOrgIdRef = useRef<string | null>(null);
  const pendingLocaleRef = useRef<AppLocale | null>(null);

  const navItems = [
    { href: "/dashboard", label: t("dashboard"), icon: LayoutDashboard },
    { href: "/admin/feedback", label: t("feedback"), icon: MessageSquare },
  ];

  const handleLinkClick = () => {
    onClose?.();
  };

  const handleLogout = async () => {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
        },
      },
    });
    onClose?.();
  };

  // Set organization cookie when pendingOrgId changes
  useEffect(() => {
    const orgId = pendingOrgIdRef.current;
    if (!orgId) return;
    const params = new URLSearchParams(searchParams);
    params.set("organizationId", orgId);
    document.cookie = `orgId=${orgId};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};samesite=lax`;
    router.replace(`/dashboard?${params.toString()}`);
    startTransition(() => {
      pendingOrgIdRef.current = null;
    });
    onClose?.();
  }, [searchParams, router, onClose]);

  const handleOrgSwitch = (orgId: string) => {
    pendingOrgIdRef.current = orgId;
  };

  // Set locale cookie when pendingLocale changes
  useEffect(() => {
    const nextLocale = pendingLocaleRef.current;
    if (!nextLocale) return;
    if (nextLocale === locale) {
      startTransition(() => {
        pendingLocaleRef.current = null;
      });
      return;
    }
    const secure = window.location.protocol === "https:" ? ";secure" : "";
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale};path=/;max-age=${60 * 60 * 24 * 365};samesite=lax${secure}`;
    startTransition(() => {
      router.refresh();
      pendingLocaleRef.current = null;
    });
  }, [locale, router]);

  const handleLocaleChange = (nextLocale: AppLocale) => {
    pendingLocaleRef.current = nextLocale;
  };

  const currentOrg = organizations.find((org) => org.id === currentOrgId);

  return (
    <div className="flex h-full flex-col bg-background">
      {/* Logo */}
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold" onClick={handleLinkClick}>
          <span className="text-xl">Echo</span>
        </Link>
      </div>

      <div className="flex-1 overflow-auto py-4">
        {/* Navigation */}
        <div className="px-4 mb-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2 block">
            {t("sectionLabel")}
          </span>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleLinkClick}
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-muted",
                  pathname === item.href && "bg-muted font-medium"
                )}
              >
                <item.icon className="h-4 w-4 text-muted-foreground" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

      </div>

      {/* User Profile Dropdown */}
      <div className="border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-lg px-2 py-2 hover:bg-muted transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarImage src={user.image || undefined} alt={user.name} />
                <AvatarFallback>{user.name.slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {currentOrg?.name || user.email}
                </p>
              </div>
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {/* Settings - Most commonly used */}
            <DropdownMenuGroup>
              <DropdownMenuItem asChild>
                <Link href="/settings" onClick={handleLinkClick}>
                  <Settings className="mr-2 h-4 w-4" />
                  {t("settings")}
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Organization Switcher */}
            {organizations.length > 0 && (
              <DropdownMenuGroup>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Building2 className="mr-2 h-4 w-4" />
                    <span className="flex-1 truncate">{currentOrg?.name || t("selectOrganization")}</span>
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {organizations.map((org) => (
                      <DropdownMenuItem
                        key={org.id}
                        onClick={() => handleOrgSwitch(org.id)}
                        className="flex items-center justify-between"
                      >
                        <span className="truncate">{org.name}</span>
                        {org.id === currentOrgId && (
                          <Check className="ml-2 h-4 w-4 text-primary flex-shrink-0" />
                        )}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/settings/organizations/new" onClick={handleLinkClick}>
                        <Plus className="mr-2 h-4 w-4" />
                        {t("newOrganization")}
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
              </DropdownMenuGroup>
            )}

            {/* Language Switcher */}
            <DropdownMenuGroup>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={isPending}>
                  <Languages className="mr-2 h-4 w-4" />
                  {tLang("label")}
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuRadioGroup value={locale}>
                    {SUPPORTED_LOCALES.map((supportedLocale) => (
                      <DropdownMenuRadioItem
                        key={supportedLocale}
                        value={supportedLocale}
                        onClick={() => handleLocaleChange(supportedLocale)}
                      >
                        {tLang(supportedLocale)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            {/* Logout - Destructive action at the bottom */}
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {t("logout")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
