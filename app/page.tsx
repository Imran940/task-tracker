"use client";
import Board from "@/components/Board";
import { auth } from "@/firebase";
import { getUserFromFirestore } from "@/lib/helpers";
import { useUserStore } from "@/store/UserStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { setUserData, setLogOut } = useUserStore((state) => state);
  const router = useRouter();

  useEffect(() => {
    auth.onAuthStateChanged(async (user) => {
      const data = await getUserFromFirestore(user?.email!);
      if (!data) {
        await auth.signOut();
        setLogOut();
        router.push("/login");
      } else if (user) {
        //check for invitedBy field
        let ownerUser;
        if (data.invitedBy) {
          ownerUser = await getUserFromFirestore(data.invitedBy);
        }

        // if(!ownerUser &&  data?.role=="viewer"){

        // }

        const userData = {
          name: user.displayName ? user.displayName : data?.name,
          email: user.email,
          emailVerified: user.emailVerified,
          //@ts-expect-error accessToken will be there and checked it
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