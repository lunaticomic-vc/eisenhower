import { exchangeCodeForTokens, storeTokens } from "@/lib/calendar";
import { redirect } from "next/navigation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return Response.json({ error: "Missing code parameter" }, { status: 400 });
  }

  const tokens = await exchangeCodeForTokens(code);
  await storeTokens(tokens);
  redirect("/");
}
