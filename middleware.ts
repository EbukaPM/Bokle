import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const ACCESS_SECRET = new TextEncoder().encode(process.env.JWT_ACCESS_SECRET || "dev-access-secret-change-me");

const PROTECTED_PREFIXES = ["/dashboard", "/requests", "/check-am", "/jobs", "/wallet", "/messages", "/notifications", "/profile", "/subjects"];
const ADMIN_PREFIX = "/admin";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  const isAdmin = pathname.startsWith(ADMIN_PREFIX);

  if (!isProtected && !isAdmin) return NextResponse.next();

  const token = req.cookies.get("bokle_access")?.value;
  if (!token) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    if (isAdmin && !payload.isAdmin) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
    return NextResponse.next();
  } catch {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/requests/:path*", "/check-am/:path*", "/jobs/:path*", "/wallet/:path*", "/messages/:path*", "/notifications/:path*", "/profile/:path*", "/subjects/:path*", "/admin/:path*"],
};
