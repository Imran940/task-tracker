"use client";

import { auth, googleAuthProvider } from "@/firebase";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  sendSignInLinkToEmail,
  signInWithEmailLink,
  updatePassword,
  User,
  sendPasswordResetEmail,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/solid";
import {
  createUserInFirestore,
  getUserFromFirestore,
  isValidEmail,
  updateUserInFirestore,
} from "@/lib/helpers";
import { Button } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { parse } from "url";
import { InvitedUserType, userType } from "@/typings";
import { useUserStore } from "@/store/UserStore";
import Image from "next/image";

const defaultLoginValue = { email: "", password: "" };
let storedName: string | null;

export default function Page() {
  const [loginData, setLoginData] = useState<{
    name?: string | null;
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
    googleLoading: boolean;
  }>({
    loginLoading: false,
    registerLoading: false,
    resetLoading: false,
    googleLoading: false,
  });
  const [showInvitedView, setShowInvitedView] = useState(false);
  const { email, password, name } = loginData;
  const { loginLoading, registerLoading, resetLoading, googleLoading } =
    loadingState;
  const { setLogOut } = useUserStore((state) => state);

  const params =
    typeof document !== "undefined" &&
    typeof location != "undefined" &&
    location.search
      ? parse(location.search, true)
      : null;
  const { ownerEmail, userEmail } = params?.query || {};

  const checkUserBlockOrNot = async (email: string | null) => {
    if (!email) return;

    const data = await getUserFromFirestore(email);
    if (!data) return;

    try {
      //check for invitedBy field
      let ownerUser;
      if (data.invitedBy) {
        ownerUser = await getUserFromFirestore(data.invitedBy);
      }

      if (!ownerUser && data?.role != "owner") {
        await auth.signOut();
        toast(
          "You're no longer associate with any project. Kindly contact the owner of the project"
        );
        return "not-exist";
      }

      if (ownerUser && data?.status == "block") {
        await auth.signOut();
        toast("You have been blocked by the owner of the project");
        return "blocked";
      }
      return "success";
    } catch (err) {
      console.log(err);
      toast("something happened wrong", { type: "error" });
    }
  };

  useEffect(() => {
    if (sessionStorage.getItem("isLogin")) {
      router.push("/");
      return;
    }
    let storedEmail = "";
    let actionMode = "";
    if (typeof window !== "undefined" && window.localStorage) {
      storedEmail = localStorage.getItem("email")!;
      actionMode = localStorage.getItem("actionMode")!;
      storedName = localStorage.getItem("name");
    }
    if (storedEmail && actionMode == "register") {
      if (params?.query.apiKey) {
        (async () => {
          try {
            const result = await signInWithEmailLink(auth, storedEmail);
            setUser(result?.user);
            setLoginData((prevVaue) => ({
              ...prevVaue,
              email: storedEmail,
              name: storedName,
            }));
            if (result.user.emailVerified) {
              setIsEmailVerified(true);
            }
          } catch (err) {
            console.log(err);
            toast("Something happened wrong, try again later", {
              type: "error",
            });
          }
        })();
      }
    } else if (storedEmail) {
      // password reset
      setLoginData((prevVaue) => ({ ...prevVaue, email: storedEmail }));
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.clear();
      }

      setShowSignUp(false);
    } else if (ownerEmail && userEmail) {
      setShowInvitedView(true);
    }
  }, []);

  const handleGoogleLogin = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (googleLoading) return;

    if (loginData.email || loginData.password) setLoginData(defaultLoginValue);
    setLoadingState((prevValues) => ({
      ...prevValues,
      googleLoading: true,
    }));
    signInWithPopup(auth, googleAuthProvider)
      .then(async (data) => {
        const userData = await getUserFromFirestore(data.user.email!);
        if (!userData) {
          await createUserInFirestore({
            email: data.user.email!,
            name: data.user.displayName!,
            role: "owner",
            signupMethods: ["google"],
            status: "active",
            googleTokens: null,
          });
        }
        if (userData && !userData.signupMethods.includes("google")) {
          await updateUserInFirestore(data.user.email!, {
            signupMethods: [...userData.signupMethods, "google"],
          });
        }

        const respone = await checkUserBlockOrNot(userData?.email);
        if (respone == "success") {
          toast(`Welcome to tracker ${data.user.displayName}!`, {
            type: "success",
          });
          router.push("/");
        }
        setLoadingState((prevValues) => ({
          ...prevValues,
          googleLoading: false,
        }));
      })
      .catch((err) => {
        console.log(err);
        setLoadingState((prevValues) => ({
          ...prevValues,
          googleLoading: false,
        }));
        toast("Something happened wrong", { type: "error" });
      });
  };

  const handleEmailLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (registerLoading || loginLoading) return;

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

        // saving user in the firestore
        const userData = await getUserFromFirestore(user.email!);
        if (userData) {
          await updateUserInFirestore(user.email!, {
            signupMethods: [...userData.signupMethods, "email"],
          });
        } else {
          await createUserInFirestore({
            email: user.email!,
            name: storedName!,
            role: "owner",
            signupMethods: ["email"],
            status: "active",
            googleTokens: null,
          });
        }

        toast("Account created successfully", { type: "success" });
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.clear();
        }

        router.push("/");
      } else if (showSignUp && !showInvitedView) {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem("email", email);
          localStorage.setItem("name", name!);
          localStorage.setItem("actionMode", "register");
        }
        const userData = await getUserFromFirestore(email);
        if (userData?.signupMethods.includes("email")) {
          toast(`User already exist with this Email-${email}`);
          setLoadingState((prevLoading) => ({
            ...prevLoading,
            ...(showSignUp
              ? { registerLoading: false }
              : { loginLoading: false }),
          }));
          if (typeof window !== "undefined" && window.localStorage) {
            localStorage.clear();
          }

          return;
        }
        await sendSignInLinkToEmail(auth, email, {
          handleCodeInApp: true,
          url: `${process.env.NEXT_PUBLIC_HOST}/login`,
        });
        toast("Send Register Confirmation Link to your email address", {
          type: "success",
        });
      } else if (showInvitedView && ownerEmail) {
        //@ts-expect-error ignore ownerEmail array check because I've checked it's coming as string
        const userData = await getUserFromFirestore(ownerEmail);
        if (!userData) {
          toast(`Project not found by this email - ${ownerEmail}`, {
            type: "error",
          });
          setLoadingState((prevLoading) => ({
            ...prevLoading,
            ...(showSignUp
              ? { registerLoading: false }
              : { loginLoading: false }),
          }));
          return;
        }
        const invitedUserIndex = userData.invitedUsers.findIndex(
          (i: InvitedUserType) => i.email == userEmail
        );
        if (invitedUserIndex == -1) {
          toast(`No owner has invited you to the project`, {
            type: "error",
          });
          setLoadingState((prevLoading) => ({
            ...prevLoading,
            ...(showSignUp
              ? { registerLoading: false }
              : { loginLoading: false }),
          }));
          return;
        }

        if (userEmail) {
          //@ts-expect-error ignore userEmail array check because I've checked it's coming as string
          const isInvitedUserFound = await getUserFromFirestore(userEmail);
          if (isInvitedUserFound) {
            toast(`User already created with Email- ${userEmail}`);
            setLoadingState((prevLoading) => ({
              ...prevLoading,
              ...(showSignUp
                ? { registerLoading: false }
                : { loginLoading: false }),
            }));
            return;
          }
        }

        if (userData.invitedUsers[invitedUserIndex]?.email == userEmail) {
          //creating user in auth and firestore
          //@ts-expect-error ignore userEmail array check because I've checked it's coming as string
          await createUserWithEmailAndPassword(auth, userEmail!, password);
          await createUserInFirestore({
            email: userData.invitedUsers[invitedUserIndex].email,
            role: userData.invitedUsers[invitedUserIndex].role,
            name: name!,
            signupMethods: ["email"],
            invitedBy: userData?.email,
            status: "active",
            googleTokens: null,
          });

          //updating status in the owner invitedUsers array
          let invitedUsers = [...userData.invitedUsers];
          invitedUsers[invitedUserIndex].status = "active";
          invitedUsers[invitedUserIndex].name = name;
          await updateUserInFirestore(userData?.email, { invitedUsers });
          toast(`Account created successfully :)`);
          router.push("/");
        }
      } else {
        if (!email || !password) return;
        const result = await signInWithEmailAndPassword(auth, email, password);
        const response = await checkUserBlockOrNot(email);

        if (response == "success") {
          router.push("/");
          toast(
            `Welcome ${
              result.user.displayName
                ? result.user.displayName
                : result.user.email
            } `
          );
        }
      }

      setLoadingState((prevLoading) => ({
        ...prevLoading,
        ...(showSignUp ? { registerLoading: false } : { loginLoading: false }),
      }));
    } catch (err) {
      console.log({ err });
      //@ts-expect-error ignore this err object it's working fine
      if (err.code == "auth/user-not-found") {
        toast("User is not found", { type: "error" });
        //@ts-expect-error ignore this err object it's working fine
      } else if (err.code == "auth/wrong-password") {
        toast("Incorrect Password", { type: "error" });
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
      {showSignUp || showInvitedView ? (
        <input
          name="name"
          type="text"
          pattern=".{5,}"
          title="Please enter name containing 5 or more characters"
          placeholder="Enter your name"
          className="outline-none border-2 focus:border focus:border-blue-900 rounded-md p-2"
          onChange={(e) =>
            setLoginData((prevData) => ({
              ...prevData,
              [e.target.name]: e.target.value,
            }))
          }
          value={name!}
          required
        />
      ) : null}
      <input
        type="email"
        placeholder="Enter your email address"
        className={`outline-none border-2 focus:border focus:border-blue-900 rounded-md p-2 ${
          userEmail && "cursor-not-allowed"
        }`}
        onChange={(e) =>
          setLoginData((prevData) => ({
            ...prevData,
            [e.target.type]: e.target.value,
          }))
        }
        value={email || userEmail}
        {...(userEmail && {
          disabled: true,
        })}
        required
      />
      <div className="w-full relative">
        <input
          name="password"
          type={toggle ? "text" : "password"}
          placeholder={
            !isEmailVerified && showSignUp && !showInvitedView
              ? "Verify your email first"
              : "Enter your password"
          }
          className={`password w-full outline-none border-2 focus:border focus:border-blue-900 rounded-md p-2 ${
            !isEmailVerified && showSignUp && !showInvitedView
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
          {...(showSignUp &&
            !showInvitedView && {
              disabled: !isEmailVerified,
              title: !isEmailVerified
                ? "Click on the register button with name and email, verify your email address first then password will be enabled"
                : "Please Enter 6 or more characters password",
            })}
          required={showSignUp && !isEmailVerified ? false : true}
        />
        {!showSignUp && !showInvitedView ? (
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
                  if (typeof window !== "undefined" && window.localStorage) {
                    localStorage.setItem("email", email);
                  }

                  setLoadingState((prevLoading) => ({
                    ...prevLoading,
                    resetLoading: false,
                  }));
                } catch (err) {
                  console.log({ err });
                  //@ts-expect-error ignore this err object it's working fine
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
          <form onSubmit={handleEmailLogin} className="flex flex-col gap-3">
            {formContent}

            <div className="flex justify-between items-center">
              <Button
                htmlType="submit"
                className="w-full rounded-md h-fit text-white text-xl p-2 lette bg-blue-900 sm:w-1/2 mt-4 hover:text-inherit"
                title={
                  showSignUp && !showInvitedView
                    ? "Will send signup link to your given email address"
                    : ""
                }
                loading={showSignUp ? registerLoading : loginLoading}
              >
                {showSignUp ? "Register" : "Login"}
              </Button>
              {!showInvitedView ? (
                <span
                  onClick={() => setShowSignUp((prevState) => !prevState)}
                  className="text-sm text-blue-500 cursor-pointer font-medium"
                >
                  {showSignUp ? "Go To Login" : "Wanna SignUp?"}
                </span>
              ) : null}
            </div>
          </form>
        </div>

        {!showInvitedView ? (
          <button
            onClick={handleGoogleLogin}
            className="p-3 rounded-md uppercase border-2 w-full  lg:w-3/4 flex items-center justify-center gap-2"
          >
            <Image
              alt="google-logo"
              width={50}
              height={50}
              src="/images/google.jpg"
              className="w-[10%]   object-contain"
            />
            {googleLoading ? (
              <>
                Loading <LoadingOutlined />{" "}
              </>
            ) : (
              <span>Sign With Gooogle</span>
            )}
          </button>
        ) : null}
      </div>
    </div>
  );
}
