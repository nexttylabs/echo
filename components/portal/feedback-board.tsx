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
import { useRouter, useSearchParams } from "next/navigation";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FeedbackPostCard, type FeedbackPost } from "./feedback-post-card";
import { ContributorsSidebar, type Contributor } from "./contributors-sidebar";
import { CreatePostDialog } from "./create-post-dialog";

type SortOption = "new" | "top" | "trending";

interface FeedbackBoardProps {
  organizationId: string;
  organizationSlug: string;
  posts: FeedbackPost[];
  isAuthenticated: boolean;
  contributors?: Contributor[];
  totalCount?: number;
  showVoteCount?: boolean;
  showAuthor?: boolean;
  allowPublicVoting?: boolean;
  className?: string;
}

export function FeedbackBoard({
  organizationId,
  organizationSlug,
  posts,
  isAuthenticated,
  contributors = [],
  totalCount,
  showVoteCount = true,
  showAuthor = false,
  allowPublicVoting = true,
  className,
}: FeedbackBoardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const currentSort = (searchParams.get("sort") as SortOption) || "new";

  const handleCreateClick = () => {
    if (!isAuthenticated) {
      router.push("/login");
      return;
    }
    setCreateDialogOpen(true);
  };

  const handleSortChange = (sort: SortOption) => {
    const params = new URLSearchParams(searchParams);
    params.set("sort", sort);
    router.push(`/${organizationSlug}?${params.toString()}`);
  };

  const filteredPosts = posts.filter(
    (post) =>
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const sortButtons: { value: SortOption; label: string }[] = [
    { value: "new", label: "New" },
    { value: "top", label: "Top" },
    { value: "trending", label: "Trending" },
  ];

  return (
    <div className={cn("flex flex-col lg:flex-row gap-8", className)}>
      {/* Main Content */}
      <div className="flex-1 space-y-6">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Feedback</h1>
            <p className="text-muted-foreground mt-2">
              Share ideas, vote on requests, and help shape the roadmap.
            </p>
            {typeof totalCount === "number" && (
              <p className="text-sm text-muted-foreground mt-1">
                {totalCount} posts collected so far
              </p>
            )}
          </div>
          <Button
            size="lg"
            className="w-full sm:w-auto"
            onClick={handleCreateClick}
          >
            <Plus className="h-4 w-4 mr-2" />
            Submit Feedback
          </Button>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between rounded-lg border bg-muted/30 p-3">
          {/* Search */}
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search posts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Sort Controls */}
          <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
            {sortButtons.map((btn) => (
              <Button
                key={btn.value}
                variant={currentSort === btn.value ? "secondary" : "ghost"}
                size="sm"
                onClick={() => handleSortChange(btn.value)}
                className={cn(
                  "text-sm",
                  currentSort === btn.value && "bg-background shadow-sm"
                )}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Posts List */}
        <div className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No posts found</p>
              <Button
                variant="default"
                onClick={handleCreateClick}
                className="mt-3"
              >
                Create the first post
              </Button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <FeedbackPostCard
                key={post.id}
                post={post}
                organizationSlug={organizationSlug}
                organizationId={organizationId}
                showVoteCount={showVoteCount}
                showAuthor={showAuthor}
                allowPublicVoting={allowPublicVoting}
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar */}
      {contributors.length > 0 && (
        <aside className="lg:w-72 shrink-0">
          <ContributorsSidebar contributors={contributors} />
        </aside>
      )}

      {/* Floating Create Button */}
      <Button
        size="lg"
        className="fixed bottom-6 right-6 shadow-lg gap-2 z-40 md:hidden"
        onClick={handleCreateClick}
      >
        <Plus className="h-5 w-5" />
        Create A New Post
      </Button>

      {/* Create Post Dialog */}
      <CreatePostDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        organizationId={organizationId}
      />
    </div>
  );
}
