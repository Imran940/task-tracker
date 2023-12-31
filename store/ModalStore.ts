import { InvitedUserType, Todo } from "@/typings";
import { create } from "zustand";

interface InviteModalTypes {
  openType?: "edit" | "add" | "view";
  isOpen: boolean;
  loading: boolean;
  fieldValues: InvitedUserType;
  setFieldValues: (
    value: Partial<InvitedUserType>,
    openType?: "edit" | "add"
  ) => void;
  resetFieldValues: () => void;
}
interface ModalState {
  isOpen: boolean;
  toggleModal: (value?: "showAuthModal") => void;
  taskFields: Todo;
  setTaskFields: (
    value: Partial<Todo>,
    openType?: "edit" | "add" | "view"
  ) => void;
  resetAddTaskFields: () => void;
  openType?: "edit" | "add" | "view";
  showAuthModal?: boolean;
  inviteModalStates: InviteModalTypes;
  setInviteModalState: (value: Partial<InviteModalTypes>) => void;
  googleAuthUrl?: string | undefined;
  setGoogleAuthUrl: (value: string | undefined) => void;
}

const defaultTaskFieldValues: Todo = {
  id: "",
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  status: "todo",
  assignee: {
    name: "",
    email: "",
  },
  priority: "low",
  createdAt: null,
  images: [],
};

const defaultInviteFieldValues: InvitedUserType = {
  id: "",
  name: "",
  email: "",
  role: "viewer",
  status: "pending",
  googleTokens: null,
};

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  isInviteOpen: false,
  openType: "view",
  toggleModal: (value) =>
    set({ [value ? value : "isOpen"]: !get()[value ? value : "isOpen"] }),

  inviteModalStates: {
    isOpen: false,
    loading: false,
    fieldValues: { ...defaultInviteFieldValues },
    openType: "view",
    setFieldValues: (value, openType) => {
      set({
        inviteModalStates: {
          ...get().inviteModalStates,
          fieldValues: {
            ...get().inviteModalStates?.fieldValues,
            ...value,
          },
        },
        openType,
      });
    },
    resetFieldValues: () =>
      set({
        inviteModalStates: {
          ...get().inviteModalStates,
          fieldValues: { ...defaultInviteFieldValues },
        },
      }),
  },

  setInviteModalState: (value) => {
    set({
      inviteModalStates: {
        ...get().inviteModalStates,
        ...value,
      },
    });
  },
  taskFields: { ...defaultTaskFieldValues },
  setTaskFields: (value, openType = "view") => {
    set({
      taskFields: {
        ...defaultTaskFieldValues,
        ...value,
      },
      openType,
    });
  },
  resetAddTaskFields: () =>
    set({
      taskFields: {
        ...defaultTaskFieldValues,
      },
    }),

  setGoogleAuthUrl: (value) =>
    set({
      googleAuthUrl: value,
    }),
}));
