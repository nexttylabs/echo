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

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { MessageSquare, Sparkles, Shield, Zap } from "lucide-react";

export function Hero() {
  const t = useTranslations("hero");
  
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-50 via-white to-slate-100">
      <header className="container mx-auto flex items-center justify-between px-4 py-6">
        <div className="flex items-center gap-2">
          <MessageSquare className="size-8 text-primary" />
          <span className="text-2xl font-bold text-slate-900">{t("title")}</span>
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
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            {t("headline")}
          </h1>
          <p className="mt-6 text-xl text-slate-600">
            {t("description")}
            <br />
            <span className="font-medium text-slate-700">{t("subtitle")}</span>
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
          <h2 className="text-center text-3xl font-bold text-slate-900">{t("coreValues")}</h2>
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
          <h2 className="text-3xl font-bold text-slate-900">{t("ready.title")}</h2>
          <p className="mt-4 text-lg text-slate-600">
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

      <footer className="container mx-auto border-t border-slate-200 px-4 py-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <MessageSquare className="size-4" />
            <span>{t("footer.title")}</span>
          </div>
          <div className="flex gap-6 text-sm text-slate-500">
            <Link href="/docs" className="hover:text-slate-700">
              {t("footer.docs")}
            </Link>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-700"
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
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600">{description}</p>
    </div>
  );
}
