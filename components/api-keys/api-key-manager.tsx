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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Eye, EyeOff, Copy, Check, Key } from "lucide-react";

interface ApiKey {
  keyId: number;
  name: string;
  displayKey: string;
  prefix: string;
  disabled: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export function ApiKeyManager() {
  const t = useTranslations("apiKeys");
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadKeys();
  }, []);

  async function loadKeys() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/api-keys");
      if (response.ok) {
        const data = await response.json();
        setKeys(data.data || []);
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function createKey() {
    if (!newKeyName.trim()) return;
    setIsCreating(true);
    try {
      const response = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName }),
      });

      if (response.ok) {
        const data = await response.json();
        setCreatedKey(data.data.key);
        setNewKeyName("");
        await loadKeys();
      }
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteKey(keyId: number) {
    if (!confirm(t("deleteConfirm"))) return;

    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await loadKeys();
      }
    } catch {
      // Error handling
    }
  }

  async function toggleKey(keyId: number, disabled: boolean) {
    try {
      const response = await fetch(`/api/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disabled }),
      });

      if (response.ok) {
        await loadKeys();
      }
    } catch {
      // Error handling
    }
  }

  async function copyKey() {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="space-y-6">
      <AlertDialog open={!!createdKey} onOpenChange={() => setCreatedKey(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("dialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("dialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg font-mono text-sm break-all">
              {createdKey}
            </div>

            <Button onClick={copyKey} className="w-full">
              {copied ? <Check className="mr-2 h-4 w-4" /> : <Copy className="mr-2 h-4 w-4" />}
              {copied ? t("dialog.copied") : t("dialog.copy")}
            </Button>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("dialog.close")}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            {t("create.title")}
          </CardTitle>
          <CardDescription>
            {t("create.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Input
                placeholder={t("create.placeholder")}
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newKeyName.trim()) {
                    createKey();
                  }
                }}
              />
            </div>

            <Button
              onClick={createKey}
              disabled={!newKeyName.trim() || isCreating}
            >
              {isCreating ? (
                t("create.creating")
              ) : (
                <>
                  <Plus className="mr-2 h-4 w-4" /> {t("create.button")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">{t("loading")}</div>
      ) : keys.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {t("empty")}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {keys.map((key) => (
            <Card key={key.keyId}>
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{key.name}</h3>
                      <Badge variant={key.disabled ? "destructive" : "default"}>
                        {key.disabled ? t("status.disabled") : t("status.active")}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground font-mono">
                      {key.displayKey}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {t("createdAt")}: {new Date(key.createdAt).toLocaleDateString()}
                      {key.lastUsed && (
                        <> · {t("lastUsed")}: {new Date(key.lastUsed).toLocaleDateString()}</>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleKey(key.keyId, !key.disabled)}
                      title={key.disabled ? t("actions.enable") : t("actions.disable")}
                    >
                      {key.disabled ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteKey(key.keyId)}
                      title={t("actions.delete")}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
