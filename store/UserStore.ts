import { Board, ProjectRole, Todo, defaultUserType, userType } from "@/typings";
import { UUID } from "crypto";
import { create } from "zustand";
import { groupTasksByStatus } from "@/lib/helpers";
interface UserDetailsState {
  name: string | null;
  email: string | null;
  accessToken: string | null;
  emailVerified: boolean;
  profilePic?: string | null;
  role?: ProjectRole;
  invitedUsers?: (defaultUserType & {
    id: UUID;
    status: "pending" | "active" | "block";
  })[];
  tasks?: Todo[];
}
interface UserState {
  user: UserDetailsState;
  isUserLogin: boolean;
  setUserData: (user: UserDetailsState) => void;
  setLogOut: () => void;
  board: Board;
  setBoard: (board: Board) => void;
}
const defaultUserValue: UserDetailsState = {
  name: "",
  email: "",
  accessToken: "",
  emailVerified: false,
  tasks: [],
};
export const useUserStore = create<UserState>((set, get) => ({
  isUserLogin: false,
  user: defaultUserValue,
  board: {
    todo: [],
    inprogress: [],
    done: [],
    columns: ["todo", "inprogress", "done"],
  },
  setUserData: (user: UserDetailsState) => {
    set({
      user,
      isUserLogin: true,
      board: { ...get().board, ...groupTasksByStatus(user.tasks!) },
    });
    sessionStorage.setItem("isLogin", "true");
  },
  setBoard: (board) => {
    set({
      board,
    });
  },
  setLogOut: () => {
    set({
      user: defaultUserValue,
      isUserLogin: false,
    });
    sessionStorage.removeItem("isLogin");
  },
}));
