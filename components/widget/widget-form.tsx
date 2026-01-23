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

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Send, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

interface WidgetConfig {
  theme: "light" | "dark" | "auto";
  primaryColor: string;
  buttonText: string;
  position: string;
  fields: {
    showType?: boolean;
    showPriority?: boolean;
    showDescription?: boolean;
    requireEmail?: boolean;
  };
  types: string[];
  customCSS?: string;
}

interface WidgetFormProps {
  organization: {
    id: string;
    name: string;
  };
  config: WidgetConfig;
}

function createFormSchema(config: WidgetConfig) {
  let schema = z.object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().max(2000).optional(),
    type: z.string().optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    email: z.string().email("Invalid email").optional().or(z.literal("")),
  });

  if (config.fields.requireEmail) {
    schema = schema.refine((data) => data.email && data.email.length > 0, {
      message: "Email is required",
      path: ["email"],
    }) as unknown as typeof schema;
  }

  return schema;
}

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

export default function WidgetForm({ organization, config }: WidgetFormProps) {
  const t = useTranslations("widget");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    if (config.theme === "auto") {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setResolvedTheme(prefersDark ? "dark" : "light");

      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = (e: MediaQueryListEvent) => {
        setResolvedTheme(e.matches ? "dark" : "light");
      };
      mediaQuery.addEventListener("change", handler);
      return () => mediaQuery.removeEventListener("change", handler);
    } else {
      setResolvedTheme(config.theme);
    }
  }, [config.theme]);

  const formSchema = createFormSchema(config);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      type: config.types[0] || "bug",
      priority: "medium",
      email: "",
    },
  });

  function handleClose() {
    if (typeof window !== "undefined") {
      window.parent.postMessage({ type: "echo.widget.close" }, "*");
    }
  }

  async function handleSubmit(values: FormValues) {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Widget-Mode": "true",
          "X-Organization-Id": organization.id,
        },
        body: JSON.stringify({
          title: values.title,
          description: values.description || null,
          type: config.fields.showType ? values.type : "issue",
          priority: config.fields.showPriority ? values.priority : "medium",
          customerEmail: values.email || undefined,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Failed to submit feedback");
      }

      setSuccess(true);
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.parent.postMessage({ type: "echo.widget.submitted" }, "*");
        }
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  }

  const isDark = resolvedTheme === "dark";
  const primaryColor = config.primaryColor;

  return (
    <div
      className={cn(
        "min-h-screen",
        isDark ? "bg-zinc-900 text-zinc-100" : "bg-white text-zinc-900",
      )}
    >
      {config.customCSS && <style>{config.customCSS}</style>}

      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ backgroundColor: primaryColor }}
      >
        <h2 className="text-lg font-semibold text-white">{config.buttonText}</h2>
        <button
          onClick={handleClose}
          className="text-white/80 hover:text-white transition-colors p-1"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold mb-2">{t("thankYou")}</h3>
            <p className={isDark ? "text-zinc-400" : "text-zinc-500"}>
              {t("successMessage")}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-1">{organization.name}</h3>
              <p className={isDark ? "text-zinc-400" : "text-zinc-500"}>
                {t("welcomeMessage")}
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 text-red-500 rounded-lg text-sm">
                {error}
              </div>
            )}

            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-4"
            >
              {/* Title */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  {t("title")} <span className="text-red-500">*</span>
                </label>
                <input
                  {...form.register("title")}
                  placeholder={t("titlePlaceholder")}
                  className={cn(
                    "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                    isDark
                      ? "bg-zinc-800 border-zinc-700 focus:ring-offset-zinc-900"
                      : "bg-white border-zinc-200",
                  )}
                  style={
                    { "--tw-ring-color": primaryColor } as React.CSSProperties
                  }
                  disabled={isSubmitting}
                />
                {form.formState.errors.title && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.title.message}
                  </p>
                )}
              </div>

              {/* Description */}
              {config.fields.showDescription && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("description")}</label>
                  <textarea
                    {...form.register("description")}
                    placeholder="Please provide more details..."
                    rows={4}
                    className={cn(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 resize-none",
                      isDark
                        ? "bg-zinc-800 border-zinc-700 focus:ring-offset-zinc-900"
                        : "bg-white border-zinc-200",
                    )}
                    style={
                      { "--tw-ring-color": primaryColor } as React.CSSProperties
                    }
                    disabled={isSubmitting}
                  />
                </div>
              )}

              {/* Type */}
              {config.fields.showType && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <div className="flex flex-wrap gap-2">
                    {config.types.map((type) => {
                      const isSelected = form.watch("type") === type;
                      return (
                        <label
                          key={type}
                          className={cn(
                            "px-3 py-1.5 border rounded-md cursor-pointer transition-colors",
                            isSelected
                              ? ""
                              : isDark
                                ? "border-zinc-700 hover:border-zinc-500"
                                : "border-zinc-200 hover:border-zinc-400",
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}20`,
                                  color: primaryColor,
                                }
                              : undefined
                          }
                        >
                          <input
                            {...form.register("type")}
                            type="radio"
                            value={type}
                            className="sr-only"
                            disabled={isSubmitting}
                          />
                          <span className="capitalize">{type}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Priority */}
              {config.fields.showPriority && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">{t("priority")}</label>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as const).map((priority) => {
                      const isSelected = form.watch("priority") === priority;
                      return (
                        <label
                          key={priority}
                          className={cn(
                            "px-3 py-1.5 border rounded-md cursor-pointer transition-colors capitalize",
                            isSelected
                              ? ""
                              : isDark
                                ? "border-zinc-700 hover:border-zinc-500"
                                : "border-zinc-200 hover:border-zinc-400",
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: primaryColor,
                                  backgroundColor: `${primaryColor}20`,
                                  color: primaryColor,
                                }
                              : undefined
                          }
                        >
                          <input
                            {...form.register("priority")}
                            type="radio"
                            value={priority}
                            className="sr-only"
                            disabled={isSubmitting}
                          />
                          {priority}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Email */}
              {config.fields.requireEmail && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...form.register("email")}
                    type="email"
                    placeholder="your@email.com"
                    className={cn(
                      "w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2",
                      isDark
                        ? "bg-zinc-800 border-zinc-700 focus:ring-offset-zinc-900"
                        : "bg-white border-zinc-200",
                    )}
                    style={
                      { "--tw-ring-color": primaryColor } as React.CSSProperties
                    }
                    disabled={isSubmitting}
                  />
                  {form.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-2.5 rounded-md font-medium text-white transition-colors flex items-center justify-center gap-2"
                style={{
                  backgroundColor: isSubmitting
                    ? `${primaryColor}80`
                    : primaryColor,
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Feedback
                  </>
                )}
              </button>
            </form>

            {/* Footer */}
            <p
              className={cn(
                "text-xs text-center mt-4",
                isDark ? "text-zinc-500" : "text-zinc-400",
              )}
            >
              Powered by{" "}
              <a
                href="https://echo.dev"
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "underline",
                  isDark ? "hover:text-zinc-300" : "hover:text-zinc-600",
                )}
              >
                Echo
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
