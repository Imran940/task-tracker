import { ID, databases, storage } from "@/appwrite";
import { Board, Image, Todo, TypeColumns } from "@/typings";

export const getTodosGroupedByColumn = async () => {
  const data = await databases.listDocuments(
    process.env.NEXT_PUBLIC_DATABASE_ID!,
    process.env.NEXT_PUBLIC_TODOS_COLLECTION_ID!
  );
  const todos = data.documents;

  // grouping values by status
  // const columns = todos.reduce((acc, todo) => {
  //   if (!acc.get(todo.status)) {
  //     acc.set(todo.status, {
  //       id: todo.status,
  //       todos: [],
  //     });
  //   }

  //   acc.get(todo.status)!.todos.push({
  //     ...todo,
  //     ...(todo.image && { image: JSON.parse(todo.image) }),
  //   });

  //   return acc;
  // }, new Map<TypeColumns, Column>());

  // adding the column of the status with empty array if any of the column status is not found
  // const columnTypes: TypeColumns[] = ["todo", "inprogress", "done"];
  // for (const columnType of columnTypes) {
  //   if (!columns.get(columnType)) {
  //     columns.set(columnType, {
  //       id: columnType,
  //       todos: [],
  //     });
  //   }
  // }

  // const sortedColumns = new Map<TypeColumns, Column>(
  //   //@ts-expect-error ignore this sort
  //   Array.from(columns.entries()).sort(
  //     (a, b) => columnTypes.indexOf(a[0]) - columnTypes.indexOf(b[0])
  //   )
  // );

  // const board: Board = {
  //   columns: sortedColumns,
  // };

  // return { board, allTasks: mergeAllTasks(board) };
  const result = groupTasksByStatus(todos);
  const allTasks = mergeAllTasks(result);

  return { result, allTasks };
};

export const mergeAllTasks = (board: Board) => {
  const allTodos = Object.values(board);
  let result: Todo[] = [];
  if (allTodos.length) {
    allTodos.forEach((item) => {
      result = [...result, ...item];
    });
  }
  return result;
};

export const groupTasksByStatus = (todos: Todo[]) => {
  let groupColumnByType: Board = {
    todo: [],
    inprogress: [],
    done: [],
  };

  if (todos.length) {
    todos.forEach((todo: Todo, index: number) => {
      groupColumnByType[todo.status]?.push({
        ...todo,
        //@ts-ignore ignore todo.image
        ...(todo.image && { image: JSON.parse(todo.image) }),
      });
    });
  }

  return groupColumnByType;
};
export const fetchSuggestion = async (allTasks: Todo[] | undefined) => {
  try {
    let result: any = {};
    allTasks?.forEach((task) => {
      result[task.status] = result[task.status] ? ++result[task.status] : 1;
    });
    console.log(result);
    const res = await fetch("/api/generate_summary", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ todos: result }),
    });
    const GPTdata = await res.json();
    return GPTdata.content;
  } catch (err) {
    console.log(err);
  }
};

export const uploadImage = async (file: File) => {
  if (!file) return;

  const fileUpload = await storage.createFile(
    process.env.NEXT_PUBLIC_BUCKET_ID,
    ID.unique(),
    file
  );
  return fileUpload;
};

export const getImageUrl = async (image: Image) => {
  const url = storage.getFileView(image.bucketId, image.fileId);
  return url;
};
