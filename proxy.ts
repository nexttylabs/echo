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

// Primary app hosts (custom domains will not match these)
const APP_HOSTS = new Set([
  "localhost",
  "localhost:3000",
  "127.0.0.1:3000",
  // Add production domains when deployed
]);

// Simple in-memory cache for domain lookups
const domainCache = new Map<string, { orgSlug: string; projectSlug: string } | null>();
const CACHE_TTL = 60 * 1000; // 1 minute
const cacheTimestamps = new Map<string, number>();

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

async function lookupCustomDomain(hostname: string, requestUrl: string): Promise<{ orgSlug: string; projectSlug: string } | null> {
  const now = Date.now();
  const cachedResult = domainCache.get(hostname);
  const cacheTime = cacheTimestamps.get(hostname);
  
  if (cachedResult !== undefined && cacheTime && now - cacheTime < CACHE_TTL) {
    return cachedResult;
  }

  try {
    const lookupUrl = new URL("/api/internal/domain-lookup", requestUrl);
    lookupUrl.searchParams.set("domain", hostname);
    
    const response = await fetch(lookupUrl, {
      headers: {
        "x-middleware-secret": process.env.MIDDLEWARE_SECRET || "",
      },
    });

    if (response.ok) {
      const data = await response.json();
      if (data.orgSlug && data.projectSlug) {
        const result = { orgSlug: data.orgSlug, projectSlug: data.projectSlug };
        domainCache.set(hostname, result);
        cacheTimestamps.set(hostname, now);
        return result;
      }
    }
    
    domainCache.set(hostname, null);
    cacheTimestamps.set(hostname, now);
  } catch (error) {
    console.error("Domain lookup failed:", error);
  }

  return null;
}

export async function proxy(req: NextRequest) {
  const startTime = Date.now();
  const reqId = req.headers.get("x-request-id") || generateRequestId();

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-request-id", reqId);

  // Log request (Edge-compatible)
  console.log(`[${reqId}] ${req.method} ${req.nextUrl.pathname}`);

  const pathname = req.nextUrl.pathname;
  const hostname = req.headers.get("host") || "";
  const hostnameWithoutPort = hostname.split(":")[0];

  // Custom domain routing - check if this is a custom domain request
  if (!APP_HOSTS.has(hostname) && !APP_HOSTS.has(hostnameWithoutPort)) {
    // Skip API routes and static assets
    if (!pathname.startsWith("/api/") && !pathname.startsWith("/_next/") && !pathname.includes(".")) {
      const domainInfo = await lookupCustomDomain(hostname, req.url);
      if (domainInfo) {
        const url = req.nextUrl.clone();
        url.pathname = `/portal/${domainInfo.orgSlug}/${domainInfo.projectSlug}${pathname === "/" ? "" : pathname}`;
        
        const response = NextResponse.rewrite(url, {
          request: { headers: requestHeaders },
        });
        maybeSetLocaleCookie(req, response, pathname);
        response.headers.set("x-request-id", reqId);
        const duration = Date.now() - startTime;
        console.log(`[${reqId}] ${response.status} ${duration}ms (rewrite)`);
        return response;
      }
    }
  }

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
