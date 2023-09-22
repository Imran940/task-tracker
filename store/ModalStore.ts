import { ID, databases } from "@/appwrite";
import { getImageUrl, uploadImage } from "@/lib/helpers";
import { Board, Image, Todo, TypeColumns } from "@/typings";
import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  toggleModal: () => void;
  taskFields: Todo;
  setTaskFields: (
    value: Partial<Todo>,
    openType?: "edit" | "add" | "view"
  ) => void;
  resetAddTaskFields: () => void;
  addTask: (board: Board) => any;
  openType?: "edit" | "add" | "view";
}

const defaultTaskFieldValues: Todo = {
  id: "",
  title: "",
  description: "",
  startDate: null,
  endDate: null,
  status: "todo",
  assignee: "",
  priority: "low",
  createdAt: null,
  images: [],
};

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  openType: "view",
  toggleModal: () => set({ isOpen: !get().isOpen }),
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
  addTask: async (board) => {
    const { image, taskType, title } = get().addTaskFields;
    let file: Image;

    if (image) {
      const fileUpload = await uploadImage(image);

      if (fileUpload) {
        file = {
          bucketId: fileUpload.bucketId,
          fileId: fileUpload.$id,
        };
        let url = await getImageUrl(file);
        file!.imageUrl = url.toString();
      }
    }

    const { $id } = await databases.createDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      ID.unique(),
      {
        title,
        status: taskType,
        ...(file! && { image: JSON.stringify(file) }),
      }
    );

    const newBoard = { ...board };

    const newTodo: Todo = {
      $id,
      $createdAt: new Date().toISOString(),
      title,
      status: taskType,
      ...(file! && { image: file }),
    };

    newBoard[taskType].push(newTodo);

    return newBoard;
  },
}));
