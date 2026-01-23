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

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleSelector } from "@/components/settings/role-selector";

type MemberToRemove = {
  id: string;
  name: string;
};

type OrganizationMember = {
  userId: string;
  role: string;
  name: string | null;
  email: string | null;
};

type OrganizationMembersListProps = {
  organizationId: string;
  currentUserId: string | null;
  initialMembers: OrganizationMember[];
};

export function OrganizationMembersList({
  organizationId,
  currentUserId,
  initialMembers,
}: OrganizationMembersListProps) {
  const t = useTranslations("settings.organizationPage.members");
  const [members, setMembers] = useState(initialMembers);
  const [error, setError] = useState<string | null>(null);
  const [pendingMemberId, setPendingMemberId] = useState<string | null>(null);
  const [memberToRemove, setMemberToRemove] = useState<MemberToRemove | null>(null);

  const currentUserRole =
    members.find((member) => member.userId === currentUserId)?.role ?? null;
  const canManageRoles = currentUserRole === "admin";

  const handleRemove = async () => {
    if (!memberToRemove) return;

    setError(null);
    setPendingMemberId(memberToRemove.id);

    const res = await fetch(`/api/organizations/${organizationId}/members/${memberToRemove.id}`, {
      method: "DELETE",
    });

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? t("removeFailed"));
      setPendingMemberId(null);
      return;
    }

    setMembers((prev) => prev.filter((member) => member.userId !== memberToRemove.id));
    setPendingMemberId(null);
    setMemberToRemove(null);
  };

  const handleRoleChange = async (memberId: string, nextRole: string) => {
    setError(null);
    setPendingMemberId(memberId);

    const res = await fetch(
      `/api/organizations/${organizationId}/members/${memberId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: nextRole }),
      },
    );

    const json = await res.json().catch(() => null);
    if (!res.ok) {
      setError(json?.error ?? t("updateRoleFailed"));
      setPendingMemberId(null);
      return;
    }

    setMembers((prev) =>
      prev.map((member) =>
        member.userId === memberId ? { ...member, role: nextRole } : member,
      ),
    );
    setPendingMemberId(null);
  };

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {members.length === 0 ? (
          <div className="rounded-md border border-dashed border-slate-200 bg-white/60 px-4 py-6 text-sm text-slate-500">
            {t("noMembers")}
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((member) => {
              const isSelf = currentUserId === member.userId;
              const isPending = pendingMemberId === member.userId;
              const displayName = member.name ?? member.email ?? t("unknownMember");
              const secondaryText = member.email ?? member.userId;

              return (
                <div
                  key={member.userId}
                  className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">{displayName}</div>
                    <div className="text-xs text-slate-500">{secondaryText}</div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <RoleSelector
                      value={member.role}
                      onChange={(value) => handleRoleChange(member.userId, value)}
                      disabled={!canManageRoles || isPending}
                    />

                    {isSelf ? (
                      <Button variant="outline" size="sm" disabled>
                        {t("cannotRemoveSelf")}
                      </Button>
                    ) : (
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={!currentUserId || isPending}
                        onClick={() => setMemberToRemove({ id: member.userId, name: displayName })}
                      >
                        {isPending ? t("removing") : t("remove")}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>

    <AlertDialog open={!!memberToRemove} onOpenChange={(open) => !open && setMemberToRemove(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmRemoveTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("confirmRemoveDescription", { name: memberToRemove?.name ?? "" })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={pendingMemberId !== null}>{t("cancel")}</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            onClick={handleRemove}
            disabled={pendingMemberId !== null}
          >
            {pendingMemberId === memberToRemove?.id ? t("removing") : t("confirmRemove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}

