import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

import {
  isPublicAssetPath,
  resolveProxyRedirect
} from "@/lib/auth/routing";
import type { Database } from "@/lib/types/database";
import { getSupabaseConfig } from "@/lib/env";

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();

  if (!config) {
    return NextResponse.next({ request });
  }

  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(config.url, config.anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        response = NextResponse.next({ request });

        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          response.cookies.set(name, value, options);
        });
      }
    }
  });

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (isPublicAssetPath(request.nextUrl.pathname)) {
    return response;
  }

  const redirectDecision = resolveProxyRedirect({
    pathname: request.nextUrl.pathname,
    hasUser: Boolean(user)
  });

  if (redirectDecision) {
    const url = request.nextUrl.clone();
    const destination = new URL(redirectDecision.destination, request.url);

    url.pathname = destination.pathname;
    url.search = destination.search;

    console.info("[auth-redirect]", {
      pathname: request.nextUrl.pathname,
      destination: `${url.pathname}${url.search}`,
      authStateCategory: redirectDecision.authStateCategory
    });

    return NextResponse.redirect(url);
  }

  return response;
}
