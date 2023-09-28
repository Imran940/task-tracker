import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { summary, description, taskStartDate, taskEndDate, tokens } =
      await request.json();
    console.log(tokens);
    const auth = new google.auth.OAuth2();
    auth.setCredentials(tokens);
    const calendar = google.calendar({ version: "v3", auth });
    const event = {
      summary,
      description,
      start: {
        dateTime: taskStartDate,
        timeZone: "Asia/Kolkata",
      },
      end: {
        dateTime: taskEndDate,
        timeZone: "Asia/Kolkata",
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "popup", minutes: 60 * 24 },
          { method: "popup", minutes: 60 },
        ],
      },
      source: {
        title: "Task Tracker Application",
        url: process.env.NEXT_PUBLIC_HOST,
      },
    };
    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    // await createGoogleCalendarEvent(payload);
    return NextResponse.json({
      data: "Event created on the google calendar successfully",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      data: "Something happened wrong",
    });
  }
}
