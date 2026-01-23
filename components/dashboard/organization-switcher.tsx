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

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrgOption = { id: string; name: string; slug: string; role: string };

type Props = {
  organizations: OrgOption[];
  currentOrgId: string;
  shouldPersistDefault?: boolean;
};

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

export function OrganizationSwitcher({
  organizations,
  currentOrgId,
  shouldPersistDefault = false,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [value, setValue] = useState(currentOrgId);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Set mounted state after hydration to avoid hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  const persistOrganization = useCallback((orgId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("organizationId", orgId);
    document.cookie = `orgId=${orgId};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};samesite=lax`;
    router.replace(`/dashboard?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    if (!organizations.length || !shouldPersistDefault) return;
    persistOrganization(currentOrgId);
  }, [organizations.length, currentOrgId, persistOrganization, shouldPersistDefault]);

  const handleChange = (orgId: string) => {
    setValue(orgId);
    persistOrganization(orgId);
  };

  if (!mounted) {
    return (
      <div className="flex h-9 w-[240px] items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50">
        <span className="block truncate">{organizations.find(o => o.id === currentOrgId)?.name || "Select Organization"}</span>
      </div>
    );
  }

  return (
    <Select value={value} onValueChange={handleChange}>
      <SelectTrigger className="w-[240px]">
        <SelectValue placeholder="选择组织" />
      </SelectTrigger>
      <SelectContent>
        {organizations.map((org) => (
          <SelectItem key={org.id} value={org.id}>
            {org.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
