import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const { payload } = await request.json();
    const { email, message, subject } = payload;

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.NEXT_PUBLIC_GMAIL_USER,
        pass: process.env.NEXT_PUBLIC_GMAIL_KEY,
      },
    });

    const mailOptions = {
      from: process.env.NEXT_PUBLIC_GMAIL_USER,
      to: email,
      subject,
      html: message,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({
      data: "done",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      data: `something happend wrong`,
    });
  }
}
