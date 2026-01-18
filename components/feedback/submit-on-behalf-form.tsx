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

import { useId, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { AlertCircle, CheckCircle2 } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  customerInfoSchema,
  feedbackTypeEnum,
  priorityEnum,
} from "@/lib/validators/feedback";

const submitOnBehalfSchema = z.object({
  title: z.string().min(1, "titleRequired").max(200, "titleMax200"),
  description: z.string().min(1, "descriptionRequired").max(5000, "descriptionMax5000"),
  type: feedbackTypeEnum,
  priority: priorityEnum,
  submittedOnBehalf: z.literal(true),
  customerInfo: customerInfoSchema,
});

type SubmitOnBehalfFormData = z.infer<typeof submitOnBehalfSchema>;

type SubmitOnBehalfFormProps = {
  organizationId: string;
  userRole: string;
  userId: string;
};

export function SubmitOnBehalfForm({
  organizationId,
  userRole,
  userId,
}: SubmitOnBehalfFormProps) {
  const t = useTranslations("feedback.submitOnBehalf");
  const tf = useTranslations("feedback");

  const feedbackTypeOptions = useMemo(
    () => [
      { value: "bug", label: tf("type.bug") },
      { value: "feature", label: tf("type.feature") },
      { value: "issue", label: tf("type.issue") },
      { value: "other", label: tf("type.other") },
    ] as const,
    [tf]
  );

  const feedbackPriorityOptions = useMemo(
    () => [
      { value: "low", label: tf("priority.low") },
      { value: "medium", label: tf("priority.medium") },
      { value: "high", label: tf("priority.high") },
    ] as const,
    [tf]
  );

  const [submitResult, setSubmitResult] = useState<{
    success: boolean;
    message: string;
    trackingUrl?: string;
  } | null>(null);
  const formId = useId();

  const form = useForm<SubmitOnBehalfFormData>({
    resolver: zodResolver(submitOnBehalfSchema),
    defaultValues: {
      submittedOnBehalf: true,
      title: "",
      description: "",
      type: "issue",
      priority: "medium",
      customerInfo: {
        name: "",
        email: "",
        phone: "",
      },
    },
    mode: "onBlur",
  });

  const fieldIds = useMemo(
    () => ({
      title: `${formId}-title`,
      titleError: `${formId}-title-error`,
      description: `${formId}-description`,
      descriptionError: `${formId}-description-error`,
      type: `${formId}-type`,
      typeError: `${formId}-type-error`,
      priority: `${formId}-priority`,
      priorityError: `${formId}-priority-error`,
      customerName: `${formId}-customer-name`,
      customerNameError: `${formId}-customer-name-error`,
      customerEmail: `${formId}-customer-email`,
      customerEmailError: `${formId}-customer-email-error`,
      customerPhone: `${formId}-customer-phone`,
    }),
    [formId],
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
    reset,
  } = form;

  const onSubmit = async (data: SubmitOnBehalfFormData) => {
    setSubmitResult(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
          "x-user-id": userId,
          "x-user-role": userRole,
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitResult({
          success: true,
          message: t("submitSuccess"),
          trackingUrl: result.data.trackingUrl,
        });
        reset();
      } else {
        setSubmitResult({
          success: false,
          message: result.error || t("submitFailed"),
        });
      }
    } catch {
      setSubmitResult({
        success: false,
        message: t("networkError"),
      });
    }
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t.rich("roleNotice", {
            role: userRole,
            strong: (chunks) => <strong>{chunks}</strong>,
          })}
        </AlertDescription>
      </Alert>

      {submitResult && (
        <Alert variant={submitResult.success ? "default" : "destructive"}>
          {submitResult.success ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>
            {submitResult.message}
            {submitResult.trackingUrl && (
              <div className="mt-2">
                <a
                  href={submitResult.trackingUrl}
                  data-testid="tracking-link"
                  className="underline hover:no-underline"
                >
                  {t("viewDetail")}
                </a>
              </div>
            )}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{t("cardTitle")}</CardTitle>
          <CardDescription>
            {t("cardDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <FieldGroup>
              <h3 className="text-lg font-semibold">{t("sections.feedback")}</h3>

              <Field>
                <FieldLabel htmlFor={fieldIds.title}>{t("labels.title")}</FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldIds.title}
                    data-testid="feedback-title"
                    placeholder={t("placeholders.title")}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? fieldIds.titleError : undefined}
                    disabled={isSubmitting}
                    {...register("title")}
                  />
                  <FieldError id={fieldIds.titleError} errors={[errors.title]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor={fieldIds.description}>{t("labels.description")}</FieldLabel>
                <FieldContent>
                  <Textarea
                    id={fieldIds.description}
                    data-testid="feedback-description"
                    placeholder={t("placeholders.description")}
                    rows={5}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? fieldIds.descriptionError : undefined}
                    disabled={isSubmitting}
                    {...register("description")}
                  />
                  <FieldError id={fieldIds.descriptionError} errors={[errors.description]} />
                </FieldContent>
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={fieldIds.type}>{t("labels.type")}</FieldLabel>
                  <FieldContent>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id={fieldIds.type}
                            data-testid="feedback-type"
                            aria-invalid={!!errors.type}
                            aria-describedby={errors.type ? fieldIds.typeError : undefined}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            <SelectValue placeholder={t("placeholders.type")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {feedbackTypeOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError id={fieldIds.typeError} errors={[errors.type]} />
                  </FieldContent>
                </Field>

                <Field>
                  <FieldLabel htmlFor={fieldIds.priority}>{t("labels.priority")}</FieldLabel>
                  <FieldContent>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger
                            id={fieldIds.priority}
                            data-testid="feedback-priority"
                            aria-invalid={!!errors.priority}
                            aria-describedby={errors.priority ? fieldIds.priorityError : undefined}
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            <SelectValue placeholder={t("placeholders.priority")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {feedbackPriorityOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      )}
                    />
                    <FieldError id={fieldIds.priorityError} errors={[errors.priority]} />
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>

            <FieldGroup className="pt-4 border-t">
              <h3 className="text-lg font-semibold">{t("sections.customer")}</h3>

              <Field>
                <FieldLabel htmlFor={fieldIds.customerName}>{t("labels.customerName")}</FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldIds.customerName}
                    data-testid="customer-name"
                    placeholder={t("placeholders.customerName")}
                    aria-invalid={!!errors.customerInfo?.name}
                    aria-describedby={errors.customerInfo?.name ? fieldIds.customerNameError : undefined}
                    disabled={isSubmitting}
                    {...register("customerInfo.name")}
                  />
                  <FieldError id={fieldIds.customerNameError} errors={[errors.customerInfo?.name]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor={fieldIds.customerEmail}>{t("labels.customerEmail")}</FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldIds.customerEmail}
                    data-testid="customer-email"
                    type="email"
                    placeholder={t("placeholders.customerEmail")}
                    aria-invalid={!!errors.customerInfo?.email}
                    aria-describedby={errors.customerInfo?.email ? fieldIds.customerEmailError : undefined}
                    disabled={isSubmitting}
                    {...register("customerInfo.email")}
                  />
                  <FieldError id={fieldIds.customerEmailError} errors={[errors.customerInfo?.email]} />
                </FieldContent>
              </Field>

              <Field>
                <FieldLabel htmlFor={fieldIds.customerPhone}>{t("labels.customerPhone")}</FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldIds.customerPhone}
                    data-testid="customer-phone"
                    type="tel"
                    placeholder={t("placeholders.customerPhone")}
                    disabled={isSubmitting}
                    {...register("customerInfo.phone")}
                  />
                </FieldContent>
              </Field>
            </FieldGroup>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full"
              data-testid="submit-feedback"
            >
              {isSubmitting ? t("submitting") : t("submit")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
