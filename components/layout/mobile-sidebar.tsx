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

import { useState } from "react";
import { Menu } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Sidebar } from "./sidebar";
import type { UserRole } from "@/lib/auth/permissions";

interface MobileSidebarProps {
  user: {
    name: string;
    email: string;
    image?: string | null;
    role: UserRole;
  };
  organizations?: Array<{ id: string; name: string; slug: string; role: string }>;
  currentOrgId?: string | null;
}

export function MobileSidebar({ user, organizations = [], currentOrgId }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations("navigation");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">{t("openMenu")}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar
          user={user}
          organizations={organizations}
          currentOrgId={currentOrgId}
          onClose={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
