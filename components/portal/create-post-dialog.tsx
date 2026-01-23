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

import { useEffect, useId, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  baseFeedbackSchema,
  type BaseFeedbackInput,
} from "@/lib/validators/feedback";

const FEEDBACK_TYPE_OPTIONS = [
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature Request" },
  { value: "issue", label: "Issue" },
  { value: "other", label: "Other" },
] as const;

interface CreatePostDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  initialValues?: Partial<BaseFeedbackInput>;
}

export function buildDefaultFeedbackValues(
  initialValues?: Partial<BaseFeedbackInput>,
): BaseFeedbackInput {
  return {
    title: initialValues?.title ?? "",
    description: initialValues?.description ?? "",
    type: initialValues?.type ?? "feature",
    priority: initialValues?.priority ?? "medium",
  };
}

export function CreatePostDialog({
  open,
  onOpenChange,
  organizationId,
  initialValues,
}: CreatePostDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const formId = useId();

  const defaultValues = useMemo(
    () => buildDefaultFeedbackValues(initialValues),
    [initialValues],
  );

  const form = useForm<BaseFeedbackInput>({
    resolver: zodResolver(baseFeedbackSchema),
    defaultValues,
    mode: "onBlur",
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = form;

  useEffect(() => {
    if (open) {
      reset(defaultValues);
    }
  }, [open, reset, defaultValues]);

  const onSubmit = async (data: BaseFeedbackInput) => {
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-organization-id": organizationId,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to create post");
      }

      reset();
      onOpenChange(false);
      // Optionally refresh the page or update the list
      window.location.reload();
    } catch (error) {
      console.error("Error creating post:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset(defaultValues);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Create A New Post</DialogTitle>
          <DialogDescription>
            Share your feedback, ideas, or report issues.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor={`${formId}-title`}>Title</FieldLabel>
              <FieldContent>
                <Input
                  id={`${formId}-title`}
                  placeholder="Short, descriptive title"
                  aria-invalid={!!errors.title}
                  disabled={isSubmitting}
                  {...register("title")}
                />
                <FieldError errors={[errors.title]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${formId}-description`}>
                Description
              </FieldLabel>
              <FieldContent>
                <Textarea
                  id={`${formId}-description`}
                  placeholder="Provide more details about your feedback..."
                  rows={5}
                  aria-invalid={!!errors.description}
                  disabled={isSubmitting}
                  {...register("description")}
                />
                <FieldError errors={[errors.description]} />
              </FieldContent>
            </Field>

            <Field>
              <FieldLabel htmlFor={`${formId}-type`}>Category</FieldLabel>
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
                        id={`${formId}-type`}
                        aria-invalid={!!errors.type}
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {FEEDBACK_TYPE_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError errors={[errors.type]} />
              </FieldContent>
            </Field>
          </FieldGroup>

          <DialogFooter className="mt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Post"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
