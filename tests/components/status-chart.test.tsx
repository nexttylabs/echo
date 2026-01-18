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

import React from "react";
import { afterEach, beforeAll, describe, expect, it, mock } from "bun:test";
import { cleanup, render } from "@testing-library/react";
import "../setup";

let StatusChart: typeof import("@/components/dashboard/status-chart").StatusChart;

mock.module("next-intl", () => ({
  useTranslations: (namespace: string) => (key: string) => {
    if (namespace === "dashboard.statusChart") {
      if (key === "title") {
        return "Status Distribution";
      }
      if (key === "noData") {
        return "No data";
      }
      return key;
    }
    if (namespace === "feedback") {
      const messages: Record<string, string> = {
        "status.inProgress": "In Progress",
        "filters.title": "Status",
      };
      if (key in messages) {
        return messages[key];
      }
      throw new Error(
        `MISSING_MESSAGE: Could not resolve ${namespace}.${key} in messages for locale en`,
      );
    }
    return key;
  },
}));

mock.module("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Pie: ({
    children,
    data,
  }: {
    children: React.ReactNode;
    data?: { name: string }[];
  }) => (
    <div>
      {data?.map((entry) => (
        <span key={entry.name}>{entry.name}</span>
      ))}
      {children}
    </div>
  ),
  Cell: () => <div />,
  Legend: () => <div />,
  Tooltip: () => <div />,
}));

beforeAll(async () => {
  ({ StatusChart } = await import("@/components/dashboard/status-chart"));
});

afterEach(() => {
  cleanup();
});

describe("StatusChart", () => {
  it("renders in-progress label without missing message errors", () => {
    const { getByText } = render(
      <StatusChart data={[{ status: "in-progress", count: 2 }]} />,
    );

    expect(getByText("In Progress")).toBeTruthy();
  });
});
