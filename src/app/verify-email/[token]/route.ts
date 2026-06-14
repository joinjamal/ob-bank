import { NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/parentTokens";

type Context = {
  params: Promise<{ token: string }>;
};

export async function GET(request: Request, context: Context) {
  const { token } = await context.params;
  await consumeEmailVerificationToken(decodeURIComponent(token));
  return NextResponse.redirect(new URL("/parent", request.url));
}
