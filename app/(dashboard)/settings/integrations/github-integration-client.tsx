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

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch"; 
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Github, Clock, Loader2, ExternalLink, Check, AlertCircle } from "lucide-react";

interface GitHubConfig {
  configured: boolean;
  connected: boolean;
  repoConfigured?: boolean;
  owner: string | null;
  repo: string | null;
  autoSync: boolean;
  syncTriggerStatuses: string[];
  syncStatusChanges: boolean;
  syncComments: boolean;
  autoAddLabels: boolean;
  lastSyncAt: string | null;
}

interface GitHubRepo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  owner: string;
  ownerAvatar: string;
  description: string | null;
  canPush: boolean;
}

const STATUS_OPTIONS = [
  { value: "new", labelKey: "github.syncTrigger.new" },
  { value: "in-progress", labelKey: "github.syncTrigger.inProgress" },
  { value: "planned", labelKey: "github.syncTrigger.planned" },
  { value: "completed", labelKey: "github.syncTrigger.completed" },
  { value: "closed", labelKey: "github.syncTrigger.closed" },
];

export function GitHubIntegrationClient() {
  const t = useTranslations("settings.integrations");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [config, setConfig] = useState<GitHubConfig | null>(null);
  const [repos, setRepos] = useState<GitHubRepo[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<string>("");

  // Sync settings state
  const [syncTriggerStatuses, setSyncTriggerStatuses] = useState<string[]>([
    "in-progress",
    "planned",
  ]);
  const [syncStatusChanges, setSyncStatusChanges] = useState(true);
  const [syncComments, setSyncComments] = useState(false);
  const [autoAddLabels, setAutoAddLabels] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch current config
  const fetchConfig = useCallback(async () => {
    try {
      const response = await fetch("/api/integrations/github");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
        if (data.connected) {
          setSyncTriggerStatuses(data.syncTriggerStatuses || ["in-progress", "planned"]);
          setSyncStatusChanges(data.syncStatusChanges ?? true);
          setSyncComments(data.syncComments ?? false);
          setAutoAddLabels(data.autoAddLabels ?? false);
          if (data.owner && data.repo) {
            setSelectedRepo(`${data.owner}/${data.repo}`);
          }
        }
      }
    } catch {
      // console.error("Failed to load GitHub integration status");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch repos when connected but no repo selected
  const fetchRepos = useCallback(async () => {
    if (!config?.connected) return;

    setLoadingRepos(true);
    try {
      const response = await fetch("/api/integrations/github/repos");
      if (response.ok) {
        const data = await response.json();
        setRepos(data.repos || []);
      }
    } catch {
      // console.error("Failed to load repositories");
    } finally {
      setLoadingRepos(false);
    }
  }, [config?.connected]);

  // Initial load
  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  // Handle OAuth callback params
  useEffect(() => {
    const error = searchParams.get("error");
    const connected = searchParams.get("github_connected");

    if (error) {
      alert(error);
      // Clean up URL
      router.replace("/settings/integrations");
    }

    if (connected === "true") {
      // alert("GitHub connected successfully!");
      fetchConfig();
      // Clean up URL
      router.replace("/settings/integrations");
    }
  }, [searchParams, router, fetchConfig]);

  // Fetch repos when connected but no repo configured
  useEffect(() => {
    if (config?.connected && !config?.repoConfigured) {
      fetchRepos();
    }
  }, [config?.connected, config?.repoConfigured, fetchRepos]);

  // Track changes
  useEffect(() => {
    if (!config?.configured) return;

    const originalStatuses = config.syncTriggerStatuses || ["in-progress", "planned"];
    const statusesChanged =
      JSON.stringify([...syncTriggerStatuses].sort()) !==
      JSON.stringify([...originalStatuses].sort());
    const settingsChanged =
      syncStatusChanges !== (config.syncStatusChanges ?? true) ||
      syncComments !== (config.syncComments ?? false) ||
      autoAddLabels !== (config.autoAddLabels ?? false);

    setHasChanges(statusesChanged || settingsChanged);
  }, [
    config,
    syncTriggerStatuses,
    syncStatusChanges,
    syncComments,
    autoAddLabels,
  ]);

  // Connect to GitHub
  const handleConnect = () => {
    window.location.href = "/api/integrations/github/oauth";
  };

  // Select repository
  const handleSelectRepo = async (fullName: string) => {
    const [owner, repo] = fullName.split("/");
    if (!owner || !repo) return;

    setSaving(true);
    try {
      const response = await fetch("/api/integrations/github", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner, repo }),
      });

      if (response.ok) {
        setSelectedRepo(fullName);
        fetchConfig();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to connect repository");
      }
    } catch {
      alert("Failed to connect repository");
    } finally {
      setSaving(false);
    }
  };

  // Save settings
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/integrations/github", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syncTriggerStatuses,
          syncStatusChanges,
          syncComments,
          autoAddLabels,
        }),
      });

      if (response.ok) {
        setHasChanges(false);
        fetchConfig();
      } else {
        const data = await response.json();
        alert(data.error || "Failed to save settings");
      }
    } catch {
      alert("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Disconnect
  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const response = await fetch("/api/integrations/github", {
        method: "DELETE",
      });

      if (response.ok) {
        setConfig(null);
        fetchConfig();
      } else {
        alert("Failed to disconnect");
      }
    } catch {
      alert("Failed to disconnect");
    } finally {
      setDisconnecting(false);
    }
  };

  // Toggle status
  const handleStatusToggle = (status: string, checked: boolean) => {
    if (checked) {
      setSyncTriggerStatuses((prev) => [...prev, status]);
    } else {
      setSyncTriggerStatuses((prev) => prev.filter((s) => s !== status));
    }
  };

  // Check if GitHub OAuth is configured
  const oauthConfigured = true; // Will be determined by env vars on server

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const isConnected = config?.connected ?? false;
  const isConfigured = config?.configured ?? false;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#24292f] dark:bg-[#f0f6fc]">
              <Github className="h-7 w-7 text-white dark:text-[#24292f]" />
            </div>
            <div>
              <CardTitle className="text-lg">{t("github.title")}</CardTitle>
              <CardDescription>{t("github.description")}</CardDescription>
            </div>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"}>
            {isConnected ? t("github.connected") : t("github.notConnected")}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isConnected ? (
          // Not connected state
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              {t("github.connectPrompt")}
            </p>
            {oauthConfigured ? (
              <Button onClick={handleConnect}>
                <Github className="mr-2 h-4 w-4" />
                {t("github.connectButton")}
              </Button>
            ) : (
              <Button disabled>
                <Github className="mr-2 h-4 w-4" />
                {t("github.connectButton")}
                <Badge variant="secondary" className="ml-2">
                  {t("comingSoon.badge")}
                </Badge>
              </Button>
            )}
          </div>
        ) : !isConfigured ? (
          // Connected but no repo selected
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <Check className="h-4 w-4" />
              <span>GitHub account connected! Now select a repository:</span>
            </div>

            {loadingRepos ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : repos.length === 0 ? (
              <div className="flex items-center gap-2 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200">
                <AlertCircle className="h-4 w-4" />
                <span>
                  No repositories found. Make sure you have access to at least one repository.
                </span>
              </div>
            ) : (
              <div className="space-y-3">
                <Select value={selectedRepo} onValueChange={handleSelectRepo}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a repository..." />
                  </SelectTrigger>
                  <SelectContent>
                    {repos.map((repo) => (
                      <SelectItem
                        key={repo.id}
                        value={repo.fullName}
                        disabled={!repo.canPush}
                      >
                        <div className="flex items-center gap-2">
                          <span>{repo.fullName}</span>
                          {repo.private && (
                            <Badge variant="outline" className="text-xs">
                              Private
                            </Badge>
                          )}
                          {!repo.canPush && (
                            <Badge variant="secondary" className="text-xs">
                              Read-only
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <div className="flex justify-end">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                      >
                        {t("github.disconnectButton")}
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove your GitHub connection. You can reconnect at any time.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDisconnect}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {disconnecting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Disconnect"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Fully configured state
          <>
            {/* Connected Repository */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t("github.connectedRepos")}</h4>
              <div className="rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Github className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {config?.owner}/{config?.repo}
                      </p>
                      {config?.lastSyncAt && (
                        <p className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {t("github.lastSync", {
                            time: new Date(config.lastSyncAt).toLocaleString(),
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      asChild
                    >
                      <a
                        href={`https://github.com/${config?.owner}/${config?.repo}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        View
                      </a>
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          {t("github.disconnectButton")}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect GitHub?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove your GitHub connection and all sync settings.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDisconnect}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {disconnecting ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Disconnect"
                            )}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </div>
            </div>

            {/* Sync Trigger Settings */}
            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-medium">{t("github.syncTrigger.title")}</h4>
                <p className="text-sm text-muted-foreground">
                  {t("github.syncTrigger.description")}
                </p>
              </div>
              <div className="space-y-2 rounded-lg border p-4">
                {STATUS_OPTIONS.map((option) => (
                  <label key={option.value} className="flex items-center gap-3">
                    <Switch
                      checked={syncTriggerStatuses.includes(option.value)}
                      onCheckedChange={(checked: boolean) =>
                        handleStatusToggle(option.value, checked === true)
                      }
                    />
                    <span className="text-sm">{t(option.labelKey)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Other Settings */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">{t("github.otherSettings.title")}</h4>
              <div className="space-y-2 rounded-lg border p-4">
                <label className="flex items-center gap-3">
                  <Switch
                    checked={syncStatusChanges}
                    onCheckedChange={(checked: boolean) =>
                      setSyncStatusChanges(checked === true)
                    }
                  />
                  <span className="text-sm">
                    {t("github.otherSettings.syncStatusChanges")}
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <Switch
                    checked={syncComments}
                    onCheckedChange={(checked: boolean) => setSyncComments(checked === true)}
                  />
                  <span className="text-sm">
                    {t("github.otherSettings.syncComments")}
                  </span>
                </label>
                <label className="flex items-center gap-3">
                  <Switch
                    checked={autoAddLabels}
                    onCheckedChange={(checked: boolean) =>
                      setAutoAddLabels(checked === true)
                    }
                  />
                  <span className="text-sm">
                    {t("github.otherSettings.autoAddLabels")}
                  </span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            {hasChanges && (
              <div className="flex justify-end">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
