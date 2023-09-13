"use client";
import { account } from "@/appwrite";
import { auth, googleAuthProvider } from "@/firebase";
import { useUserStore } from "@/store/UserStore";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updatePassword,
  User,
  sendPasswordResetEmail,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import { isValidEmail } from "@/lib/helpers";
import { Button } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

const defaultLoginValue = { email: "", password: "" };
function login() {
  const [loginData, setLoginData] = useState<{
    email: string;
    password: string;
  }>(defaultLoginValue);
  const router = useRouter();
  const [toggle, setToggle] = useState(false);
  const [showSignUp, setShowSignUp] = useState(true);
  const [isEmailVerified, setIsEmailVerified] = useState(false);
  const [user, setUser] = useState<User>();
  const [loadingState, setLoadingState] = useState<{
    loginLoading: boolean;
    resetLoading: boolean;
    registerLoading: boolean;
  }>({ loginLoading: false, registerLoading: false, resetLoading: false });
  const { email, password } = loginData;
  const { loginLoading, registerLoading, resetLoading } = loadingState;

  useEffect(() => {
    if (sessionStorage.getItem("isLogin")) {
      router.push("/");
      return;
    }
    const storedEmail = localStorage.getItem("email");
    const actionMode = localStorage.getItem("actionMode");

    if (storedEmail && actionMode == "register") {
      (async () => {
        try {
          const result = await signInWithEmailLink(auth, storedEmail);
          setUser(result?.user);
          if (result.user.emailVerified) {
            setIsEmailVerified(true);
            localStorage.clear();
          }
        } catch (err) {
          console.log(err);
          toast("Something happened wrong, try again later", { type: "error" });
        }
      })();
    }

    if (storedEmail) {
      setLoginData((prevVaue) => ({ ...prevVaue, email: storedEmail }));
      localStorage.clear();
      setShowSignUp(false);
    }
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

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      setLoadingState((prevLoading) => ({
        ...prevLoading,
        ...(showSignUp ? { registerLoading: true } : { loginLoading: true }),
      }));

      if (showSignUp && isEmailVerified && password && user) {
        if (password.length < 6) {
          toast("Password length should be equal or more than 6 characters", {
            type: "error",
          });
          return;
        }
        await updatePassword(user, password);
        toast("password set successfullyt", { type: "success" });
        router.push("/");
      } else if (showSignUp) {
        localStorage.setItem("email", email);
        localStorage.setItem("actionMode", "register");
        await sendSignInLinkToEmail(auth, email, {
          handleCodeInApp: true,
          url: `${process.env.NEXT_PUBLIC_HOST}/login`,
        });
        toast("Send Register Confirmation Link to your email address", {
          type: "success",
        });
      } else {
        if (!email || !password) return;
        const result = await signInWithEmailAndPassword(auth, email, password);
        router.push("/");
        toast(
          `Welcome ${
            result.user.displayName
              ? result.user.displayName
              : result.user.email
          } `
        );
      }

      setLoadingState((prevLoading) => ({
        ...prevLoading,
        ...(showSignUp ? { registerLoading: false } : { loginLoading: false }),
      }));
    } catch (err) {
      console.log({ err });
      if (err.code == "auth/user-not-found") {
        toast("User is not found", { type: "error" });
      } else {
        toast("Something went wrong", { type: "error" });
      }
      setLoadingState((prevLoading) => ({
        ...prevLoading,
        ...(showSignUp ? { registerLoading: false } : { loginLoading: false }),
        resetLoading: false,
      }));
    }
  };
  const handleToggle = () => setToggle((prevState) => !prevState);
  const formContent = (
    <>
      <input
        type="email"
        placeholder="Enter your email address"
        className="outline-none border-2 focus:border focus:border-blue-900 rounded-md p-2"
        onChange={(e) =>
          setLoginData((prevData) => ({
            ...prevData,
            [e.target.type]: e.target.value,
          }))
        }
        value={email}
        required
      />
      <div className="w-full relative">
        <input
          name="password"
          type={toggle ? "text" : "password"}
          placeholder="Enter your password"
          className={`password w-full outline-none border-2 focus:border focus:border-blue-900 rounded-md p-2 ${
            !isEmailVerified && showSignUp
              ? "cursor-not-allowed"
              : "cursor-default"
          }`}
          value={password}
          pattern=".{6,}"
          onChange={(e) =>
            setLoginData((prevData) => ({
              ...prevData,
              [e.target.name]: e.target.value,
            }))
          }
          {...(showSignUp && {
            disabled: !isEmailVerified,
            title: !isEmailVerified
              ? "Enter and Verify Your Email Address."
              : "Please Enter 6 or more characters password",
          })}
          required={showSignUp && !isEmailVerified ? false : true}
        />
        {!showSignUp ? (
          <span
            className={`relative text-sm text-blue-600 top-2 ${
              !isValidEmail(email) ? "cursor-not-allowed" : "cursor-pointer"
            } font-medium ${!isValidEmail(email) && "opacity-70"}`}
            title={
              !isValidEmail(email)
                ? "Enter your email address to enable it"
                : ""
            }
            onClick={async () => {
              if (isValidEmail(email) && !resetLoading) {
                try {
                  setLoadingState((prevLoading) => ({
                    ...prevLoading,
                    resetLoading: true,
                  }));
                  await sendPasswordResetEmail(auth, email, {
                    url: `${process.env.NEXT_PUBLIC_HOST}/login`,
                    handleCodeInApp: true,
                  });
                  toast(`Sent the password reset link to your ${email}`);
                  localStorage.setItem("email", email);
                  setLoadingState((prevLoading) => ({
                    ...prevLoading,
                    resetLoading: false,
                  }));
                } catch (err) {
                  console.log({ err });
                  if (err?.code == "auth/user-not-found") {
                    toast(`User doesn't found with this Email: ${email}`, {
                      type: "error",
                    });
                  } else {
                    toast(`Something went wrong, try again later`, {
                      type: "error",
                    });
                  }
                  setLoadingState((prevLoading) => ({
                    ...prevLoading,
                    resetLoading: false,
                  }));
                }
              }
            }}
          >
            Reset your password {resetLoading ? <LoadingOutlined /> : null}
          </span>
        ) : null}
        {password ? (
          !toggle ? (
            <EyeSlashIcon
              width={25}
              className="absolute right-5 top-2 cursor-pointer"
              onClick={handleToggle}
            />
          ) : (
            <EyeIcon
              width={25}
              className="absolute right-5 top-2 cursor-pointer"
              onClick={handleToggle}
            />
          )
        ) : null}
      </div>
    </>
  );

  return (
    <div className="p-2 w-full h-screen flex flex-col gap-5 md:gap-10 justify-center items-center bg-gradient-to-br from-pink-400 to-[#0055d1]">
      <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold">
        Welcome To Task Tracker
      </h2>
      <div className="w-full h-1/2 flex flex-col justify-between items-center bg-white p-6 lg:w-[40%] sm:w-1/2 rounded-lg">
        <div className="w-full">
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-5">
            {formContent}

            <div className="flex justify-between items-center">
              <Button
                htmlType="submit"
                className="w-full rounded-md h-fit text-white text-xl p-2 lette bg-blue-900 sm:w-1/2 mt-4 hover:text-inherit"
                title={
                  showSignUp
                    ? "Will send signup link to your given email address"
                    : ""
                }
                loading={showSignUp ? registerLoading : loginLoading}
              >
                {showSignUp
                  ? "Submit"
                  : showSignUp && isEmailVerified
                  ? "Register"
                  : "Login"}
              </Button>
              <span
                onClick={() => setShowSignUp((prevState) => !prevState)}
                className="text-sm text-blue-500 cursor-pointer font-medium"
              >
                {showSignUp ? "Go To Login" : "Wanna SignUp?"}
              </span>
            </div>
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
