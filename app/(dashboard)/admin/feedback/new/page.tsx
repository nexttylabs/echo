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

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { canSubmitOnBehalf, type UserRole } from "@/lib/auth/permissions";
import { SubmitOnBehalfForm } from "@/components/feedback/submit-on-behalf-form";
import { db } from "@/lib/db";
import { getUserOrganization } from "@/lib/auth/organization";

export default async function NewFeedbackPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    redirect("/login");
  }

  if (!db) {
    throw new Error("Database not configured");
  }

  // Get user's organization first (which includes their role)
  const organization = await getUserOrganization(db, session.user.id);

  if (!organization) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
            <h1 className="text-xl font-semibold text-amber-800">未找到组织</h1>
            <p className="mt-2 text-sm text-amber-700">
              请先加入组织后再代客户提交反馈。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Get user role from organization membership
  const userRole = (organization.role as UserRole) || "customer";
  const hasSubmitOnBehalfPermission = canSubmitOnBehalf(userRole);

  if (!hasSubmitOnBehalfPermission) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
          <div className="rounded-lg border border-red-200 bg-red-50 p-6">
            <h1 className="text-xl font-semibold text-red-800">权限不足</h1>
            <p className="mt-2 text-sm text-red-600">
              您没有代客户提交反馈的权限。请联系管理员获取相应权限。
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 px-4 py-12">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            代客户提交反馈
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            以客服身份代表客户提交反馈，系统将同时记录客服和客户信息
          </p>
        </div>
        <SubmitOnBehalfForm
          organizationId={organization.id}
          userRole={userRole}
          userId={session.user.id}
        />
      </div>
    </div>
  );
}
