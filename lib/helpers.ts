import { db } from "@/firebase";
import {
  Access,
  Board,
  ProjectRole,
  Todo,
  sendMailPayload,
  userType,
} from "@/typings";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";

export const mergeAllTasks = (board: Board) => {
  const allTodos = Object.values(board);
  let result: Todo[] = [];
  if (allTodos?.length) {
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

  if (todos?.length) {
    todos.forEach((todo: Todo, index: number) => {
      groupColumnByType[todo.status]?.push(todo);
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

export const sendEmail = async (payload: sendMailPayload) => {
  const res = await fetch("/api/send_email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ payload }),
  });
  const data = await res.json();
  return data.data;
};

export function isValidEmail(email = "") {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const getUserFromFirestore = async (email: string) => {
  if (!email) return null;
  let data;
  const docRef = doc(db, "users", email);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    data = docSnap.data();
  }
  return data;
};

export const createUserInFirestore = async ({
  email,
  role = "viewer",
  name,
  invitedUsers = [],
  signupMethods = [],
  invitedBy,
}: userType) => {
  if (!email) return;
  const usersRef = collection(db, "users");
  await setDoc(doc(usersRef, email), {
    email,
    role,
    name,
    invitedUsers,
    signupMethods,
    ...(invitedBy && { invitedBy }),
  });
};

export const updateUserInFirestore = async (
  email: string,
  payload: Partial<userType>
) => {
  if (!email) return;
  const usersRef = doc(db, "users", email);
  await setDoc(usersRef, payload, { merge: true });
};

const AllAccesses: Access[] = ["add", "edit", "delete", "invite"];
const EditorUserAccesses: Access[] = ["edit", "add"];

export const roleAccess: Record<ProjectRole, Access[]> = {
  editor: EditorUserAccesses,
  viewer: [],
  owner: AllAccesses,
};
