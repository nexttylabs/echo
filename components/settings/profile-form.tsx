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
import { useForm } from "react-hook-form";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";
import { Loader2 } from "lucide-react";

interface ProfileFormValues {
  name: string;
}

export function ProfileForm() {
  const { data: session, refetch } = authClient.useSession();
  const user = session?.user;
  const t = useTranslations("settings.profile");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || "",
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsSubmitting(true);
    setMessage(null);

    try {
      await authClient.updateUser({
        name: data.name,
      });
      await refetch();
      setMessage({ type: "success", text: t("updateSuccess") });
    } catch {
      setMessage({ type: "error", text: t("updateFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cardTitle")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="name">{t("nameLabel")}</Label>
            <Input
              id="name"
              {...register("name", {
                required: t("nameRequired"),
                maxLength: {
                  value: 100,
                  message: t("nameTooLong"),
                },
              })}
              placeholder={t("namePlaceholder")}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input id="email" value={user?.email || ""} disabled />
            <p className="text-xs text-muted-foreground">{t("emailNote")}</p>
          </div>

          {message && (
            <div
              className={`rounded-md p-3 text-sm ${
                message.type === "success"
                  ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message.text}
            </div>
          )}

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting || !isDirty}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSubmitting ? t("updating") : t("saveChanges")}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

