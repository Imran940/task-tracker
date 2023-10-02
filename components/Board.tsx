"use client";

import React, { useState } from "react";
import { DragDropContext, DropResult, Droppable } from "react-beautiful-dnd";
import Column from "./Column";
import Header from "./Header";
import { useUserStore } from "@/store/UserStore";
import { updateUserInFirestore } from "@/lib/helpers";
import { useModalStore } from "@/store/ModalStore";
import { Modal } from "antd";
import { LoadingOutlined } from "@ant-design/icons";

function Board() {
  const {
    user: { tasks, email },
    board,
    setBoard,
    tempBoard,
  } = useUserStore((state) => state);

  const { showAuthModal, googleAuthUrl, toggleModal } = useModalStore(
    (state) => state
  );
  const [loading, setLoading] = useState(false);

  const handleOnDragEnd = async (result: DropResult) => {
    const { destination, type, source } = result;
    if (
      !destination ||
      (source.droppableId == destination.droppableId &&
        source.index == destination.index)
    )
      return;

    //handle column drag;
    if (type == "column") {
      const columns = [...board.columns!];
      const [removed] = columns.splice(source.index, 1);
      columns.splice(destination.index, 0, removed);
      setBoard({ ...board, columns });
    }

    if (type == "card") {
      const columns = { ...board };
      const sourceColumn = source.droppableId;
      const destinationColumn = destination.droppableId;

      if (sourceColumn == destinationColumn) {
        //handle the drag within the same column;
        // @ts-ignore sourceColumn will be enum only
        const newColTodos = [...columns[sourceColumn]];
        const [removed] = newColTodos.splice(source.index, 1);
        newColTodos.splice(destination.index, 0, removed);
        setBoard({ ...board, [sourceColumn]: newColTodos });
      } else {
        // @ts-ignore sourceColumn will be enum only
        const sourceColTodos = [...columns[sourceColumn]];
        // @ts-ignore destinationColumn will be enum only
        const destionationColTodos = [...columns[destinationColumn]];

        //remove element from the source
        const [removed] = sourceColTodos.splice(source.index, 1);
        let updatedTask = { ...removed, status: destinationColumn };
        //add the removed element in the destionation index
        destionationColTodos.splice(destination.index, 0, updatedTask);

        //update Task in DB
        // updateTaskInDB({ $id: updatedTask.$id, status: updatedTask.status });
        const newTasks = [...tasks!];
        if (newTasks.length) {
          const index = newTasks.findIndex((nt) => nt.id == updatedTask.id);
          newTasks[index].status = updatedTask.status;
          updateUserInFirestore(email!, { tasks: newTasks });
        }

        setBoard({
          ...board,
          [sourceColumn]: sourceColTodos,
          [destinationColumn]: destionationColTodos,
        });
      }
    }
  };

  return (
    <DragDropContext onDragEnd={handleOnDragEnd}>
      <Header />
      <Modal
        onCancel={() => toggleModal("showAuthModal")}
        footer
        title="Authorize Your Google Calendar"
        open={showAuthModal}
      >
        <button
          //onClick={handleGoogleLogin}
          className="p-3 my-6 rounded-md uppercase border-4 w-full   flex items-center justify-center gap-2"
          onClick={() => window.open(googleAuthUrl)}
        >
          <img src="/images/google.jpg" className="w-[10%]   object-contain" />
          {loading ? (
            <>
              Loading <LoadingOutlined />{" "}
            </>
          ) : (
            <span>Authorize Calendar</span>
          )}
        </button>
      </Modal>
      <Droppable droppableId="board" direction="horizontal" type="column">
        {(provided) => (
          <div
            className="grid grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto gap-3"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {board.columns!?.map((id, index) => (
              <Column
                key={id}
                id={id}
                todos={tempBoard?.[id] ? tempBoard[id] : board[id]}
                index={index}
              />
            ))}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}

export default Board;
