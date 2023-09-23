"use client";
import { account } from "@/appwrite";
import { auth, db, googleAuthProvider } from "@/firebase";
import { useUserStore } from "@/store/UserStore";
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
import { collection, getDoc, where, setDoc, doc } from "firebase/firestore";
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
import { userType } from "@/typings";

const defaultLoginValue = { email: "", password: "" };
function Login() {
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
  }>({ loginLoading: false, registerLoading: false, resetLoading: false });
  const [showInvitedView, setShowInvitedView] = useState(false);
  const { email, password, name } = loginData;
  const { loginLoading, registerLoading, resetLoading } = loadingState;
  const storedName = localStorage.getItem("name");
  const params = parse(window.location.search, true);
  const { ownerEmail, userEmail } = params.query || {};

  useEffect(() => {
    if (sessionStorage.getItem("isLogin")) {
      router.push("/");
      return;
    }
    const storedEmail = localStorage.getItem("email");
    const actionMode = localStorage.getItem("actionMode");

    if (storedEmail && actionMode == "register") {
      if (params.query.apiKey) {
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
      localStorage.clear();
      setShowSignUp(false);
    } else if (ownerEmail && userEmail) {
      setShowInvitedView(true);
    }
  }, []);
  const handleGoogleLogin = (
    e: React.MouseEvent<HTMLButtonElement, MouseEvent>
  ) => {
    e.preventDefault();
    if (loginData.email || loginData.password) setLoginData(defaultLoginValue);
    signInWithPopup(auth, googleAuthProvider)
      .then(async (data) => {
        const userData = await getUserFromFirestore(data.user.email!);
        if (!userData) {
          await createUserInFirestore({
            email: data.user.email!,
            name: data.user.displayName!,
            role: "owner",
            signupMethods: ["google"],
          });
        }
        if (userData && !userData.signupMethods.includes("google")) {
          updateUserInFirestore(data.user.email!, {
            signupMethods: [...userData.signupMethods, "google"],
          });
        }

        toast(`Welcome to tracker ${data.user.displayName}!`, {
          type: "success",
        });
        router.push("/");
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
        // saving user in the firestore
        const userData = await getUserFromFirestore(user.email!);
        if (userData) {
          updateUserInFirestore(user.email!, {
            signupMethods: [...userData.signupMethods, "email"],
          });
        } else {
          await createUserInFirestore({
            email: user.email!,
            name: storedName!,
            role: "owner",
            signupMethods: ["email"],
          });
        }

        toast("password set successfullyt", { type: "success" });
        localStorage.clear();
        router.push("/");
      } else if (showSignUp && !showInvitedView) {
        localStorage.setItem("email", email);
        localStorage.setItem("name", name!);
        localStorage.setItem("actionMode", "register");

        const userData = await getUserFromFirestore(email);
        if (userData?.signupMethods.includes("email")) {
          toast(`User already exist with this Email-${email}`);
          setLoadingState((prevLoading) => ({
            ...prevLoading,
            ...(showSignUp
              ? { registerLoading: false }
              : { loginLoading: false }),
          }));
          localStorage.clear();
          return;
        }
        await sendSignInLinkToEmail(auth, email, {
          handleCodeInApp: true,
          url: `${process.env.NEXT_PUBLIC_HOST}/login`,
        });
        toast("Send Register Confirmation Link to your email address", {
          type: "success",
        });
      } else if (showInvitedView) {
        const userData = await getUserFromFirestore(ownerEmail!);
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
          (i) => i.email == userEmail
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

        const isInvitedUserFound = await getUserFromFirestore(userEmail!);
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
        if (userData.invitedUsers[invitedUserIndex]?.email == userEmail) {
          //creating user in auth and firestore
          await createUserWithEmailAndPassword(auth, userEmail!, password);
          await createUserInFirestore({
            email: userData.invitedUsers[invitedUserIndex].email,
            role: userData.invitedUsers[invitedUserIndex].role,
            name: name!,
            signupMethods: ["email"],
            invitedBy: userData?.email,
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
          placeholder="Enter your password"
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
                ? "Enter and Verify Your Email Address."
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
            <img
              src="/images/google.jpg"
              className="w-[10%]   object-contain"
            />
            <span>Sign With Gooogle</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default Login;
