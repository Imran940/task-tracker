"use client";
import { getImageUrl } from "@/lib/helpers";
import { useBoardStore } from "@/store/BoardStore";
import { Todo, TypeColumns } from "@/typings";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { getURL } from "next/dist/shared/lib/utils";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import {
  DraggableProvidedDragHandleProps,
  DraggableProvidedDraggableProps,
} from "react-beautiful-dnd";

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
  const { deleteTask } = useBoardStore((state) => state);
  return (
    <div
      ref={innerRef}
      {...dragHandleProps}
      {...draggableProps}
      className="bg-white rounded-md space-y-2 drop-shadow-sm"
    >
      <div className="flex justify-between items-center p-5">
        <p>{todo.title}</p>
        <button className="text-red-500 hover:text-red-600">
          <XCircleIcon
            onClick={() => deleteTask({ taskIndex: index, todo, id })}
            className="ml-5 h-8 w-8"
          />
        </button>
      </div>

      {todo.image?.imageUrl && (
        <div className="h-full w-full rounded-b-md">
          <Image
            src={todo.image.imageUrl}
            alt="Task image"
            width={400}
            height={200}
            className="w-full object-contain rounded-b-md"
          />
        </div>
      )}
    </div>
  );
}

export default TodoCard;
