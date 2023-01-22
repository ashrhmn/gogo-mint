import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  if (!request.url.match("_next"))
    console.log(request.nextUrl.pathname + request.nextUrl.search);

  console.log("cf-connecting-ip : ", request.headers.get("cf-connecting-ip"));
  console.log("cf-ipcountry : ", request.headers.get("cf-ipcountry"));

  return NextResponse.next();
}
