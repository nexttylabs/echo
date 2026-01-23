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

"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { UserRole } from "@/lib/auth/permissions";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
}

interface OrganizationContextValue {
  currentOrganization: Organization | null;
  organizations: Organization[];
  setOrganizations: (orgs: Organization[], currentId?: string | null) => void;
  setCurrentOrganization: (orgId: string) => void;
}

const OrganizationContext = createContext<OrganizationContextValue | null>(
  null
);

interface OrganizationProviderProps {
  children: ReactNode;
  initialOrganizations?: Organization[];
  initialCurrentOrgId?: string | null;
}

export function OrganizationProvider({
  children,
  initialOrganizations = [],
  initialCurrentOrgId,
}: OrganizationProviderProps) {
  const [organizations, setOrganizationsState] =
    useState<Organization[]>(initialOrganizations);
  const [currentOrganization, setCurrentOrganizationState] =
    useState<Organization | null>(() => {
      if (initialCurrentOrgId) {
        return (
          initialOrganizations.find((o) => o.id === initialCurrentOrgId) || null
        );
      }
      return initialOrganizations[0] || null;
    });

  const setOrganizations = useCallback(
    (orgs: Organization[], currentId?: string | null) => {
      setOrganizationsState(orgs);
      const current = currentId ? orgs.find((o) => o.id === currentId) : orgs[0];
      setCurrentOrganizationState(current || null);
    },
    []
  );

  const setCurrentOrganization = useCallback(
    (orgId: string) => {
      const org = organizations.find((o) => o.id === orgId);
      if (org) {
        setCurrentOrganizationState(org);
      }
    },
    [organizations]
  );

  return (
    <OrganizationContext.Provider
      value={{
        currentOrganization,
        organizations,
        setOrganizations,
        setCurrentOrganization,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization(): OrganizationContextValue {
  const context = useContext(OrganizationContext);
  if (!context) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}

export function useCurrentRole(): UserRole | null {
  const { currentOrganization } = useOrganization();
  return currentOrganization?.role || null;
}
