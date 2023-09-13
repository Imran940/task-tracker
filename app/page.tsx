"use client";
import Board from "@/components/Board";
import Header from "@/components/Header";
import { auth } from "@/firebase";
import { useUserStore } from "@/store/UserStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { setUserData, setLogOut } = useUserStore((state) => state);
  const router = useRouter();
  useEffect(() => {
    auth.onAuthStateChanged((user) => {
      console.log({ user });
      if (user) {
        setUserData({
          name: user.displayName,
          email: user.email,
          emailVerified: user.emailVerified,
          accessToken: user.accessToken,
          profilePic: user.photoURL,
        });
      } else {
        setLogOut();
        router.push("/login");
      }
    });
  }, []);
  return (
    <main>
      <Board />
    </main>
  );
}