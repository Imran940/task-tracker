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

export type Access = "edit" | "add" | "invite" | "delete";

interface Todo {
  id: string;
  title: string;
  description?: string;
  startDate: string | null;
  endDate: string | null;
  status: TypeColumns;
  assignee: { name: string; email: string };
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
  email: string;
  message?: string;
  subject: string;
}

export interface defaultUserType {
  email: string;
  role: ProjectRole;
  name: string;
  signupMethods?: ("google" | "email")[];
  status: "pending" | "active" | "block";
  googleTokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    id_token: string;
    expiry_date: number;
  } | null;
}

export type InvitedUserType = defaultUserType & {
  id: UUID | string;
};
export interface userType extends defaultUserType {
  invitedUsers?: InvitedUserType[];
  invitedBy?: string | null;
  tasks?: Todo[];
  accessToken?: string | null;
  emailVerified?: boolean;
  profilePic?: string;
}

export interface ModalState {
  open: boolean;
  loading: boolean;
}
