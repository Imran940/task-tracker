import { Todo, TypeColumns } from "@/typings";
import { PlusCircleIcon } from "@heroicons/react/24/solid";
import React, { useState } from "react";
import { Draggable, Droppable } from "react-beautiful-dnd";
import TodoCard from "./TodoCard";
import { useBoardStore } from "@/store/BoardStore";
import { useModalStore } from "@/store/ModalStore";
import { useUserStore } from "@/store/UserStore";
import TaskModal from "@/modals/TaskModal";

type Props = {
  id: TypeColumns;
  todos: Todo[];
  index: number;
};

const idToColumnText: { [key in TypeColumns]: string } = {
  todo: "To Do",
  inprogress: "In Progress",
  done: "Done",
};

function Column({ id, todos, index }: Props) {
  const { toggleModal, setTaskFields, isOpen } = useModalStore(
    (state) => state
  );
  const { user } = useUserStore((state) => state);

  return (
    <>
      {isOpen ? <TaskModal /> : null}

      <Draggable draggableId={id} index={index}>
        {(provided) => (
          <div
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            ref={provided.innerRef}
          >
            <Droppable droppableId={id} type="card">
              {(provided, snapshot) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className={`p-2 rounded-2xl shadow-sm ${
                    snapshot.isDraggingOver ? "bg-green-200" : "bg-white/50"
                  }`}
                >
                  <h2 className="flex justify-between p-2 font-bold text-xl">
                    {idToColumnText[id]}
                    <span className="text-gray-500 bg-gray-200 rounded-full px-2 py-1 text-sm">
                      {todos.length}
                    </span>
                  </h2>

                  <div className="space-y-2 ">
                    {todos.map((todo, index) => {
                      return (
                        <Draggable
                          key={todo.id}
                          draggableId={todo.id}
                          index={index}
                        >
                          {(provided) => (
                            <TodoCard
                              todo={todo}
                              index={index}
                              id={id}
                              innerRef={provided.innerRef}
                              draggableProps={provided.draggableProps}
                              dragHandleProps={provided.dragHandleProps}
                            />
                          )}
                        </Draggable>
                      );
                    })}

                    {user.role != "viewer" ? (
                      <div>
                        <button className="text-green-500 hover:text-green-600">
                          <PlusCircleIcon
                            onClick={() => {
                              toggleModal();
                              setTaskFields({ status: id }, "add");
                            }}
                            className="h-10 w-10"
                          />
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              )}
            </Droppable>
          </div>
        )}
      </Draggable>
    </>
  );
}

export default Column;
