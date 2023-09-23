import { NextResponse } from "next/server";

const nodemailer = require("nodemailer");

export async function POST(request: Request) {
  try {
    const { payload } = await request.json();
    console.log(payload);
    const { name, role, fromEmail, toEmail, ownerName, message } = payload;

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
      to: toEmail,
      subject: "Invitation of task management application",
      html: message
        ? message
        : `Hey <b>${name}</b>, ${ownerName} the owner of the task management application is requesting you to visit their project by clicking the below link and You got the role of <b>${role}</b><br/>
    <a href=${process.env.NEXT_PUBLIC_HOST}/login/?ownerEmail=${fromEmail}&userEmail=${toEmail}>Click here to go to project</a>`,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({
      data: !message
        ? `Invitation email sent successfully to ${toEmail}`
        : "Member Updated successfully",
    });
  } catch (err) {
    console.log(err);
    return NextResponse.json({
      data: `something happend wrong`,
    });
  }
}
