import { NextResponse } from "next/server";
import { createAuthConnectionToGoogle } from "../refresh_google_token/route";
import { NextApiRequest } from "next";
import { google } from "googleapis";

export async function GET(request: NextApiRequest) {
  try {
    const oAuth2Client = createAuthConnectionToGoogle();
    //@ts-expect-error ignore this check
    const { tokens } = await oAuth2Client.getToken(request.query.code);
    oAuth2Client.setCredentials(tokens);
    const people = google.people({ version: "v1", auth: oAuth2Client });
    const response = await people.people.get({
      resourceName: "people/me",
      personFields: "emailAddresses,names,photos",
    });
    const emailAddresses = response.data?.emailAddresses;
    if (emailAddresses?.length) {
    }
  } catch (err) {
    console.log(err);
    NextResponse.json({
      data: "Something happened wrong",
    });
  }
}
