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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { updatePortalSettings } from "@/lib/services/portal-settings";
import type { PortalSeoConfig } from "@/lib/db/schema";

interface SeoFormProps {
  organizationId: string;
  initialData?: PortalSeoConfig;
  showNoIndex?: boolean;
}

export function SeoForm({ organizationId, initialData, showNoIndex = true }: SeoFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<PortalSeoConfig>({
    defaultValues: {
      metaTitle: initialData?.metaTitle ?? "",
      metaDescription: initialData?.metaDescription ?? "",
      ogImage: initialData?.ogImage ?? "",
      favicon: initialData?.favicon ?? "",
      noIndex: initialData?.noIndex ?? false,
    },
  });
  const noIndex = useWatch({ control: form.control, name: "noIndex" }) ?? false;

  const onSubmit = async (data: PortalSeoConfig) => {
    setSaving(true);
    setMessage(null);

    const result = await updatePortalSettings(organizationId, "seo", data);

    if (result.success) {
      setMessage({ type: "success", text: "SEO 设置已保存" });
    } else {
      setMessage({ type: "error", text: result.error || "保存失败" });
    }

    setSaving(false);
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Meta Title */}
      <div className="space-y-2">
        <Label htmlFor="metaTitle">页面标题 (Title Tag)</Label>
        <Input
          id="metaTitle"
          placeholder="产品反馈 | 您的公司名"
          {...form.register("metaTitle")}
        />
        <p className="text-sm text-muted-foreground">显示在浏览器标签页和搜索结果中</p>
      </div>

      {/* Meta Description */}
      <div className="space-y-2">
        <Label htmlFor="metaDescription">页面描述 (Meta Description)</Label>
        <Textarea
          id="metaDescription"
          placeholder="提交产品反馈、查看路线图和变更日志。"
          rows={3}
          {...form.register("metaDescription")}
        />
        <p className="text-sm text-muted-foreground">
          搜索引擎展示的页面描述，建议 150-160 字符
        </p>
      </div>

      {/* OG Image */}
      <div className="space-y-2">
        <Label htmlFor="ogImage">社交分享图片 (OG Image)</Label>
        <Input
          id="ogImage"
          type="url"
          placeholder="https://example.com/og-image.png"
          {...form.register("ogImage")}
        />
        <p className="text-sm text-muted-foreground">
          分享到社交媒体时显示的图片，建议尺寸 1200x630
        </p>
      </div>

      {/* Favicon */}
      <div className="space-y-2">
        <Label htmlFor="favicon">网站图标 (Favicon)</Label>
        <Input
          id="favicon"
          type="url"
          placeholder="https://example.com/favicon.ico"
          {...form.register("favicon")}
        />
        <p className="text-sm text-muted-foreground">显示在浏览器标签页的小图标</p>
      </div>

      {/* No Index */}
      {showNoIndex && (
        <div className="flex items-center justify-between rounded-lg border p-4">
          <div className="space-y-0.5">
            <Label htmlFor="noIndex">阻止搜索引擎索引</Label>
            <p className="text-sm text-muted-foreground">
              启用后搜索引擎将不会收录此页面
            </p>
          </div>
          <Switch
            id="noIndex"
            checked={noIndex}
            onCheckedChange={(checked) => form.setValue("noIndex", checked)}
          />
        </div>
      )}

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
