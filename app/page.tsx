"use client";

const DynamicBoard = dynamic(() => import("@/components/Board"), {
  ssr: false,
});
import { auth } from "@/firebase";
import { getUserFromFirestore, refreshGoogleTokens } from "@/lib/helpers";
import { useUserStore } from "@/store/UserStore";
import { Spin } from "antd";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const { setUserData, setLogOut } = useUserStore((state) => state);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLogOut();
        router.push("/login");
        return;
      }
      setLoading(true);

      const data = await getUserFromFirestore(user?.email!);
      if (!data) {
        await auth.signOut();
        setLogOut();
        router.push("/login");
      } else if (user) {
        // //check for invitedBy field
        let ownerUser;
        if (data.invitedBy) {
          ownerUser = await getUserFromFirestore(data.invitedBy);
        }

        try {
          if (
            data.googleTokens?.expiry_date < Date.now() &&
            data.googleTokens?.refresh_token
          ) {
            const refreshGoogleResp = await refreshGoogleTokens(
              data.email,
              data.googleTokens.refresh_token
            );
            //@ts-expect-error ignore this refreshGoogleResp
            setUserData({ googleTokens: refreshGoogleResp.data });
          }
        } catch (err) {
          console.log(err);
          toast("Something happened wrong", { type: "error" });
        }

        const userData = {
          name: user.displayName ? user.displayName : data?.name,
          email: user.email,
          emailVerified: user.emailVerified,
          //@ts-expect-error accessToken will be there and checked it
          accessToken: user.accessToken,
          profilePic: user.photoURL,
          ...data,
          ...(data?.tasks?.length
            ? {
                tasks: data?.tasks,
              }
            : ownerUser?.tasks.length && {
                tasks: ownerUser.tasks,
              }),
        };
        setUserData(userData);
        setLoading(false);
      }
    });
  }, []);

  return (
    <main>
      {loading ? (
        <Spin tip="Please wait for a sec">
          <div className="w-full h-screen flex items-center justify-center" />
        </Spin>
      ) : (
        <DynamicBoard />
      )}
    </main>
  );
}
