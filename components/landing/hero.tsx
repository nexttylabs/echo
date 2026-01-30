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

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MessageSquare, Sparkles, Shield, Zap } from "lucide-react";

export function Hero() {
  const t = useTranslations("hero");
  
  return (
    <div className="min-h-screen bg-background">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-8 text-primary" />
          <span className="text-2xl font-bold text-foreground">{t("title")}</span>
        </div>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher variant="icon" />
          <Button variant="ghost" asChild>
            <Link href="/login">{t("login")}</Link>
          </Button>
          <Button asChild>
            <Link href="/register">{t("register")}</Link>
          </Button>
        </nav>
      </header>

      <main className="container mx-auto px-4 py-20">
        <section className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            {t("headline")}
          </h1>
          <p className="mt-6 text-xl text-muted-foreground">
            {t("description")}
            <br />
            <span className="font-medium text-foreground/80">{t("subtitle")}</span>
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">{t("cta1")}</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/docs">{t("cta2")}</Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto mt-32 max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-foreground">{t("coreValues")}</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Zap className="size-6" />}
              title={t("feature1.title")}
              description={t("feature1.description")}
            />
            <FeatureCard
              icon={<Shield className="size-6" />}
              title={t("feature2.title")}
              description={t("feature2.description")}
            />
            <FeatureCard
              icon={<Sparkles className="size-6" />}
              title={t("feature3.title")}
              description={t("feature3.description")}
            />
            <FeatureCard
              icon={<MessageSquare className="size-6" />}
              title={t("feature4.title")}
              description={t("feature4.description")}
            />
          </div>
        </section>

        <section className="mx-auto mt-32 max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-foreground">{t("ready.title")}</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            {t("ready.description")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link href="/register">{t("ready.cta1")}</Link>
            </Button>
            <Button size="lg" variant="ghost" asChild>
              <Link href="/login">{t("ready.cta2")}</Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="container mx-auto border-t border-border px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="size-4" />
            <span>{t("footer.title")}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/docs" className="hover:text-foreground">
              {t("footer.docs")}
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-card-foreground">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
