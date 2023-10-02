import { ToastContainer } from "react-toastify";
import "./globals.css";
import "react-toastify/dist/ReactToastify.css";

export const metadata = {
  title: "Task Tracker",
  description:
    "Task tracker application for tracking, managing and collaborating",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-[#f5f6f8]">
        <>
          {children}
          <ToastContainer />
        </>
      </body>
    </html>
  );
}
