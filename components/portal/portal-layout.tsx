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

import { headers } from "next/headers";
import { auth } from "@/lib/auth/config";
import { PortalHeader } from "./portal-header";
import { PortalTabNav, type PortalSection } from "./portal-tab-nav";
import { cn } from "@/lib/utils";

interface PortalLayoutProps {
  organizationName: string;
  organizationSlug: string;
  sections: readonly PortalSection[];
  children: React.ReactNode;
  className?: string;
}

export async function PortalLayout({
  organizationName,
  organizationSlug,
  sections,
  children,
  className,
}: PortalLayoutProps) {
  // Get current user session
  const session = await auth.api.getSession({ headers: await headers() });
  const user = session?.user
    ? {
        name: session.user.name ?? "User",
        email: session.user.email ?? "",
        image: session.user.image,
      }
    : null;

  return (
    <div className={cn("min-h-screen bg-muted/30", className)}>
      <PortalHeader
        logo={organizationName}
        organizationSlug={organizationSlug}
        user={user}
      />
      <PortalTabNav sections={sections} />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
