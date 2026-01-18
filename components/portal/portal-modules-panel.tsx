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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { updatePortalSettings } from "@/lib/services/portal-settings";
import type { PortalConfig } from "@/lib/db/schema";

interface PortalModulesPanelProps {
  organizationId: string;
  initialModules: NonNullable<PortalConfig["modules"]>;
}

export function PortalModulesPanel({ organizationId, initialModules }: PortalModulesPanelProps) {
  const t = useTranslations("settings.portal.modules");
  const [modules, setModules] = useState(initialModules);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const updateModule = (key: keyof typeof modules, value: boolean) => {
    setModules((prev) => ({ ...prev, [key]: value }));
  };

  const onSave = async () => {
    setSaving(true);
    setMessage(null);

    const result = await updatePortalSettings(organizationId, "modules", modules);

    if (result.success) {
      setMessage(t("saved"));
    } else {
      setMessage(result.error || t("saveFailed"));
    }

    setSaving(false);
  };

  return (
    <div className="space-y-4 rounded-xl border bg-white/80 p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">{t("panelTitle")}</h3>
        <p className="mt-1 text-sm text-slate-600">
          {t("panelDescription")}
        </p>
      </div>

      <div className="space-y-3">
        <ModuleRow
          label={t("rows.feedback.label")}
          description={t("rows.feedback.description")}
          checked={modules.feedback ?? true}
          onChange={(value) => updateModule("feedback", value)}
        />
        <ModuleRow
          label={t("rows.roadmap.label")}
          description={t("rows.roadmap.description")}
          checked={modules.roadmap ?? true}
          onChange={(value) => updateModule("roadmap", value)}
        />
        <ModuleRow
          label={t("rows.changelog.label")}
          description={t("rows.changelog.description")}
          checked={modules.changelog ?? true}
          onChange={(value) => updateModule("changelog", value)}
        />
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={onSave} disabled={saving}>
          {saving ? t("saving") : t("saveButton")}
        </Button>
        {message && <span className="text-sm text-slate-600">{message}</span>}
      </div>
    </div>
  );
}

function ModuleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div>
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
