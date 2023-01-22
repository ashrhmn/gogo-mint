import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.url.match("_next"))
    console.log(request.nextUrl.pathname + request.nextUrl.search);
  return NextResponse.next();
}
