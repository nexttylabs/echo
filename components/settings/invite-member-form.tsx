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

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DEFAULT_ROLE = "member";

type InviteMemberFormProps = {
  organizationId: string;
};

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const t = useTranslations("settings.organizationPage.invite");
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/organizations/${organizationId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: DEFAULT_ROLE }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setError(json?.error ?? t("sendFailed"));
      setIsLoading(false);
      return;
    }

    setSuccess(t("sendSuccess"));
    setEmail("");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("emailLabel")}</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>{t("roleLabel")}</Label>
            <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-600">
              <Badge variant="secondary">{DEFAULT_ROLE}</Badge>
              <span>{t("roleNote")}</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? t("sending") : t("send")}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

