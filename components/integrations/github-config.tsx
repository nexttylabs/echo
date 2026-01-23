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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function GitHubConfig() {
  const t = useTranslations("integrations.github");
  const [accessToken, setAccessToken] = useState("");
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [autoSync, setAutoSync] = useState(true);
  const [webhookInfo, setWebhookInfo] = useState<{
    url: string;
    secret: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/integrations/github")
      .then((res) => res.json())
      .then((data) => {
        if (data.configured) {
          setConfigured(true);
          setOwner(data.owner);
          setRepo(data.repo);
          setAutoSync(data.autoSync);
        }
      })
      .catch(() => {
        setError(t("failedToLoad"));
      });
  }, [t]);

  async function save() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken, owner, repo, autoSync }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to save configuration");
        return;
      }

      if (data.success) {
        setConfigured(true);
        setWebhookInfo({
          url: data.webhookUrl,
          secret: data.webhookSecret,
        });
      }
    } catch {
      setError("Failed to save configuration");
    } finally {
      setLoading(false);
    }
  }

  async function disconnect() {
    setLoading(true);
    setError(null);
    try {
      await fetch("/api/integrations/github", { method: "DELETE" });
      setConfigured(false);
      setAccessToken("");
      setOwner("");
      setRepo("");
      setWebhookInfo(null);
    } catch {
      setError("Failed to disconnect");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
        <CardDescription>
          {t("description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label>{t("personalAccessToken")}</Label>
          <Input
            type="password"
            value={accessToken}
            onChange={(e) => setAccessToken(e.target.value)}
            placeholder="ghp_..."
            disabled={configured}
          />
          <p className="text-sm text-muted-foreground">
            Requires <code>repo</code> scope for private repos
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{t("owner")}</Label>
            <Input
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="username or org"
              disabled={configured}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("repository")}</Label>
            <Input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="repo-name"
              disabled={configured}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label>{t("autoSync")}</Label>
          <Switch checked={autoSync} onCheckedChange={setAutoSync} />
        </div>

        {webhookInfo && (
          <Alert>
            <AlertDescription>
              <p className="font-medium mb-2">{t("webhook.title")}</p>
              <p className="text-sm">
                URL: <code>{webhookInfo.url}</code>
              </p>
              <p className="text-sm">
                Secret: <code>{webhookInfo.secret}</code>
              </p>
              <p className="text-sm mt-2">{t("webhook.events")}</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {configured ? (
            <Button variant="destructive" onClick={disconnect} disabled={loading}>
              {t("disconnect")}
            </Button>
          ) : (
            <Button
              onClick={save}
              disabled={loading || !accessToken || !owner || !repo}
            >
              {loading ? t("connecting") : t("connect")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
