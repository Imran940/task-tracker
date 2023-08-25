interface Board {
  todo: Todo[];
  inprogress: Todo[];
  done: Todo[];
  columns?: TypeColumns[];
}

export type TypeColumns = "todo" | "inprogress" | "done";

interface Todo {
  $id: string;
  $createdAt: string;
  title: string;
  status: TypeColumns;
  image?: Image;
}

export interface Image {
  bucketId: string;
  fileId: string;
  imageUrl?: string;
}
