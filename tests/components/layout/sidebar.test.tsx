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

import { describe, expect, it, mock, beforeEach, afterEach } from "bun:test";
import { render, fireEvent, cleanup } from "@testing-library/react";
import { Sidebar } from "@/components/layout/sidebar";
import "../../setup";

// Mock dependencies
const mockPush = mock(() => {});
const mockReplace = mock(() => {});
const mockRefresh = mock(() => {});
mock.module("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    refresh: mockRefresh,
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
}));

// Mock language switcher exports to avoid next-intl internals in this unit test.
mock.module("@/components/layout/language-switcher", () => ({
  LanguageSwitcher: () => <button type="button">Language</button>,
  LanguageMenuItems: () => <div>语言</div>,
}));

const translations = {
  navigation: {
    dashboard: "仪表盘",
    feedback: "反馈管理",
    sectionLabel: "导航",
    settings: "设置",
    logout: "退出登录",
    openMenu: "打开菜单",
  },
  language: {
    label: "语言",
    en: "English",
    "zh-CN": "简体中文",
    jp: "日本語",
  },
};

mock.module("next-intl", () => ({
  useTranslations: (namespace: keyof typeof translations) => (key: string) =>
    translations[namespace]?.[key as never] ?? key,
  useLocale: () => "en",
}));

const mockSignOut = mock(() => Promise.resolve());
mock.module("@/lib/auth/client", () => ({
  authClient: {
    signOut: mockSignOut,
  },
}));

mock.module("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSub: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSubContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuRadioItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuItem: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuSeparator: () => <div />,
}));

// Mock Link to avoid Next.js specific issues
mock.module("next/link", () => ({
  __esModule: true,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ children, href, onClick }: any) => {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  },
}));

describe("Sidebar", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    mockPush.mockClear();
    mockReplace.mockClear();
    mockRefresh.mockClear();
    mockSignOut.mockClear();
  });

  const defaultProps = {
    user: {
      name: "Test User",
      email: "test@example.com",
      role: "developer" as const,
      image: null,
    },
  };

  it("calls signOut and redirects to home when logout is clicked", async () => {
    const { getByText } = render(<Sidebar {...defaultProps} />);

    // Find the logout button by text "退出登录"
    const logoutText = getByText("退出登录");
    // The clickable element might be the parent <a> or button
    const logoutButton = logoutText.closest("a") || logoutText.closest("button");
    
    if (!logoutButton) throw new Error("Logout button not found");

    fireEvent.click(logoutButton);

    // This should fail currently because it's a Link, not using authClient
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("shows language menu in user dropdown", () => {
    const { getAllByText } = render(<Sidebar {...defaultProps} />);
    expect(getAllByText("语言").length).toBeGreaterThan(0);
  });

  it("refreshes when a language is selected", async () => {
    const { getByText } = render(<Sidebar {...defaultProps} />);

    fireEvent.click(getByText("简体中文"));

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockRefresh).toHaveBeenCalled();
  });
});
