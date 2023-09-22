"use client";
import { getImageUrl, roleAccess, updateUserInFirestore } from "@/lib/helpers";
import { useBoardStore } from "@/store/BoardStore";
import { useModalStore } from "@/store/ModalStore";
import { useUserStore } from "@/store/UserStore";
import { Todo, TypeColumns } from "@/typings";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { Popconfirm } from "antd";
import { getURL } from "next/dist/shared/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  DraggableProvidedDragHandleProps,
  DraggableProvidedDraggableProps,
} from "react-beautiful-dnd";
import { toast } from "react-toastify";
import { EditOutlined } from "@ant-design/icons";
import Avatar from "react-avatar";

type Props = {
  todo: Todo;
  index: number;
  id: TypeColumns;
  innerRef: (element: HTMLElement | null) => void;
  draggableProps: DraggableProvidedDraggableProps;
  dragHandleProps: DraggableProvidedDragHandleProps | null | undefined;
};

function TodoCard({
  todo,
  index,
  id,
  innerRef,
  dragHandleProps,
  draggableProps,
}: Props) {
  const { user, setUserData } = useUserStore((state) => state);
  const { deleteTask } = useBoardStore((state) => state);
  const [loading, setLoading] = useState<boolean>(false);
  const { setTaskFields, toggleModal } = useModalStore((state) => state);

  const handleDeleteTask = async (id: string) => {
    try {
      setLoading(true);
      const newTasks = user.tasks?.filter((t) => t.id != id);
      await updateUserInFirestore(user.email!, { tasks: newTasks });
      const newUser = { ...user };
      newUser.tasks = newTasks;
      setUserData(newUser);
      toast("Deleted the task..", { type: "success" });
    } catch (err) {
      console.log(err);
      setLoading(false);
      toast("Something went wrong on deleting task", { type: "error" });
    }
  };

  return (
    <div
      ref={innerRef}
      {...dragHandleProps}
      {...draggableProps}
      className="bg-white rounded-md space-y-2 drop-shadow-sm"
    >
      <div className="flex gap-2 items-start p-5 w-full">
        <Avatar
          round
          size="30"
          name={todo.assignee.name ? todo.assignee.name : todo.assignee.email}
          title={todo.assignee.email ? todo.assignee.email : ""}
          className="cursor-pointer"
        />
        <div className="flex justify-between items-start gap-1 w-[95%]">
          <p
            onClick={() => {
              setTaskFields(todo);
              toggleModal();
            }}
            title="Click to view the task"
            className="cursor-pointer"
          >
            {todo.title}
          </p>
          <div className="flex flex-col items-center  justify-center gap-1">
            {roleAccess[user.role!]?.includes("edit") ? (
              <span
                className="w-7 h-7 cursor-pointer text-white flex items-center justify-center rounded-full bg-blue-500 hover:bg-blue-600"
                onClick={() => {
                  setTaskFields(todo, "edit");
                  toggleModal();
                }}
              >
                <EditOutlined />
              </span>
            ) : null}

            <Popconfirm
              title="Are you sure that you want to delete this task"
              okButtonProps={{
                title: "Delete",
                loading,
                style: { background: "red", color: "white" },
              }}
              onConfirm={() => handleDeleteTask(todo.id)}
            >
              {roleAccess[user.role!]?.includes("delete") ? (
                <button className="text-red-500 hover:text-red-600">
                  <XCircleIcon className=" h-9 w-9" />
                </button>
              ) : null}
            </Popconfirm>
          </div>
        </div>
      </div>

      {/* {todo.images?.imageUrl && (
        <div className="h-full w-full rounded-b-md">
          <Image
            src={todo.image.imageUrl}
            alt="Task image"
            width={400}
            height={200}
            className="w-full object-contain rounded-b-md"
          />
        </div>
      )} */}
    </div>
  );
}

export default TodoCard;
