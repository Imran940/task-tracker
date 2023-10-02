import { updateUserInFirestore } from "@/lib/helpers";
import { google } from "googleapis";
import { NextResponse } from "next/server";

export const createAuthConnectionToGoogle = () =>
  new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_HOST}/google_callback`
  );

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log(payload);
    if (payload.email && payload.refreshToken) {
      const oAuth2Client = createAuthConnectionToGoogle();
      oAuth2Client.setCredentials({ refresh_token: payload.refreshToken });
      const response = await oAuth2Client.refreshAccessToken();
      console.log(response.credentials);

      await updateUserInFirestore(payload.email, {
        googleTokens: response.credentials,
      });
      return NextResponse.json({
        data: response.credentials,
      });
    } else {
      throw new Error(
        "Please pass expiry date of googleTokens and user's email"
      );
    }
  } catch (err) {
    console.log(err);

    return NextResponse.json({
      //@ts-expect-error ignore the err
      data: err.message ? err.message : "something happened wrong",
    });
  }
}
