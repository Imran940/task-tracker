"use client";
import { useBoardStore } from "@/store/BoardStore";
import React, { useEffect } from "react";
import { DragDropContext, DropResult, Droppable } from "react-beautiful-dnd";
import Column from "./Column";
import Header from "./Header";
import { useUserStore } from "@/store/UserStore";
import { updateUserInFirestore } from "@/lib/helpers";

function Board() {
  // const { getBoard, board, setBoardState, updateTaskInDB, tempBoard } =
  //   useBoardStore((state) => state);

  const { updateTaskInDB } = useBoardStore((state) => state);
  const {
    user: { tasks, email },
    user,
    board,
    setBoard,
    setUserData,
    tempBoard,
  } = useUserStore((state) => state);

  // useEffect(() => {
  //   if (tasks?.length) getBoard(tasks);
  // }, [tasks]);

  console.log({ boardInUi: board });
  const handleOnDragEnd = async (result: DropResult) => {
    const { destination, type, source } = result;
    console.log(result);
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

        //updating to the global store
        // let newUser = { ...user };
        // newUser.tasks = newTasks;
        // setUserData(newUser);
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
