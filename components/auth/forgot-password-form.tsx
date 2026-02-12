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
import Link from "next/link";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ForgotPasswordInput>({
    email: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);

  const t = useTranslations("auth.forgotPassword");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const validateForm = () => {
    const result = forgotPasswordSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      return true;
    }
    const nextErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path?.[0];
      if (typeof key === "string") {
        nextErrors[key] = issue.message;
      }
    }
    setErrors(nextErrors);
    return false;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || t("sendFailed"));
      }

      setIsSuccess(true);
    } catch {
      setFormError(t("sendFailed"));
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("successTitle")}</CardTitle>
          <CardDescription>{t("successDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm text-green-700 dark:text-green-400">
              {t("emailSent")}
            </div>
            <Button
              variant="outline"
              className="w-full"
              asChild
            >
              <Link href="/login">{t("backToLogin")}</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cardTitle")}</CardTitle>
        <CardDescription>{t("cardDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {formError}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="email">{t("emailLabel")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              disabled={isLoading}
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email ? (
              <p className="text-sm text-destructive">{errors.email}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("submitting") : t("submitButton")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link className="text-primary hover:underline" href="/login">
              {t("backToLogin")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
