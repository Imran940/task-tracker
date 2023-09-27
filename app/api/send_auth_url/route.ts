import { NextResponse } from "next/server";
import { createAuthConnectionToGoogle } from "../refresh_google_token/route";

export async function GET() {
  try {
    const auth = createAuthConnectionToGoogle();
    const authUrl = auth.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar.events",
        "profile",
        "https://www.googleapis.com/auth/userinfo.email",
      ],
    });
    return NextResponse.json({
      data: authUrl,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      //@ts-expect-error ignore the err
      data: err.message ? err.message : "something happened wrong",
    });
  }
}
