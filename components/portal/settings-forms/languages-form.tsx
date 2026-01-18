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

import { useState } from "react";
import { useForm, useFieldArray, useWatch } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, X } from "lucide-react";
import { updatePortalSettings } from "@/lib/services/portal-settings";

interface LanguagesFormProps {
  organizationId: string;
  initialLanguages?: string[];
  initialDefaultLanguage?: string;
}

const availableLanguages = [
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
] as const;

type FormData = {
  languages: { code: string }[];
  defaultLanguage: string;
};

export function LanguagesForm({
  organizationId,
  initialLanguages,
  initialDefaultLanguage,
}: LanguagesFormProps) {
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const form = useForm<FormData>({
    defaultValues: {
      languages: (initialLanguages ?? ["zh-CN"]).map((code) => ({ code })),
      defaultLanguage: initialDefaultLanguage ?? "zh-CN",
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "languages",
  });

  const watchLanguages = useWatch({ control: form.control, name: "languages" }) ?? [];
  const defaultLanguage = useWatch({ control: form.control, name: "defaultLanguage" }) ?? "zh-CN";
  const selectedCodes = watchLanguages.map((l) => l.code);

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    setMessage(null);

    const languageCodes = data.languages.map((l) => l.code);
    
    // Update languages array
    const result = await updatePortalSettings(organizationId, "languages", languageCodes);

    if (result.success) {
      // Also update defaultLanguage
      await updatePortalSettings(organizationId, "defaultLanguage" as never, data.defaultLanguage as never);
      setMessage({ type: "success", text: "语言设置已保存" });
    } else {
      setMessage({ type: "error", text: result.error || "保存失败" });
    }

    setSaving(false);
  };

  const getLanguageLabel = (code: string) => {
    return availableLanguages.find((l) => l.code === code)?.label ?? code;
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Default Language */}
      <div className="space-y-2">
        <Label htmlFor="defaultLanguage">默认语言</Label>
        <Select
          value={defaultLanguage}
          onValueChange={(value) => form.setValue("defaultLanguage", value)}
        >
          <SelectTrigger id="defaultLanguage">
            <SelectValue placeholder="选择默认语言" />
          </SelectTrigger>
          <SelectContent>
            {watchLanguages.map((lang) => (
              <SelectItem key={lang.code} value={lang.code}>
                {getLanguageLabel(lang.code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-sm text-muted-foreground">Portal 加载时使用的语言</p>
      </div>

      {/* Supported Languages */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>支持的语言</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              const available = availableLanguages.find(
                (l) => !selectedCodes.includes(l.code)
              );
              if (available) {
                append({ code: available.code });
              }
            }}
            disabled={selectedCodes.length >= availableLanguages.length}
          >
            <Plus className="mr-1 h-4 w-4" />
            添加语言
          </Button>
        </div>

        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <Select
                value={field.code}
                onValueChange={(value) => {
                  form.setValue(`languages.${index}.code`, value);
                }}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableLanguages
                    .filter(
                      (l) => l.code === field.code || !selectedCodes.includes(l.code)
                    )
                    .map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    // If removing default language, update default
                    if (defaultLanguage === field.code) {
                      const remaining = watchLanguages.filter((_, i) => i !== index);
                      if (remaining.length > 0) {
                        form.setValue("defaultLanguage", remaining[0].code);
                      }
                    }
                    remove(index);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          用户可以在 Portal 中切换的语言选项
        </p>
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
