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

import { useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { LOCALE_COOKIE_NAME, SUPPORTED_LOCALES, type AppLocale } from "@/i18n/config";

const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function setLocaleCookie(locale: AppLocale) {
  const secure = window.location.protocol === "https:" ? ";secure" : "";
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${COOKIE_MAX_AGE_SECONDS};samesite=lax${secure}`;
}

export type LanguageSwitcherProps = {
  variant?: "text" | "icon";
};

function useLocaleSwitcher() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("language");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleSelect = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return;
    setLocaleCookie(nextLocale);
    startTransition(() => {
      router.refresh();
    });
  };

  return { locale, t, isPending, handleSelect };
}

export function LanguageSwitcher({ variant = "text" }: LanguageSwitcherProps) {
  const { locale, t, isPending, handleSelect } = useLocaleSwitcher();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {variant === "icon" ? (
          <Button
            variant="ghost"
            size="icon"
            disabled={isPending}
            aria-label={t("label")}
          >
            <Languages className="h-4 w-4" />
            <span className="sr-only">{t("label")}</span>
          </Button>
        ) : (
          <Button variant="ghost" size="sm" disabled={isPending}>
            <Languages className="h-4 w-4 mr-2" />
            {t(locale)}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {SUPPORTED_LOCALES.map((supportedLocale) => (
          <DropdownMenuItem
            key={supportedLocale}
            onClick={() => handleSelect(supportedLocale)}
            className={supportedLocale === locale ? "font-medium" : undefined}
          >
            {t(supportedLocale)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function LanguageMenuItems() {
  const { locale, t, isPending, handleSelect } = useLocaleSwitcher();

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger disabled={isPending}>
        <Languages className="h-4 w-4" />
        {t("label")}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuRadioGroup value={locale}>
          {SUPPORTED_LOCALES.map((supportedLocale) => (
            <DropdownMenuRadioItem
              key={supportedLocale}
              value={supportedLocale}
              onClick={() => handleSelect(supportedLocale)}
            >
              {t(supportedLocale)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
