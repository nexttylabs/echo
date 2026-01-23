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
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { updatePortalSettings } from "@/lib/services/portal-settings";
import type { PortalCopyConfig } from "@/lib/db/schema";

interface CopyFormProps {
  organizationId: string;
  initialData?: PortalCopyConfig;
}

type CopyFormData = Pick<PortalCopyConfig, "title">;

export function CopyForm({ organizationId, initialData }: CopyFormProps) {
  const t = useTranslations("settings.portal.branding.copyForm");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<CopyFormData>({
    defaultValues: {
      title: initialData?.title ?? t("defaults.title"),
    },
  });

  const onSubmit = async (data: CopyFormData) => {
    setSaving(true);
    setMessage(null);

    const result = await updatePortalSettings(organizationId, "copy", data);

    if (result.success) {
      setMessage({ type: "success", text: t("status.saved") });
    } else {
      setMessage({ type: "error", text: result.error || t("status.saveFailed") });
    }

    setSaving(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">{t("labels.title")}</Label>
        <Input
          id="title"
          placeholder={t("placeholders.title")}
          {...form.register("title")}
        />
        <p className="text-sm text-muted-foreground">{t("help.title")}</p>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("buttons.save")}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600" : "text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
