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

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type InviteStatus =
  | "loading"
  | "success"
  | "expired"
  | "unauthorized"
  | "error";


export default function InviteAcceptPage({
  params,
}: {
  params: { token: string };
}) {
  const t = useTranslations("invite");
  const [status, setStatus] = useState<InviteStatus>("loading");

  const token = useMemo(() => params.token, [params.token]);

  useEffect(() => {
    let active = true;

    const acceptInvite = async () => {
      try {
        const res = await fetch("/api/invitations/accept", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        if (!active) return;

        if (res.status === 401) {
          setStatus("unauthorized");
          return;
        }

        if (res.status === 410) {
          setStatus("expired");
          return;
        }

        if (!res.ok) {
          setStatus("error");
          return;
        }

        setStatus("success");
      } catch {
        if (active) setStatus("error");
      }
    };

    acceptInvite();

    return () => {
      active = false;
    };
  }, [token]);

  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto w-full max-w-xl">
        <Card>
          <CardHeader>
            <CardTitle>{t(`status.${status}.title`)}</CardTitle>
            <CardDescription>{t(`status.${status}.description`)}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {status === "success" ? (
              <Button asChild>
                <Link href="/dashboard">{t("buttons.dashboard")}</Link>
              </Button>
            ) : null}
            {status === "unauthorized" ? (
              <Button asChild>
                <Link href="/login">{t("buttons.login")}</Link>
              </Button>
            ) : null}
            {status === "expired" || status === "error" ? (
              <Button asChild variant="outline">
                <Link href="/dashboard">{t("buttons.back")}</Link>
              </Button>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
