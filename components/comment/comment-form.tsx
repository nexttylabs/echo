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

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => void | Promise<void>;
  label: string;
  placeholder?: string;
  buttonText?: string;
  submittingText?: string;
  maxLength?: number;
  className?: string;
  textareaId?: string;
  textareaName?: string;
  autoComplete?: string;
}

export function CommentForm({
  onSubmit,
  label,
  placeholder = "",
  buttonText = "",
  submittingText = "",
  maxLength = 5000,
  className,
  textareaId,
  textareaName = "comment",
  autoComplete = "off",
}: CommentFormProps) {
  const generatedId = useId();
  const resolvedId = textareaId ?? generatedId;
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="space-y-3">
        <label htmlFor={resolvedId} className="sr-only">
          {label}
        </label>
        <Textarea
          id={resolvedId}
          name={textareaName}
          autoComplete={autoComplete}
          aria-label={label}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          maxLength={maxLength}
          rows={3}
          className="resize-none"
          disabled={isSubmitting}
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground tabular-nums">
            {content.length} / {maxLength}
          </span>
          <Button
            type="submit"
            disabled={!content.trim() || isSubmitting}
            size="sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
                {submittingText || buttonText}
              </>
            ) : (
              buttonText
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}
