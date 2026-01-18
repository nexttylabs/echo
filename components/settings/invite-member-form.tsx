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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const DEFAULT_ROLE = "member";

type InviteMemberFormProps = {
  organizationId: string;
};

export function InviteMemberForm({ organizationId }: InviteMemberFormProps) {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    const res = await fetch(`/api/organizations/${organizationId}/invitations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role: DEFAULT_ROLE }),
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
      setError(json?.error ?? "发送邀请失败，请稍后重试");
      setIsLoading(false);
      return;
    }

    setSuccess("邀请已发送，等待对方接受");
    setEmail("");
    setIsLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>邀请成员</CardTitle>
        <CardDescription>通过邮箱邀请新成员加入组织</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          ) : null}
          {success ? (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="invite-email">成员邮箱</Label>
            <Input
              id="invite-email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
              placeholder="name@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>邀请角色</Label>
            <div className="flex items-center gap-3 rounded-md border border-dashed border-slate-200 px-3 py-2 text-sm text-slate-600">
              <Badge variant="secondary">{DEFAULT_ROLE}</Badge>
              <span>当前仅支持成员角色</span>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading || !email}>
            {isLoading ? "发送中..." : "发送邀请"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
