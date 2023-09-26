"use client";

import { auth } from "@/firebase";
import { useUserStore } from "@/store/UserStore";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import Image from "next/image";
import React from "react";
import Avatar from "react-avatar";
import { toast } from "react-toastify";
import InviteModal from "@/modals/InviteModal";
import { roleAccess } from "@/lib/helpers";
import { Popconfirm } from "antd";
import { useModalStore } from "@/store/ModalStore";

function Header() {
  // const [suggestion, setSuggestion] = useState<string>("");
  const {
    user: { name, email, profilePic, role, tasks },
    setSearchString,
    searchString,
  } = useUserStore((state) => state);
  const {
    inviteModalStates: { isOpen },
    setInviteModalState,
  } = useModalStore((state) => state);

  // useEffect(() => {
  //   //if (board.columns.size == 0) return;
  //   // setLoading(true);
  //   // (async () => {
  //   //   const suggestion = await fetchSuggestion(allTasks);
  //   //   setSuggestion(suggestion);
  //   //   setLoading(false);
  //   // })();

  // }, [board]);

  console.log({ isOpen });
  return (
    <header className="mb-10">
      {isOpen ? <InviteModal /> : null}
      <div className="flex flex-col md:flex-row items-center p-5 bg-gray-500/10 rounded-b-2xl ">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-pink-400 to-[#0055d1] rounded-md filter blur-3xl opacity-50 -z-50" />
        <Image
          src="https://asbtasktracker.com/wp-content/uploads/2022/01/tasktracker-logo-hor-green.png"
          alt="Trello logo"
          width={300}
          height={100}
          className="w-44 md:w-56 pb-10 md:pb-0 object-contain"
        />

        <div className="flex items-center space-x-5 flex-1 justify-end w-full">
          {roleAccess[role!]?.includes("invite") ? (
            <span
              onClick={() =>
                setInviteModalState({ isOpen: true, openType: "view" })
              }
              className="text-lg cursor-pointer"
            >
              Show Members
            </span>
          ) : null}

          <Popconfirm
            title="Are you sure that you want to logout?"
            okButtonProps={{
              style: { background: "rgb(37 99 235)" },
            }}
            onConfirm={async () => {
              await auth.signOut();
              toast(`${name ? name : email} logged out!.`);
            }}
          >
            <span className="text-lg text-red-600 cursor-pointer">Logout</span>
          </Popconfirm>

          <form className="flex items-center w-full md:w-[30%] space-x-2 bg-white rounded-md p-2 shadow-md flex-1 md:flex-initial">
            <MagnifyingGlassIcon className="h-[8%] w-[8%] text-gray-400" />
            <input
              type="text"
              placeholder="Search by task's title or assignee's name"
              className="flex-1 outline-none p-2"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value, tasks!)}
            />
            <button type="submit" hidden>
              Search
            </button>
          </form>

          <Avatar
            {...(profilePic && { src: profilePic })}
            name={name ? name : email?.split("@")[0]}
            round
            color="#0055d1"
            size="50"
          />
        </div>
      </div>

      {/* Reason- Because it was throwing limit error from openai api. trying to debug
       <div className="flex items-center justify-center px-5 md:py-5 py-2">
        <p className="flex items-center text-sm font-light pr-5 p-5  rounded-xl w-fit bg-white italic max-w-3xl text-[#0055d1] shadow-xl">
          <UserCircleIcon
            className={`inline-block h-10 w-10 mr-1 text-[#0055d1] ${
              loading ? "animate-spin" : ""
            }`}
          />
          {!loading && suggestion
            ? suggestion
            : "GPT is summarising your tasks for the day"}
        </p>
      </div> */}
    </header>
  );
}

export default Header;
