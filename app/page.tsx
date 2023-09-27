"use client";

const DynamicBoard = dynamic(() => import("@/components/Board"), {
  ssr: false,
});
import { auth } from "@/firebase";
import { getGoolgeCalendarAuthUrl, getUserFromFirestore } from "@/lib/helpers";
import { useModalStore } from "@/store/ModalStore";
import { useUserStore } from "@/store/UserStore";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const { setUserData, setLogOut } = useUserStore((state) => state);
  const { toggleModal, setGoogleAuthUrl } = useModalStore((state) => state);
  const router = useRouter();

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setLogOut();
        router.push("/login");
        return;
      }

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
          if (!data.googleTokens) {
            const resp = await getGoolgeCalendarAuthUrl();
            setGoogleAuthUrl(resp?.data);
            toggleModal("showAuthModal");
          }

          if (data.googleTokens?.expiry_date < Date.now()) {
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
      }
    });
  }, []);

  return (
    <main>
      <DynamicBoard />
    </main>
  );
}
