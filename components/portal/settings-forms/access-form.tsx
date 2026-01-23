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
      setMessage({ type: "error", text: sharingResult.error || "保存失败" });
      setSaving(false);
      return;
    }

    const seoResult = await updatePortalSettings(organizationId, "seo", seoPayload);

    if (seoResult.success) {
      setMessage({ type: "success", text: "可见性设置已保存" });
    } else {
      setMessage({ type: "error", text: seoResult.error || "保存失败" });
    }

    setSaving(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <SwitchField
        id="enabled"
        label="公开 Portal"
        description="关闭后访客无法访问公开门户"
        checked={enabled}
        onCheckedChange={(checked) => form.setValue("enabled", checked)}
      />

      <SwitchField
        id="allowPublicVoting"
        label="允许公开投票"
        description="访客无需登录即可投票"
        checked={allowPublicVoting}
        onCheckedChange={(checked) => form.setValue("allowPublicVoting", checked)}
      />

      <SwitchField
        id="allowPublicComments"
        label="允许公开评论"
        description="访客无需登录即可评论"
        checked={allowPublicComments}
        onCheckedChange={(checked) => form.setValue("allowPublicComments", checked)}
      />

      <SwitchField
        id="showVoteCount"
        label="显示投票数量"
        description="在反馈列表中显示投票计数"
        checked={showVoteCount}
        onCheckedChange={(checked) => form.setValue("showVoteCount", checked)}
      />

      <SwitchField
        id="showAuthor"
        label="显示提交者"
        description="显示反馈提交者名称"
        checked={showAuthor}
        onCheckedChange={(checked) => form.setValue("showAuthor", checked)}
      />

      <SwitchField
        id="noIndex"
        label="阻止搜索引擎索引"
        description="启用后搜索引擎将不会收录此页面"
        checked={noIndex}
        onCheckedChange={(checked) => form.setValue("noIndex", checked)}
      />

      <div className="flex items-center gap-4">
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          保存更改
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
