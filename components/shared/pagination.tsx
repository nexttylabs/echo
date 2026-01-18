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
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination as PaginationRoot,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Number of visible page buttons (default: 5) */
  maxVisible?: number;
  /** Show "jump to page" input (default: true) */
  showJumpTo?: boolean;
  /** Additional class name */
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxVisible = 5,
  showJumpTo = true,
  className,
}: PaginationProps) {
  const t = useTranslations("feedback");
  const [jumpPage, setJumpPage] = useState("");

  // Generate page numbers with ellipsis logic
  const getPageNumbers = () => {
    const pages: (number | "ellipsis-start" | "ellipsis-end")[] = [];
    
    if (totalPages <= maxVisible + 2) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      // Calculate middle range
      let startPage = Math.max(
        2,
        currentPage - Math.floor((maxVisible - 2) / 2)
      );
      const endPage = Math.min(totalPages - 1, startPage + maxVisible - 3);
      
      // Adjust if near the end
      if (endPage - startPage < maxVisible - 3) {
        startPage = Math.max(2, endPage - (maxVisible - 3));
      }

      // Add ellipsis before middle numbers
      if (startPage > 2) {
        pages.push("ellipsis-start");
      }

      // Add middle pages
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      // Add ellipsis after middle numbers
      if (endPage < totalPages - 1) {
        pages.push("ellipsis-end");
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const handleJump = () => {
    const parsed = Number(jumpPage);
    if (!Number.isFinite(parsed)) return;
    if (parsed < 1 || parsed > totalPages) return;
    onPageChange(parsed);
    setJumpPage("");
  };

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const pageNumbers = getPageNumbers();
  const isFirstPage = currentPage === 1;
  const isLastPage = currentPage === totalPages;

  return (
    <div className={cn("flex flex-wrap items-center justify-center gap-4", className)}>
      <PaginationRoot>
        <PaginationContent>
          {/* Previous Button */}
          <PaginationItem>
            <PaginationPrevious
              onClick={handlePrevious}
              aria-disabled={isFirstPage}
              tabIndex={isFirstPage ? -1 : undefined}
              className={cn(
                isFirstPage && "pointer-events-none opacity-50"
              )}
              aria-label={t("pagination.previous")}
            />
          </PaginationItem>

          {/* Page Numbers */}
          {pageNumbers.map((page) => {
            if (page === "ellipsis-start" || page === "ellipsis-end") {
              return (
                <PaginationItem key={page}>
                  <PaginationEllipsis />
                </PaginationItem>
              );
            }

            return (
              <PaginationItem key={page}>
                <PaginationLink
                  isActive={currentPage === page}
                  onClick={() => onPageChange(page)}
                  aria-label={t("pagination.goToPage", { page })}
                >
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          {/* Next Button */}
          <PaginationItem>
            <PaginationNext
              onClick={handleNext}
              aria-disabled={isLastPage}
              tabIndex={isLastPage ? -1 : undefined}
              className={cn(
                isLastPage && "pointer-events-none opacity-50"
              )}
              aria-label={t("pagination.next")}
            />
          </PaginationItem>
        </PaginationContent>
      </PaginationRoot>

      {/* Jump to Page */}
      {showJumpTo && totalPages > maxVisible && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("pagination.jumpTo")}
          </span>
          <Input
            type="number"
            min={1}
            max={totalPages}
            value={jumpPage}
            onChange={(event) => setJumpPage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                handleJump();
              }
            }}
            placeholder={String(currentPage)}
            className="h-8 w-16 text-center"
          />
          <Button size="sm" variant="outline" onClick={handleJump}>
            {t("pagination.go")}
          </Button>
          <span className="text-xs text-muted-foreground">
            / {totalPages}
          </span>
        </div>
      )}
    </div>
  );
}
