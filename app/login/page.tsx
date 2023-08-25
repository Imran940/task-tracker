"use client";
import { account } from "@/appwrite";
import { auth, googleAuthProvider } from "@/firebase";
import { useUserStore } from "@/store/UserStore";
import { signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const defaultLoginValue = { email: "", password: "" };
function login() {
  const [loginData, setLoginData] = useState<{
    email: string;
    password: string;
  }>(defaultLoginValue);
  const router = useRouter();

  useEffect(() => {
    if (sessionStorage.getItem("isLogin")) router.push("/");
  }, []);
  const handleGoogleLogin = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (loginData.email || loginData.password) setLoginData(defaultLoginValue);
    signInWithPopup(auth, googleAuthProvider)
      .then((data) => {
        router.push("/");

        toast(`Welcome to tracker ${data.user.displayName}!`, {
          type: "success",
        });
      })
      .catch((err) => console.log(err));
  };

  const handleEmailLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!email || !password) return;
    signInWithEmailAndPassword(auth, email, password)
      .then((data) => console.log(data))
      .catch((err) => {
        console.log({ err });
        if (err.code == "auth/user-not-found") {
          toast("User is not found", { type: "error" });
        }
        toast("Something went wrong", { type: "error" });
      });
  };

  const { email, password } = loginData;
  return (
    <div className="p-2 w-full h-screen flex flex-col gap-5 md:gap-10 justify-center items-center bg-gradient-to-br from-pink-400 to-[#0055d1]">
      <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold">
        Welcome To Task Tracker
      </h2>
      <div className="w-full h-1/2 flex flex-col justify-between items-center bg-white p-6 lg:w-[40%] sm:w-1/2 rounded-lg">
        <div className="w-full">
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
            <input
              type="email"
              placeholder="Enter your email address"
              className="outline-none focus:border focus:border-blue-900 rounded-md p-2"
              onChange={(e) =>
                setLoginData((prevData) => ({
                  ...prevData,
                  [e.target.type]: e.target.value,
                }))
              }
              value={email}
              required
            />
            <input
              type="password"
              placeholder="Enter your password"
              className="outline-none focus:border focus:border-blue-900 rounded-md p-2"
              value={password}
              onChange={(e) =>
                setLoginData((prevData) => ({
                  ...prevData,
                  [e.target.type]: e.target.value,
                }))
              }
              required
            />
            <button
              type="submit"
              className="w-full rounded-md  text-white text-xl p-2 lette bg-blue-900 sm:w-1/2 mt-4"
            >
              Enter
            </button>
          </form>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="p-3 rounded-md uppercase border-2 w-full  lg:w-3/4 flex items-center justify-center gap-2"
        >
          <img src="/images/google.jpg" className="w-[10%]   object-contain" />
          <span>Sign With Gooogle</span>
        </button>
      </div>
    </div>
  );
}

export default login;
