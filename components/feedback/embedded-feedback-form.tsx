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

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseFeedbackPrefill } from "@/lib/feedback/prefill";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm, useWatch } from "react-hook-form";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
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
import { baseFeedbackSchema, type BaseFeedbackInput } from "@/lib/validators/feedback";
import { FileUpload } from "./file-upload";
import { DuplicateSuggestionsInline } from "./duplicate-suggestions-inline";

export const FEEDBACK_TRIGGER_LABEL = "反馈";
export const FEEDBACK_DIALOG_TITLE = "提交反馈";
export const FEEDBACK_TITLE_LABEL = "标题";
export const FEEDBACK_DESCRIPTION_LABEL = "描述";
export const FEEDBACK_TYPE_LABEL = "反馈类型";
export const FEEDBACK_PRIORITY_LABEL = "优先级";
export const FEEDBACK_SUBMIT_LABEL = "提交";
export const FEEDBACK_CANCEL_LABEL = "取消";
export const FEEDBACK_SUCCESS_MESSAGE = "反馈提交成功";
export const FEEDBACK_TRACKING_LABEL = "跟踪链接";
export const FEEDBACK_COPY_LABEL = "复制链接";
export const FEEDBACK_TOAST_DURATION_MS = 6000;

export const FEEDBACK_TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "功能请求" },
  { value: "issue", label: "问题" },
  { value: "other", label: "其他" },
] as const;

export const FEEDBACK_PRIORITY_OPTIONS = [
  { value: "low", label: "低" },
  { value: "medium", label: "中" },
  { value: "high", label: "高" },
] as const;

export const FEEDBACK_PREFILL_KEYS = [
  "title",
  "description",
  "type",
  "priority",
] as const;

type EmbeddedFeedbackFormProps = {
  organizationId?: string;
};

export function EmbeddedFeedbackForm({ organizationId }: EmbeddedFeedbackFormProps) {
  const t = useTranslations("feedback");
  const [open, setOpen] = useState(false);
  const [feedbackId, setFeedbackId] = useState<number | null>(null);
  const [selectedFileCount, setSelectedFileCount] = useState(0);
  const [trackingToast, setTrackingToast] = useState<{ url: string } | null>(null);
  const [toastCopied, setToastCopied] = useState(false);
  const toastTimeoutRef = useRef<number | null>(null);
  const formId = useId();
  const searchParams = useSearchParams();

  const prefill = useMemo(
    () => (searchParams ? parseFeedbackPrefill(searchParams) : {}),
    [searchParams]
  );

  const form = useForm<BaseFeedbackInput>({
    resolver: zodResolver(baseFeedbackSchema),
    defaultValues: {
      title: prefill.title ?? "",
      description: prefill.description ?? "",
      type: prefill.type ?? "issue",
      priority: prefill.priority ?? "medium",
    },
    mode: "onBlur",
  });

  // Dynamic options based on translations
  const feedbackTypeOptions = [
    { value: "bug", label: t("type.bug") },
    { value: "feature", label: t("type.feature") },
    { value: "issue", label: t("type.issue") },
    { value: "other", label: t("type.other") },
  ] as const;

  const feedbackPriorityOptions = [
    { value: "low", label: t("priority.low") },
    { value: "medium", label: t("priority.medium") },
    { value: "high", label: t("priority.high") },
  ] as const;

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
    }),
    [formId]
  );

  const handleClose = () => {
    setOpen(false);
    form.reset();
    setFeedbackId(null);
    setSelectedFileCount(0);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (!nextOpen) {
      form.reset();
      setFeedbackId(null);
      setSelectedFileCount(0);
    }
  };

  const handleCopyTrackingUrl = async () => {
    if (!trackingToast?.url) {
      return;
    }
    try {
      await navigator.clipboard.writeText(trackingToast.url);
      setToastCopied(true);
      setTimeout(() => setToastCopied(false), 2000);
    } catch {
      setToastCopied(false);
    }
  };

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const onSubmit = async (data: BaseFeedbackInput) => {
    if (!organizationId) {
      console.error("Organization id is required to submit feedback.");
      return;
    }

    const response = await fetch("/api/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-organization-id": organizationId,
      },
      body: JSON.stringify({
        ...data,
      }),
    });

    if (!response.ok) {
      return;
    }

    const result = await response.json();
    setFeedbackId(result.data.feedbackId);
    if (result.data.trackingUrl) {
      setTrackingToast({ url: result.data.trackingUrl });
      setToastCopied(false);
      if (toastTimeoutRef.current !== null) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setTrackingToast(null);
        setToastCopied(false);
      }, FEEDBACK_TOAST_DURATION_MS);
    }

    if (selectedFileCount === 0) {
      handleClose();
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    control,
  } = form;

  const titleValue = useWatch({ control, name: "title" }) ?? "";

  return (
    <>
      <AlertDialog open={open} onOpenChange={handleOpenChange}>
        <AlertDialogTrigger asChild>
          <Button type="button">{t("trigger")}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent className="sm:max-w-[560px]">
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialogDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <form
            onSubmit={(e) => handleSubmit(onSubmit)(e)}
            className="flex flex-col gap-5"
          >
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor={fieldIds.title}>{t("form.title")}</FieldLabel>
                <FieldContent>
                  <Input
                    id={fieldIds.title}
                    placeholder={t("form.titlePlaceholder")}
                    aria-invalid={!!errors.title}
                    aria-describedby={errors.title ? fieldIds.titleError : undefined}
                    disabled={isSubmitting}
                    {...register("title")}
                  />
                  <FieldError
                    id={fieldIds.titleError}
                    errors={[errors.title]}
                  />
                    <DuplicateSuggestionsInline
                      query={titleValue}
                      organizationId={organizationId}
                    />
                </FieldContent>
              </Field>
              <Field>
                <FieldLabel htmlFor={fieldIds.description}>
                  {t("form.description")}
                </FieldLabel>
                <FieldContent>
                  <Textarea
                    id={fieldIds.description}
                    placeholder={t("form.descriptionPlaceholder")}
                    rows={5}
                    aria-invalid={!!errors.description}
                    aria-describedby={
                      errors.description ? fieldIds.descriptionError : undefined
                    }
                    disabled={isSubmitting}
                    {...register("description")}
                  />
                  <FieldError
                    id={fieldIds.descriptionError}
                    errors={[errors.description]}
                  />
                </FieldContent>
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel htmlFor={fieldIds.type}>{t("form.type")}</FieldLabel>
                  <FieldContent>
                    <Controller
                      name="type"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id={fieldIds.type}
                            aria-invalid={!!errors.type}
                            aria-describedby={
                              errors.type ? fieldIds.typeError : undefined
                            }
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            <SelectValue placeholder={t("form.selectType")} />
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
                  <FieldLabel htmlFor={fieldIds.priority}>
                    {t("form.priority")}
                  </FieldLabel>
                  <FieldContent>
                    <Controller
                      name="priority"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id={fieldIds.priority}
                            aria-invalid={!!errors.priority}
                            aria-describedby={
                              errors.priority ? fieldIds.priorityError : undefined
                            }
                            disabled={isSubmitting}
                            className="w-full"
                          >
                            <SelectValue placeholder={t("form.selectPriority")} />
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
                    <FieldError
                      id={fieldIds.priorityError}
                      errors={[errors.priority]}
                    />
                  </FieldContent>
                </Field>
              </div>
            </FieldGroup>
            <FileUpload
              feedbackId={feedbackId ?? undefined}
              onFilesSelected={setSelectedFileCount}
              onUploaded={() => handleClose()}
            />
            <AlertDialogFooter className="mt-1">
              <AlertDialogCancel onClick={handleClose} disabled={isSubmitting}>
                {t("form.cancel")}
              </AlertDialogCancel>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? t("form.submitting") : t("form.submit")}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
      {trackingToast && (
        <div
          className="fixed bottom-4 right-4 z-50 w-[min(90vw,360px)] rounded-xl border bg-background p-4 shadow-lg"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{t("success")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("tracking")}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setTrackingToast(null)}
            >
              {t("close")}
            </Button>
          </div>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              readOnly
              value={trackingToast.url}
              className="flex-1 rounded-md border bg-muted/30 px-3 py-2 text-xs"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={handleCopyTrackingUrl}
              className="sm:w-28"
            >
              {toastCopied ? t("copied") : t("copy")}
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
