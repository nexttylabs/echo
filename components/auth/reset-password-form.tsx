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

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth";

function ResetPasswordFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<ResetPasswordInput>({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [isSuccess, setIsSuccess] = useState(false);
  const [isInvalidToken, setIsInvalidToken] = useState(false);

  const t = useTranslations("auth.resetPassword");

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setIsInvalidToken(true);
      setFormError("缺少重置令牌，请重新申请");
    } else {
      setFormData((prev) => ({ ...prev, token }));
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setFormError(null);
  };

  const validateForm = () => {
    const result = resetPasswordSchema.safeParse(formData);
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

    if (!formData.token) {
      setFormError("缺少重置令牌");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: formData.token,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === "INVALID_TOKEN") {
          setIsInvalidToken(true);
        }
        throw new Error(data.error || "重置失败");
      }

      setIsSuccess(true);
    } catch {
      setFormError(isInvalidToken ? "重置令牌无效或已过期" : "重置失败，请稍后重试");
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
              {t("passwordReset")}
            </div>
            <Button className="w-full" asChild>
              <Link href="/login">{t("goToLogin")}</Link>
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
            <Label htmlFor="password">{t("newPasswordLabel")}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading || isInvalidToken}
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password ? (
              <p className="text-sm text-destructive">{errors.password}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("confirmPasswordLabel")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading || isInvalidToken}
              className={errors.confirmPassword ? "border-destructive" : ""}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-destructive">{errors.confirmPassword}</p>
            ) : null}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || isInvalidToken}>
            {isLoading ? t("submitting") : t("submitButton")}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            <Link className="text-primary hover:underline" href="/forgot-password">
              {t("requestNewLink")}
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}

export function ResetPasswordForm() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordFormContent />
    </Suspense>
  );
}
