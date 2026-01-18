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

import { Sidebar } from "./sidebar";
import { MobileSidebar } from "./mobile-sidebar";
import type { UserRole } from "@/lib/auth/permissions";

interface DashboardLayoutProps {
  children: React.ReactNode;
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
  organizations?: Array<{ id: string; name: string; slug: string; role: string }>;
  currentOrgId?: string | null;
}

export function DashboardLayout({ children, user, organizations = [], currentOrgId }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:fixed md:inset-y-0 border-r">
        <Sidebar user={user} organizations={organizations} currentOrgId={currentOrgId} />
      </aside>

      {/* Main Content */}
      <div className="flex-1 md:pl-60">
        {/* Mobile Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 md:hidden">
          <MobileSidebar
            user={user}
            organizations={organizations}
            currentOrgId={currentOrgId}
          />
          <span className="font-semibold">Echo</span>
        </header>

        {/* Page Content */}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
