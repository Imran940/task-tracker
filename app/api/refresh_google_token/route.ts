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
    const { payload } = await request.json();
    if (payload.expiry_data && payload.email) {
      const oAuth2Client = createAuthConnectionToGoogle();
      //@ts-expect-error tokens will be there
      const { tokens } = await oAuth2Client.refreshAccessToken();
      await updateUserInFirestore(payload.email, { googleTokens: tokens });
      return NextResponse.json({
        data: tokens,
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
