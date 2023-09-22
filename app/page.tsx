"use client";
import Board from "@/components/Board";
import Header from "@/components/Header";
import { auth } from "@/firebase";
import { getUserFromFirestore } from "@/lib/helpers";
import { useBoardStore } from "@/store/BoardStore";
import { useUserStore } from "@/store/UserStore";
import { userType } from "@/typings";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";

export default function Home() {
  const { setUserData, setLogOut, isUserLogin } = useUserStore(
    (state) => state
  );
  // const { getBoard } = useBoardStore((state) => state);
  const router = useRouter();

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      const data = await getUserFromFirestore(user?.email!);
      if (!data) {
        //deleting the user from auth because user doesn't found in the firebase firestore
        await auth.signOut();
        setLogOut();
        router.push("/login");
      } else if (user) {
        //check for invitedBy field
        let ownerUser;
        if (data.invitedBy) {
          ownerUser = await getUserFromFirestore(data.invitedBy);
        }
        const userData = {
          name: user.displayName ? user.displayName : data?.name,
          email: user.email,
          emailVerified: user.emailVerified,
          accessToken: user.accessToken,
          profilePic: user.photoURL,
          ...(data?.role && { role: data?.role }),
          ...(data?.invitedUsers?.length && {
            invitedUsers: data?.invitedUsers,
          }),
          ...(data?.tasks?.length
            ? {
                tasks: data?.tasks,
              }
            : ownerUser?.tasks.length && {
                tasks: ownerUser.tasks,
              }),
        };
        setUserData(userData);
        //getBoard(userData.tasks);
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