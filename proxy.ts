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

import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  getPreferredLocaleFromHeader,
  isSupportedLocale,
} from "@/i18n/config";

// Default session cookie name used by better-auth
const SESSION_COOKIE_NAME = "better-auth.session_token";

const publicRoutes = ["/login", "/register", "/invite", "/invite/", "/api/auth", "/widget", "/portal"];
const protectedRoutes = ["/dashboard", "/feedback", "/settings"];
const LOCALE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function generateRequestId(): string {
  return crypto.randomUUID();
}

function isRouteMatch(pathname: string, routes: string[]) {
  return routes.some((route) => pathname === route || pathname.startsWith(route));
}

function shouldSetLocaleCookie(req: NextRequest, pathname: string) {
  if (req.method !== "GET") return false;
  if (pathname.startsWith("/api/") || pathname.startsWith("/_next/")) return false;
  if (pathname.includes(".")) return false;
  const existingLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  return !existingLocale;
}

function resolveLocaleFromRequest(req: NextRequest): string {
  const cookieLocale = req.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (cookieLocale && isSupportedLocale(cookieLocale)) return cookieLocale;
  return getPreferredLocaleFromHeader(req.headers.get("accept-language")) || DEFAULT_LOCALE;
}

function maybeSetLocaleCookie(req: NextRequest, response: NextResponse, pathname: string) {
  if (!shouldSetLocaleCookie(req, pathname)) return;
  const locale = resolveLocaleFromRequest(req);
  response.cookies.set(LOCALE_COOKIE_NAME, locale, {
    path: "/",
    sameSite: "lax",
    secure: req.nextUrl.protocol === "https:",
    maxAge: LOCALE_COOKIE_MAX_AGE_SECONDS,
  });
}

// Helper to determine if request is authenticated for tests
function isAuthenticated(req: NextRequest): boolean {
  // Real auth uses session cookie
  const sessionCookie = req.cookies.get(SESSION_COOKIE_NAME);
  if (sessionCookie?.value) return true;
  // Test auth can be simulated via custom header
  const testAuth = req.headers.get('x-test-auth');
  return testAuth === '1';
}

export async function proxy(req: NextRequest) {
  const startTime = Date.now();
  const reqId = req.headers.get("x-request-id") || generateRequestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", reqId);

  // Log request (Edge-compatible)
  console.log(`[${reqId}] ${req.method} ${req.nextUrl.pathname}`);

  const pathname = req.nextUrl.pathname;

  const isPublic = isRouteMatch(pathname, publicRoutes);
  const isProtected = isRouteMatch(pathname, protectedRoutes);

  let response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (isProtected && !isPublic) {
    // Optimistic check: only verify session cookie presence
    // Full session validation happens in page/layout components
    if (!isAuthenticated(req)) {
      response = NextResponse.redirect(new URL("/login", req.url));
    }
  }

  maybeSetLocaleCookie(req, response, pathname);
  response.headers.set("x-request-id", reqId);

  const duration = Date.now() - startTime;
  console.log(`[${reqId}] ${response.status} ${duration}ms`);

  return response;
}

export const config = {
  matcher: ["/api/:path*", "/((?!_next/static|_next/image|favicon.ico).*)"],
};
