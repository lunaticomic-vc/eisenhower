import { google } from "googleapis";
import { cookies } from "next/headers";

const SCOPES = ["https://www.googleapis.com/auth/calendar.events"];
const TOKEN_COOKIE = "gcal_tokens";

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

export function getAuthUrl(): string {
  const auth = createOAuth2Client();
  return auth.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  });
}

export async function exchangeCodeForTokens(code: string) {
  const auth = createOAuth2Client();
  const { tokens } = await auth.getToken(code);
  return tokens;
}

export async function storeTokens(tokens: object) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE, JSON.stringify(tokens), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}

export async function getAuthenticatedClient() {
  const cookieStore = await cookies();
  const tokenCookie = cookieStore.get(TOKEN_COOKIE);
  if (!tokenCookie) return null;

  const tokens = JSON.parse(tokenCookie.value);
  const auth = createOAuth2Client();
  auth.setCredentials(tokens);
  return auth;
}

export async function createCalendarEvent(
  title: string,
  description: string,
  deadline: string
) {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Not authenticated with Google Calendar");

  const calendar = google.calendar({ version: "v3", auth });
  const response = await calendar.events.insert({
    calendarId: "primary",
    requestBody: {
      summary: title,
      description,
      start: { date: deadline.substring(0, 10) },
      end: { date: deadline.substring(0, 10) },
    },
  });
  return response.data.id ?? null;
}

export async function updateCalendarEvent(
  eventId: string,
  title: string,
  description: string,
  deadline: string
) {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Not authenticated with Google Calendar");

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.patch({
    calendarId: "primary",
    eventId,
    requestBody: {
      summary: title,
      description,
      start: { date: deadline.substring(0, 10) },
      end: { date: deadline.substring(0, 10) },
    },
  });
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = await getAuthenticatedClient();
  if (!auth) throw new Error("Not authenticated with Google Calendar");

  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({ calendarId: "primary", eventId });
}
