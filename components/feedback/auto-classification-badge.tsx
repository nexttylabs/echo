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

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bot } from "lucide-react";
import { useTranslations } from "next-intl";

interface AutoClassificationBadgeProps {
  classification?: {
    type: string;
    priority: string;
    confidence: number;
    reasons: string[];
  };
}

export function AutoClassificationBadge({
  classification,
}: AutoClassificationBadgeProps) {
  const t = useTranslations("portal.ai");
  if (!classification) return null;

  const confidenceColor =
    classification.confidence > 0.7
      ? "text-green-600"
      : classification.confidence > 0.4
        ? "text-yellow-600"
        : "text-gray-600";

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="cursor-help gap-1">
            <Bot className="h-3 w-3" />
            Auto-classified
            <span className={confidenceColor}>
              ({Math.round(classification.confidence * 100)}%)
            </span>
          </Badge>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          <div className="space-y-2">
            <p className="font-medium">{t("classification")}</p>
            <div className="space-y-1 text-sm">
              <p>
                Type: <span className="capitalize">{classification.type}</span>
              </p>
              <p>
                Priority:{" "}
                <span className="capitalize">{classification.priority}</span>
              </p>
              {classification.reasons.length > 0 && (
                <div className="border-t pt-2">
                  <p className="text-muted-foreground mb-1 text-xs">{t("reasons")}</p>
                  <ul className="space-y-1 text-xs">
                    {classification.reasons.map((reason, i) => (
                      <li key={i}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
