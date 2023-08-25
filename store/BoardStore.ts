import { databases, storage } from "@/appwrite";
import { getTodosGroupedByColumn, groupTasksByStatus } from "@/lib/helpers";
import { Board, Todo, TypeColumns } from "@/typings";
import { todo } from "node:test";
import { create } from "zustand";

interface BoardTypes {
  board: Board;
  tempBoard?: Board;
  getBoard: () => void;
  setBoardState: (board: Board) => void;
  updateTaskInDB: (todo: Partial<Todo>) => void;
  searchString: string;
  setSearchString: (searchString: string) => void;
  allTasks?: Todo[];
  deleteTask: ({
    taskIndex,
    todo,
    id,
  }: {
    taskIndex: number;
    todo: Todo;
    id: TypeColumns;
  }) => void;
}
export const useBoardStore = create<BoardTypes>((set, get) => ({
  searchString: "",
  board: {
    todo: [],
    inprogress: [],
    done: [],
    columns: [],
  },
  getBoard: async () => {
    const { result, allTasks } = await getTodosGroupedByColumn();
    set({
      board: { ...result, columns: ["todo", "inprogress", "done"] },
      allTasks,
    });
  },
  setSearchString: (value) => {
    if (!value) {
      set({ tempBoard: undefined, searchString: "" });
      return;
    }
    const copiedAllTasks = [...get().allTasks!];
    const filteredTasks = copiedAllTasks.filter((c) =>
      c.title.toLowerCase().includes(value.toLowerCase())
    );

    set({ searchString: value, tempBoard: groupTasksByStatus(filteredTasks) });
  },
  setBoardState: (board: Board) => set({ board }),

  updateTaskInDB: async (todo) => {
    await databases.updateDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id,
      {
        ...todo,
      }
    );
  },
  deleteTask: async ({ taskIndex, todo, id }) => {
    const newBoard = { ...get().board };

    //delete todoId from newColumns
    newBoard[id].splice(taskIndex, 1);

    if (todo.image) {
      await storage.deleteFile(todo.image.bucketId, todo.image.fileId);
    }

    await databases.deleteDocument(
      process.env.NEXT_PUBLIC_DATABASE_ID!,
      process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!,
      todo.$id
    );

    set({ board: newBoard });
  },
}));
