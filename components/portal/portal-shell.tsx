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

import { Suspense } from "react";
import { PortalNav } from "./portal-nav";
import { EmbeddedFeedbackForm } from "@/components/feedback/embedded-feedback-form";

type Section = {
  label: string;
  href: string;
};

type PortalShellProps = {
  title: string;
  sections: readonly Section[];
  organizationId?: string;
  children?: React.ReactNode;
};

export function PortalShell({ title, sections, organizationId, children }: PortalShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-semibold">{title}</h1>
          <PortalNav sections={sections} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        <div className="mx-auto max-w-2xl space-y-8">
          {children ?? (
            <>
              <div className="text-center">
                <h2 className="text-2xl font-bold tracking-tight">分享你的反馈</h2>
                <p className="mt-2 text-muted-foreground">
                  帮助我们了解你的想法，让产品变得更好
                </p>
              </div>
              <Suspense fallback={<div className="animate-pulse h-40 bg-muted rounded-lg" />}>
                <EmbeddedFeedbackForm organizationId={organizationId} />
              </Suspense>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
