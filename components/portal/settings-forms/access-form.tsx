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
import { useForm, useWatch } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { updatePortalSettings } from "@/lib/services/portal-settings";
import type { PortalSeoConfig, PortalSharingConfig } from "@/lib/db/schema";

interface PortalAccessFormProps {
  organizationId: string;
  initialSharing?: PortalSharingConfig;
  initialSeo?: PortalSeoConfig;
}

type AccessFormData = {
  enabled: boolean;
  allowPublicVoting: boolean;
  allowPublicComments: boolean;
  showVoteCount: boolean;
  showAuthor: boolean;
  noIndex: boolean;
};

function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: keyof AccessFormData;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border p-4">
      <div className="space-y-0.5">
        <Label htmlFor={id}>{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

export function PortalAccessForm({ organizationId, initialSharing, initialSeo }: PortalAccessFormProps) {
  const t = useTranslations("settings.access.form");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<AccessFormData>({
    defaultValues: {
      enabled: initialSharing?.enabled ?? true,
      allowPublicVoting: initialSharing?.allowPublicVoting ?? true,
      allowPublicComments: initialSharing?.allowPublicComments ?? false,
      showVoteCount: initialSharing?.showVoteCount ?? true,
      showAuthor: initialSharing?.showAuthor ?? false,
      noIndex: initialSeo?.noIndex ?? false,
    },
  });
  const enabled = useWatch({ control: form.control, name: "enabled" }) ?? true;
  const allowPublicVoting = useWatch({ control: form.control, name: "allowPublicVoting" }) ?? true;
  const allowPublicComments = useWatch({ control: form.control, name: "allowPublicComments" }) ?? false;
  const showVoteCount = useWatch({ control: form.control, name: "showVoteCount" }) ?? true;
  const showAuthor = useWatch({ control: form.control, name: "showAuthor" }) ?? false;
  const noIndex = useWatch({ control: form.control, name: "noIndex" }) ?? false;

  const onSubmit = async (data: AccessFormData) => {
    setSaving(true);
    setMessage(null);

    const sharingPayload: PortalSharingConfig = {
      ...initialSharing,
      enabled: data.enabled,
      allowPublicVoting: data.allowPublicVoting,
      allowPublicComments: data.allowPublicComments,
      showVoteCount: data.showVoteCount,
      showAuthor: data.showAuthor,
    };

    const seoPayload: PortalSeoConfig = {
      ...initialSeo,
      noIndex: data.noIndex,
    };

    const sharingResult = await updatePortalSettings(organizationId, "sharing", sharingPayload);

    if (!sharingResult.success) {
      setMessage({ type: "error", text: sharingResult.error || t("saveFailed") });
      setSaving(false);
      return;
    }

    const seoResult = await updatePortalSettings(organizationId, "seo", seoPayload);

    if (seoResult.success) {
      setMessage({ type: "success", text: t("saveSuccess") });
    } else {
      setMessage({ type: "error", text: seoResult.error || t("saveFailed") });
    }

    setSaving(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SwitchField
        id="enabled"
        label={t("enabled")}
        description={t("enabledDesc")}
        checked={enabled}
        onCheckedChange={(checked) => form.setValue("enabled", checked)}
      />

      <SwitchField
        id="allowPublicVoting"
        label={t("allowPublicVoting")}
        description={t("allowPublicVotingDesc")}
        checked={allowPublicVoting}
        onCheckedChange={(checked) => form.setValue("allowPublicVoting", checked)}
      />

      <SwitchField
        id="allowPublicComments"
        label={t("allowPublicComments")}
        description={t("allowPublicCommentsDesc")}
        checked={allowPublicComments}
        onCheckedChange={(checked) => form.setValue("allowPublicComments", checked)}
      />

      <SwitchField
        id="showVoteCount"
        label={t("showVoteCount")}
        description={t("showVoteCountDesc")}
        checked={showVoteCount}
        onCheckedChange={(checked) => form.setValue("showVoteCount", checked)}
      />

      <SwitchField
        id="showAuthor"
        label={t("showAuthor")}
        description={t("showAuthorDesc")}
        checked={showAuthor}
        onCheckedChange={(checked) => form.setValue("showAuthor", checked)}
      />

      <SwitchField
        id="noIndex"
        label={t("noIndex")}
        description={t("noIndexDesc")}
        checked={noIndex}
        onCheckedChange={(checked) => form.setValue("noIndex", checked)}
      />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {t("saveButton")}
        </Button>
        {message && (
          <p
            className={`text-sm ${
              message.type === "success" ? "text-green-600 dark:text-green-400" : "text-destructive"
            }`}
          >
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}

