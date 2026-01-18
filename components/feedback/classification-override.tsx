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
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface ClassificationOverrideProps {
  feedbackId: number;
  onUpdated: () => void;
}

export function ClassificationOverride({
  feedbackId,
  onUpdated,
}: ClassificationOverrideProps) {
  const [isReclassifying, setIsReclassifying] = useState(false);

  async function reclassify() {
    setIsReclassifying(true);
    try {
      const response = await fetch(`/api/feedback/${feedbackId}/reclassify`, {
        method: "POST",
      });

      if (response.ok) {
        onUpdated();
      }
    } finally {
      setIsReclassifying(false);
    }
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={reclassify}
      disabled={isReclassifying}
    >
      <RefreshCw
        className={`mr-2 h-4 w-4 ${isReclassifying ? "animate-spin" : ""}`}
      />
      Re-run Classification
    </Button>
  );
}
