import { create } from "zustand";

interface UserDetailsState {
  name: string | null;
  email: string | null;
  accessToken: string | null;
  emailVerified: boolean;
  profilePic?: string | null;
}
interface UserState {
  user: UserDetailsState;
  isUserLogin: boolean;
  setUserData: (user: UserDetailsState) => void;
  setLogOut: () => void;
}
const defaultUserValue = {
  name: "",
  email: "",
  accessToken: "",
  emailVerified: false,
};
export const useUserStore = create<UserState>((set, get) => ({
  isUserLogin: false,
  user: defaultUserValue,
  setUserData: (user: UserDetailsState) => {
    set({
      user,
      isUserLogin: true,
    });
    sessionStorage.setItem("isLogin", "true");
  },
  setLogOut: () => {
    set({
      user: defaultUserValue,
      isUserLogin: false,
    });
    sessionStorage.removeItem("isLogin");
  },
}));
