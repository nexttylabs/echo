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

'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetAt: string;
}

function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
}

interface RateLimitInfoProps {
  rateLimitData?: RateLimitInfo | null;
}

export function RateLimitInfoDisplay({ rateLimitData }: RateLimitInfoProps) {
  const [resetIn, setResetIn] = useState(0);

  useEffect(() => {
    if (!rateLimitData?.resetAt) return;

    const updateResetIn = () => {
      const resetDate = new Date(rateLimitData.resetAt);
      setResetIn(Math.max(0, Math.floor((resetDate.getTime() - Date.now()) / 1000)));
    };

    updateResetIn();
    const interval = setInterval(updateResetIn, 1000);

    return () => clearInterval(interval);
  }, [rateLimitData?.resetAt]);

  if (!rateLimitData) return null;

  const percentUsed =
    ((rateLimitData.limit - rateLimitData.remaining) / rateLimitData.limit) *
    100;
  const isLow = percentUsed > 80;

  return (
    <Alert variant={isLow ? 'destructive' : 'default'}>
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between gap-4">
          <div>
            <span className="font-medium">API Rate Limit:</span>{' '}
            {rateLimitData.remaining} / {rateLimitData.limit} requests remaining
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLow ? 'destructive' : 'secondary'}>
              {Math.round(percentUsed)}% used
            </Badge>
            <span className="text-xs text-muted-foreground">
              Resets in {formatDuration(resetIn)}
            </span>
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
}
