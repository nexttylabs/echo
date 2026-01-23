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
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon?: string; // Emoji icon
}

interface HelpCenterLayoutProps {
  organizationSlug: string;
  children: React.ReactNode;
  className?: string;
}

const navItems: NavItem[] = [
  { label: "Feedback", href: "", icon: "💬" },
  { label: "Roadmap", href: "/roadmap", icon: "🗺️" },
  { label: "Changelog", href: "/changelog", icon: "📋" },
];

export function HelpCenterLayout({
  organizationSlug,
  children,
  className,
}: HelpCenterLayoutProps) {
  const pathname = usePathname();

  return (
    <div className={cn("flex flex-col lg:flex-row gap-8", className)}>
      {/* Left Sidebar */}
      <aside className="lg:w-64 shrink-0">
        <nav className="sticky top-24 space-y-1">
          {navItems.map((item) => {
            const href = `/${organizationSlug}${item.href}`;
            const isActive = pathname === href;

            return (
              <Link
                key={item.href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1">{children}</div>
    </div>
  );
}

interface HelpCenterSearchProps {
  className?: string;
}

export function HelpCenterSearch({ className }: HelpCenterSearchProps) {
  return (
    <div className={cn("text-center space-y-8", className)}>
      {/* Hero */}
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">
          How can we help you?
        </h1>
        <p className="text-lg text-muted-foreground max-w-xl mx-auto">
          Search our knowledge base or browse categories below.
        </p>
      </div>

      {/* Search Input */}
      <div className="max-w-xl mx-auto relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search for help..."
          className="h-14 pl-12 text-lg rounded-full shadow-sm"
        />
      </div>
    </div>
  );
}

export interface HelpArticle {
  id: string;
  title: string;
  excerpt?: string;
  category: string;
}

interface HelpArticleListProps {
  articles: HelpArticle[];
  className?: string;
}

export function HelpArticleList({ articles, className }: HelpArticleListProps) {
  // Group by category
  const grouped = articles.reduce(
    (acc, article) => {
      if (!acc[article.category]) {
        acc[article.category] = [];
      }
      acc[article.category].push(article);
      return acc;
    },
    {} as Record<string, HelpArticle[]>
  );

  if (articles.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>No articles available yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("grid gap-8 md:grid-cols-2 lg:grid-cols-3", className)}>
      {Object.entries(grouped).map(([category, categoryArticles]) => (
        <div key={category} className="space-y-4">
          <h3 className="font-semibold text-lg">{category}</h3>
          <div className="space-y-2">
            {categoryArticles.map((article) => (
              <Link
                key={article.id}
                href={`/help/${article.id}`}
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {article.title}
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
