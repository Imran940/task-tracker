"use client";
import { useState, Fragment, useRef, FormEvent } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { useModalStore } from "@/store/ModalStore";
import TaskTypeRadioGroup from "./TaskTypeRadioGroup";
import Image from "next/image";
import { PhotoIcon } from "@heroicons/react/24/solid";
import { useBoardStore } from "@/store/BoardStore";
import { Board } from "@/typings";

function Modal() {
  const {
    isOpen,
    toggleModal,
    addTaskFields: { title, image },
    setAddTaskFields,
    resetAddTaskFields,
    addTask,
  } = useModalStore((state) => state);

  const { setBoardState, board } = useBoardStore((state) => state);

  const { Panel, Title } = Dialog;
  const imagePickerRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!title) return;

    //add task
    const result = await addTask(board);
    setBoardState(result);
    resetAddTaskFields();
    toggleModal();
  };
  return (
    // Use the `Transition` component at the root level
    <Transition show={isOpen} as={Fragment}>
      <Dialog
        onSubmit={handleSubmit}
        as="form"
        className="z-10 relative"
        onClose={toggleModal}
      >
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all ">
                <Title
                  as="h3"
                  className="text-lg font-medium leading-6 text-gray-900 pb-2"
                >
                  Add a Task
                </Title>

                <div className="mt-2">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setAddTaskFields("title", e.target.value);
                    }}
                    placeholder="Enter a task here.."
                    className="w-full border border-gray-300 rounded-md outline-none p-5"
                  />
                </div>

                <TaskTypeRadioGroup />

                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => imagePickerRef.current?.click()}
                    className="w-full border border-gray-300 rounded-md outline-none p-5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                  >
                    <PhotoIcon className="h-6 w-6 mr-2 inline-block" />
                    Upload Image
                  </button>

                  {image && (
                    <Image
                      width={200}
                      height={200}
                      className="w-full h-44 object-cover mt-2 filter hover:grayscale transition-all duration-150 cursor-not-allowed"
                      src={URL.createObjectURL(image)}
                      alt="uploaded image"
                      onClick={() => {
                        setAddTaskFields("image", null);
                      }}
                    />
                  )}
                  <input
                    type="file"
                    hidden
                    ref={imagePickerRef}
                    onChange={(e) => {
                      const file = e.target.files![0];
                      if (!file.type.startsWith("image/")) return;

                      setAddTaskFields("image", file);
                    }}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    disabled={!title}
                    className="inline-flex justify-center rounded-md border-transparent bg-blue-200 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed "
                  >
                    Add Task
                  </button>
                </div>
              </Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

export default Modal;
