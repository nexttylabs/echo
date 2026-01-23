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

import { useEffect, useState } from "react";

interface StatCardProps {
  title: string;
  value: number;
  colorClass: string;
}

function StatCard({ title, value, colorClass }: StatCardProps) {
  return (
    <div className={`p-4 rounded-lg border ${colorClass}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

interface FeedbackStatsProps {
  organizationId: string;
}

interface FeedbackItem {
  status: string;
  type: string;
}

export function FeedbackStats({ organizationId }: FeedbackStatsProps) {
  const [stats, setStats] = useState<{
    total: number;
    byStatus: Record<string, number>;
    byType: Record<string, number>;
  } | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const params = new URLSearchParams({
          organizationId,
          pageSize: "100",
        });

        const response = await fetch(`/api/feedback?${params}`);
        if (response.ok) {
          const result = await response.json();
          const byStatus: Record<string, number> = {};
          const byType: Record<string, number> = {};

          result.data.forEach((f: FeedbackItem) => {
            byStatus[f.status] = (byStatus[f.status] || 0) + 1;
            byType[f.type] = (byType[f.type] || 0) + 1;
          });

          setStats({
            total: result.total,
            byStatus,
            byType,
          });
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, [organizationId]);

  if (!stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-4 rounded-lg border animate-pulse bg-muted h-20"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="总反馈数"
        value={stats.total}
        colorClass="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950"
      />
      <StatCard
        title="新接收"
        value={stats.byStatus["new"] || 0}
        colorClass="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950"
      />
      <StatCard
        title="处理中"
        value={stats.byStatus["in-progress"] || 0}
        colorClass="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950"
      />
      <StatCard
        title="Bug"
        value={stats.byType["bug"] || 0}
        colorClass="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950"
      />
    </div>
  );
}
