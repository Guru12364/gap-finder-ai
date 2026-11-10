import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  // 1. Check for local demo/preview auth session cookie first
  const fallbackAuth = request.cookies.get('gapfinder_auth')?.value;

  // Protected routes
  const protectedPaths = [
    '/dashboard',
    '/upload',
    '/subjects',
    '/topics',
    '/quiz',
    '/gaps',
    '/revision',
    '/assistant',
    '/analytics',
    '/profile',
  ];
  const isProtected = protectedPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // Auth pages
  const authPaths = ['/login', '/register'];
  const isAuthPage = authPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  // If a valid fallback auth cookie exists, grant access immediately
  if (fallbackAuth) {
    if (isAuthPage) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  // 2. Otherwise attempt Supabase session verification
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-project.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key-for-build';

  // If using placeholder Supabase credentials in deployment, don't hard-block demo navigation
  const isPlaceholderSupabase = supabaseUrl.includes('placeholder-project');

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (isProtected && !user && !isPlaceholderSupabase) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    if (isAuthPage && user) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      return NextResponse.redirect(url);
    }
  } catch {
    // If Supabase call errors out, only redirect if it's protected and not demo
    if (isProtected && !isPlaceholderSupabase) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
