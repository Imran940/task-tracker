import { NextResponse } from "next/server";
import { createAuthConnectionToGoogle } from "../refresh_google_token/route";
import { google } from "googleapis";
import { updateUserInFirestore } from "@/lib/helpers";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const oAuth2Client = createAuthConnectionToGoogle();
    const { tokens } = await oAuth2Client.getToken(payload?.code);
    oAuth2Client.setCredentials(tokens);
    const people = google.people({ version: "v1", auth: oAuth2Client });
    const response = await people.people.get({
      resourceName: "people/me",
      personFields: "emailAddresses,names,photos",
    });
    const emailAddresses = response.data?.emailAddresses;
    if (emailAddresses?.length) {
      const email = emailAddresses[0].value;
      if (email) await updateUserInFirestore(email, { googleTokens: tokens });
    }
    return NextResponse.json({
      data: tokens,
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      data: "Something happened wrong",
    });
  }
}
