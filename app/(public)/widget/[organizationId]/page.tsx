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

import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { db } from "@/lib/db";
import { organizations, organizationSettings } from "@/lib/db/schema";
import WidgetForm from "@/components/widget/widget-form";

interface WidgetPageProps {
  params: Promise<{
    organizationId: string;
  }>;
  searchParams: Promise<{
    theme?: string;
    primaryColor?: string;
    buttonText?: string;
    position?: string;
  }>;
}

export async function generateMetadata({
  params,
}: WidgetPageProps): Promise<Metadata> {
  const { organizationId } = await params;

  if (!db) {
    return { title: "Feedback" };
  }

  const [organization] = await db
    .select({ name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  return {
    title: organization?.name || "Feedback",
    robots: "noindex, nofollow",
  };
}

export default async function WidgetPage({
  params,
  searchParams,
}: WidgetPageProps) {
  if (!db) {
    return notFound();
  }

  const { organizationId } = await params;
  const resolvedSearchParams = await searchParams;

  const [organization] = await db
    .select({ id: organizations.id, name: organizations.name })
    .from(organizations)
    .where(eq(organizations.id, organizationId))
    .limit(1);

  if (!organization) {
    return notFound();
  }

  const [settings] = await db
    .select({ widgetConfig: organizationSettings.widgetConfig })
    .from(organizationSettings)
    .where(eq(organizationSettings.organizationId, organizationId))
    .limit(1);

  const widgetConfig = settings?.widgetConfig || {};

  const config = {
    theme:
      (resolvedSearchParams.theme as "light" | "dark" | "auto") ||
      widgetConfig.theme ||
      "auto",
    primaryColor:
      resolvedSearchParams.primaryColor || widgetConfig.primaryColor || "#3b82f6",
    buttonText: resolvedSearchParams.buttonText
      ? decodeURIComponent(resolvedSearchParams.buttonText)
      : widgetConfig.buttonText || "Feedback",
    position:
      resolvedSearchParams.position ||
      widgetConfig.buttonPosition ||
      "bottom-right",
    fields: widgetConfig.fields || {
      showType: true,
      showPriority: true,
      showDescription: true,
      requireEmail: false,
    },
    types: widgetConfig.types || ["bug", "feature", "issue"],
    customCSS: widgetConfig.customCSS || "",
  };

  return (
    <WidgetForm
      organization={{
        id: organization.id,
        name: organization.name,
      }}
      config={config}
    />
  );
}

export const dynamic = "force-dynamic";
