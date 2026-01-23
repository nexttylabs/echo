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
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { PortalLayout } from "@/components/portal/portal-layout";
import { FeedbackDetail } from "@/components/feedback/feedback-detail";
import { PublicComments } from "@/components/comment/public-comments";
import { Button } from "@/components/ui/button";
import { getPortalPublicContext, getPortalSections } from "@/lib/portal/public-context";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { auth } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ organizationSlug: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations("feedback.detail");
  const { organizationSlug, id } = await params;
  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled) {
    return { title: t("publicTitle") };
  }

  const feedbackId = Number(id);
  if (Number.isNaN(feedbackId)) {
    return { title: t("publicTitle") };
  }

  const { db } = await import("@/lib/db");
  if (!db) {
    return { title: t("publicTitle") };
  }

  const result = await getFeedbackById(db, feedbackId);
  if (!result || "deleted" in result) {
    return { title: t("publicTitle") };
  }

  if (result.feedback.organizationId !== organization.id) {
    return { title: t("publicTitle") };
  }

  return {
    title: t("publicTitle"),
    description: t("publicDescription"),
    robots: context.seo?.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: t("publicTitle"),
      description: t("publicDescription"),
      type: "website",
    },
  };
}

export default async function OrganizationFeedbackDetailPage({ params }: PageProps) {
  const t = await getTranslations("feedback.detail");
  const { organizationSlug, id } = await params;
  const feedbackId = Number(id);

  if (Number.isNaN(feedbackId)) {
    notFound();
  }

  const context = await getPortalPublicContext(organizationSlug);
  const organization = context?.organization;

  if (!organization || !context?.portalEnabled || !context.modules.feedback) {
    notFound();
  }

  const { db } = await import("@/lib/db");
  if (!db) {
    notFound();
  }

  const result = await getFeedbackById(db, feedbackId);
  if (!result || "deleted" in result) {
    notFound();
  }

  if (result.feedback.organizationId !== organization.id) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  const sections = getPortalSections(organizationSlug, context.modules);

  return (
    <PortalLayout
      organizationName={organization.name}
      organizationSlug={organizationSlug}
      sections={sections}
    >
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm text-muted-foreground">{t("publicHeader")}</h2>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href={`/${organizationSlug}`}>{t("publicBackHome")}</Link>
            </Button>
            <Button asChild size="sm">
              <Link href={`/${organizationSlug}`}>{t("publicContinueSubmit")}</Link>
            </Button>
          </div>
        </div>
        <FeedbackDetail
          feedback={{
            ...result.feedback,
            attachments: [],
          }}
        />
        <PublicComments
          feedbackId={feedbackId}
          isAuthenticated={isAuthenticated}
          organizationId={organization.id}
          allowPublicComments={context.sharing.allowPublicComments}
          className="mt-6"
        />
      </div>
    </PortalLayout>
  );
}
