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
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { User, Palette, Key, Globe, Users, Mail, MessageSquare, FileText, LayoutGrid, Plug, AlertTriangle } from "lucide-react";
import type { UserRole } from "@/lib/auth/permissions";

interface SettingsSidebarProps {
  userRole: UserRole;
}

export function SettingsSidebar({ userRole }: SettingsSidebarProps) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const isOwnerOrAdmin = userRole === "owner" || userRole === "admin";
  const isAdminOrPM = isOwnerOrAdmin || userRole === "product_manager";

  const groupedItems = [
    {
      title: t("groups.general"),
      items: [
        { href: "/settings/profile", label: t("items.profile"), icon: User },
        { href: "/settings/organization", label: t("items.organization"), icon: Users, show: isOwnerOrAdmin },
      ],
    },
    {
      title: t("groups.brandingCustomizations"),
      items: [
        { href: "/settings/appearance", label: t("items.appearance"), icon: Palette },
        { href: "/settings/notifications", label: t("items.notificationEmails"), icon: Mail },
      ],
    },
    {
      title: t("groups.accessAuthentication"),
      items: [
        { href: "/settings/access", label: t("items.organizationAccess"), icon: Globe, show: isAdminOrPM },
        { href: "/settings/api-keys", label: t("items.apiKeys"), icon: Key, show: isAdminOrPM },
      ],
    },
    {
      title: t("groups.modules"),
      items: [
        { href: "/settings/modules", label: t("items.customizeModules"), icon: LayoutGrid, show: isAdminOrPM },
        { href: "/settings/feedback", label: t("items.feedbackRoadmap"), icon: MessageSquare, show: isAdminOrPM },
        { href: "/settings/changelog", label: t("items.changelog"), icon: FileText, show: isAdminOrPM },
      ],
    },
    {
      title: t("groups.other"),
      items: [
        { href: "/settings/widgets", label: t("items.widgetsEmbeds"), icon: LayoutGrid, show: isAdminOrPM },
        { href: "/settings/integrations", label: t("items.integrations"), icon: Plug, show: isAdminOrPM },

        { href: "/settings/danger-zone", label: t("items.dangerZone"), icon: AlertTriangle, show: isOwnerOrAdmin },
      ],
    },
  ];


  return (
    <nav className="w-56 shrink-0 border-r bg-muted/30 p-4">
      <h2 className="mb-4 px-2 text-lg font-semibold">{t("title")}</h2>
      <div className="space-y-6">
        {groupedItems.map((group) => {
          const visibleItems = group.items.filter((item) => item.show ?? true);
          if (visibleItems.length === 0) {
            return null;
          }

          return (
            <div key={group.title} className="space-y-1">
              <div className="px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {group.title}
              </div>
              {visibleItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                    pathname === item.href && "bg-muted font-medium"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </div>
          );
        })}
      </div>
    </nav>
  );
}

