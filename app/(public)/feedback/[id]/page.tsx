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
import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { getFeedbackById } from "@/lib/feedback/get-feedback-by-id";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth/config";
import { FeedbackDetail } from "@/components/feedback/feedback-detail";
import { PublicComments } from "@/components/comment/public-comments";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";
interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations("feedback.detail");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!db || !rawId || Number.isNaN(id)) {
    return { title: t("publicTitle") };
  }

  const result = await getFeedbackById(db, id);
  if (!result || "deleted" in result) {
    return { title: t("publicTitle") };
  }

  return {
    title: t("publicTitle"),
    description: t("publicDescription"),
    openGraph: {
      title: t("publicTitle"),
      description: t("publicDescription"),
      type: "website",
    },
  };
}

export default async function FeedbackDetailPage({ params }: PageProps) {
  const t = await getTranslations("feedback.detail");
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!db || !rawId || Number.isNaN(id)) {
    notFound();
  }

  const result = await getFeedbackById(db, id);
  if (!result || "deleted" in result) {
    notFound();
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const isAuthenticated = !!session?.user;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm text-muted-foreground">{t("publicHeader")}</h2>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/">{t("publicBackHome")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/">{t("publicContinueSubmit")}</Link>
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
        feedbackId={id}
        isAuthenticated={isAuthenticated}
        organizationId={result.feedback.organizationId}
        allowPublicComments={false}
        className="mt-6"
      />
    </div>
  );
}
