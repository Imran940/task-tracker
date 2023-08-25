import { ID, databases } from "@/appwrite";
import { getImageUrl, uploadImage } from "@/lib/helpers";
import { Board, Image, Todo, TypeColumns } from "@/typings";
import { create } from "zustand";

interface ModalState {
  isOpen: boolean;
  toggleModal: () => void;
  addTaskFields: {
    title: string;
    taskType: TypeColumns;
    image: File | null;
  };
  setAddTaskFields: (key: string, value: string | File | null) => void;
  resetAddTaskFields: () => void;
  addTask: (board: Board) => any;
}

export const useModalStore = create<ModalState>((set, get) => ({
  isOpen: false,
  toggleModal: () => set({ isOpen: !get().isOpen }),
  addTaskFields: {
    title: "",
    taskType: "todo",
    image: null,
  },
  setAddTaskFields: (key, value) => {
    set({
      addTaskFields: {
        ...get().addTaskFields,
        [key]: value,
      },
    });
  },
  resetAddTaskFields: () =>
    set({
      addTaskFields: {
        title: "",
        taskType: "todo",
        image: null,
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
