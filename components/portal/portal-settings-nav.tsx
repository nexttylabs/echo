"use client";


/*
 * Copyright (c) 2026 Echo Team
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
import { cn } from "@/lib/utils";

const navItems = [
  { label: "概览", slug: "" },
  { label: "体验", slug: "/experience" },
  { label: "传播", slug: "/growth" },
  { label: "可见性", slug: "/access" },
];

interface PortalSettingsNavProps {
  baseHref: string;
}

export function PortalSettingsNav({ baseHref }: PortalSettingsNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 rounded-xl border bg-white/70 p-2 shadow-sm">
      {navItems.map((item) => {
        const href = `${baseHref}${item.slug}`;
        const isActive = pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-slate-900 text-white"
                : "text-slate-700 hover:bg-slate-100",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
