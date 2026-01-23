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
import { cn } from "@/lib/utils";

export interface PortalSection {
  label: string;
  href: string;
  icon?: React.ReactNode;
  exact?: boolean;
}

interface PortalTabNavProps {
  sections: readonly PortalSection[];
  className?: string;
}

export function PortalTabNav({ sections, className }: PortalTabNavProps) {
  const pathname = usePathname();

  return (
    <div className={cn("border-b bg-background", className)}>
      <div className="container mx-auto px-4">
        <nav className="flex items-center gap-2 py-2" role="tablist">
          {sections.map((section) => {
            // Check if current path matches this section
            const isActive = section.exact
              ? pathname === section.href
              : pathname === section.href ||
                (section.href !== "/" && pathname.startsWith(section.href + "/"));

            return (
              <Link
                key={section.href}
                href={section.href}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "relative inline-flex h-10 items-center px-4 text-sm font-medium transition-colors",
                  "rounded-full border border-transparent hover:bg-muted/60 hover:border-border/40",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  isActive
                    ? "bg-muted/70 text-foreground border-border/60 font-semibold shadow-[inset_0_-1px_0_0_hsl(var(--border)),0_1px_2px_hsl(var(--foreground)/0.08)]"
                    : "text-muted-foreground/70 hover:text-foreground"
                )}
              >
                <span className="inline-flex items-center gap-2 leading-none [&_svg]:size-4 [&_svg]:align-middle">
                  {section.icon}
                  {section.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
