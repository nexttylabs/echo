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
import type { PortalSharingConfig } from "@/lib/db/schema";

interface SharingFormProps {
  organizationId: string;
  initialData?: PortalSharingConfig;
}

type SharingFormData = {
  socialSharing: {
    twitter: boolean;
    linkedin: boolean;
    facebook: boolean;
  };
};

function SwitchField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
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

export function SharingForm({ organizationId, initialData }: SharingFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<SharingFormData>({
    defaultValues: {
      socialSharing: {
        twitter: initialData?.socialSharing?.twitter ?? true,
        linkedin: initialData?.socialSharing?.linkedin ?? true,
        facebook: initialData?.socialSharing?.facebook ?? false,
      },
    },
  });
  const socialSharing = useWatch({ control: form.control, name: "socialSharing" }) ?? {
    twitter: true,
    linkedin: true,
    facebook: false,
  };

  const onSubmit = async (data: SharingFormData) => {
    setSaving(true);
    setMessage(null);

    const payload: PortalSharingConfig = {
      ...initialData,
      socialSharing: data.socialSharing,
    };

    const result = await updatePortalSettings(organizationId, "sharing", payload);

    if (result.success) {
      setMessage({ type: "success", text: "分享设置已保存" });
    } else {
      setMessage({ type: "error", text: result.error || "保存失败" });
    }

    setSaving(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Social Sharing Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">社交分享按钮</h3>

        <SwitchField
          id="socialSharing.twitter"
          label="Twitter / X"
          description="显示分享到 Twitter 的按钮"
          checked={socialSharing.twitter ?? true}
          onCheckedChange={(checked) => form.setValue("socialSharing.twitter", checked)}
        />

        <SwitchField
          id="socialSharing.linkedin"
          label="LinkedIn"
          description="显示分享到 LinkedIn 的按钮"
          checked={socialSharing.linkedin ?? true}
          onCheckedChange={(checked) => form.setValue("socialSharing.linkedin", checked)}
        />

        <SwitchField
          id="socialSharing.facebook"
          label="Facebook"
          description="显示分享到 Facebook 的按钮"
          checked={socialSharing.facebook ?? false}
          onCheckedChange={(checked) => form.setValue("socialSharing.facebook", checked)}
        />
      </div>

      {/* Submit */}
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
