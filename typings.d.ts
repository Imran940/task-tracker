import { UUID } from "crypto";
import { StorageReference } from "firebase/storage";
import { NullLiteral } from "typescript";

interface Board {
  todo: Todo[];
  inprogress: Todo[];
  done: Todo[];
  columns?: TypeColumns[];
}

export type TypeColumns = "todo" | "inprogress" | "done";

export type Priority = "low" | "medium" | "high";

interface Todo {
  id: string;
  title: string;
  description?: string;
  startDate: DateType;
  endDate: DateType;
  status: TypeColumns;
  assignee: string;
  priority: Priority;
  images?: Image[];
  createdAt: DateType;
}

export interface Image {
  imageRef: StorageReference;
  imageUrl: string;
}

export type ProjectRole = "viewer" | "editor" | "owner";

export interface sendMailPayload {
  name: string;
  role: ProjectRole;
  fromEmail: string;
  toEmail: string;
  ownerName: string;
}

export interface defaultUserType {
  email: string;
  role?: ProjectRole;
  name: string;
  signupMethods: ("google" | "email")[];
}

export interface userType extends defaultUserType {
  invitedUsers?: (defaultUserType & { id: UUID; status: string })[];
  invitedBy?: string;
  tasks?: Todo[];
}

export interface ModalState {
  open: boolean;
  loading: boolean;
}
