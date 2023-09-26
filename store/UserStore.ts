import { Board, InvitedUserType, ProjectRole, Todo, userType } from "@/typings";
import { create } from "zustand";
import { groupTasksByStatus, mergeAllTasks } from "@/lib/helpers";
// interface UserDetailsState {
//   name: string | null;
//   email: string | null;
//   accessToken: string | null;
//   emailVerified: boolean;
//   profilePic?: string | null;
//   role?: ProjectRole;
//   invitedUsers?: InvitedUserType[];
//   tasks?: Todo[];
//   invitedBy?: string;
// }
interface UserState {
  user: userType;
  isUserLogin: boolean;
  setUserData: (user: userType) => void;
  setLogOut: () => void;
  board: Board;
  setBoard: (board: Board) => void;
  setSearchString: (value: string, tasks: Todo[]) => void;
  tempBoard?: Board;
  searchString?: string;
}
const defaultUserValue: userType = {
  name: "",
  email: "",
  accessToken: "",
  emailVerified: false,
  tasks: [],
  googleTokens: null,
  role: "viewer",
  status: "pending",
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
  setUserData: (user) => {
    set({
      user,
      isUserLogin: true,
      board: { ...get().board, ...groupTasksByStatus(user.tasks!) },
    });
    sessionStorage.setItem("isLogin", "true");
  },
  setBoard: (board) => {
    const newBoard = { ...board };
    delete newBoard.columns;
    set({
      board,
      user: {
        ...get().user,
        tasks: mergeAllTasks(newBoard),
      },
    });
  },
  setSearchString: (value, tasks) => {
    if (!value) {
      set({ tempBoard: undefined, searchString: "" });
      return;
    }
    const copiedAllTasks = [...tasks!];
    const filteredTasks = copiedAllTasks.filter(
      (c) =>
        c.title.toLowerCase().includes(value.toLowerCase()) ||
        c.assignee.name.toLowerCase().includes(value.toLowerCase())
    );

    set({ searchString: value, tempBoard: groupTasksByStatus(filteredTasks) });
  },
  setLogOut: () => {
    set({
      user: defaultUserValue,
      isUserLogin: false,
    });
    sessionStorage.removeItem("isLogin");
  },
}));
