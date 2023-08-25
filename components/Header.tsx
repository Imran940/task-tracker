"use client";

import { auth } from "@/firebase";
import { fetchSuggestion } from "@/lib/helpers";
import { useBoardStore } from "@/store/BoardStore";
import { useUserStore } from "@/store/UserStore";
import { MagnifyingGlassIcon } from "@heroicons/react/20/solid";
import { UserCircleIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Avatar from "react-avatar";
import { toast } from "react-toastify";

function Header() {
  const { setSearchString, searchString, board, allTasks } = useBoardStore(
    (state) => state
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [suggestion, setSuggestion] = useState<string>("");
  const {
    user: { name, profilePic },
  } = useUserStore((state) => state);

  useEffect(() => {
    //if (board.columns.size == 0) return;
    // setLoading(true);
    // (async () => {
    //   const suggestion = await fetchSuggestion(allTasks);
    //   setSuggestion(suggestion);
    //   setLoading(false);
    // })();
  }, [board]);

  return (
    <header>
      <div className="flex flex-col md:flex-row items-center p-5 bg-gray-500/10 rounded-b-2xl ">
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-br from-pink-400 to-[#0055d1] rounded-md filter blur-3xl opacity-50 -z-50" />
        <Image
          src="https://links.papareact.com/c2cdd5"
          alt="Trello logo"
          width={300}
          height={100}
          className="w-44 md:w-56 pb-10 md:pb-0 object-contain"
        />

        <div className="flex items-center space-x-5 flex-1 justify-end w-full">
          <span
            className="text-lg text-red-600 cursor-pointer"
            onClick={() => {
              auth.signOut();
              toast(`${name} logged out!.`);
            }}
          >
            Logout
          </span>
          <form className="flex items-center space-x-5 bg-white rounded-md p-2 shadow-md flex-1 md:flex-initial">
            <MagnifyingGlassIcon className="h-6 w-6 text-gray-400" />
            <input
              type="text"
              placeholder="Search.."
              className="flex-1 outline-none p-2"
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
            />
            <button type="submit" hidden>
              Search
            </button>
          </form>

          <Avatar
            {...(profilePic && { src: profilePic })}
            name={name!}
            round
            color="#0055d1"
            size="50"
          />
        </div>
      </div>

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
      </div>
    </header>
  );
}

export default Header;
