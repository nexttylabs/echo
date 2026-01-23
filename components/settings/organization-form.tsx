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
import { useRouter } from "next/navigation";
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
import { Textarea } from "@/components/ui/textarea";

export const organizationRedirectPath = "/dashboard";

interface OrganizationFormProps {
  organizationId?: string;
  initialName?: string;
  initialSlug?: string;
  initialDescription?: string;
}

export function OrganizationForm({ 
  organizationId, 
  initialName = "", 
  initialDescription = ""
}: OrganizationFormProps) {
  const t = useTranslations("settings.organizationForm");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState({ 
    name: initialName, 
    description: initialDescription 
  });

  const isEditing = !!organizationId;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const url = isEditing 
      ? `/api/organizations/${organizationId}` 
      : "/api/organizations";
    
    const method = isEditing ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json?.error ?? (isEditing ? t("updateFailed") : t("createFailed")));
        setIsLoading(false);
        return;
      }

      if (isEditing) {
        setSuccess(t("updatedSuccess"));
        setIsLoading(false);
        router.refresh();
      } else {
        router.push(organizationRedirectPath);
      }
    } catch {
      setError(t("genericError"));
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? t("titleEdit") : t("titleCreate")}</CardTitle>
        <CardDescription>
          {isEditing ? t("descEdit") : t("descCreate")}
        </CardDescription>
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
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              disabled={isLoading}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">{t("descriptionLabel")}</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              disabled={isLoading}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || !formData.name}
          >
            {isLoading
              ? (isEditing ? t("savingEdit") : t("savingCreate"))
              : (isEditing ? t("submitEdit") : t("submitCreate"))}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
