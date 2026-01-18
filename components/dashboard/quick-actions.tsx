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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Plus, List, Settings, Building2 } from "lucide-react";

export function QuickActions() {
  const t = useTranslations("dashboard.quickActions");
  
  return (
    <div className="flex flex-wrap gap-3">
      <Button asChild>
        <Link href="/admin/feedback/new">
          <Plus className="mr-2 h-4 w-4" />
          {t("submitFeedback")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/admin/feedback">
          <List className="mr-2 h-4 w-4" />
          {t("viewAllFeedback")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/settings/notifications">
          <Settings className="mr-2 h-4 w-4" />
          {t("settings")}
        </Link>
      </Button>
      <Button variant="outline" asChild>
        <Link href="/settings/organizations/new">
          <Building2 className="mr-2 h-4 w-4" />
          {t("organizationSettings")}
        </Link>
      </Button>
    </div>
  );
}
