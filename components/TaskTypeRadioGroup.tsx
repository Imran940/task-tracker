import { useModalStore } from "@/store/ModalStore";
import { RadioGroup } from "@headlessui/react";
import { CheckCircleIcon } from "@heroicons/react/24/solid";
import React from "react";
const { Option, Label, Description } = RadioGroup;
const types = [
  {
    id: "todo",
    name: "To Do",
    description: "A task that you have to do",
    color: "bg-red-500",
  },
  {
    id: "inprogress",
    name: "In Progress",
    description: "A task that is currently being worked on",
    color: "bg-yellow-500",
  },
  {
    id: "done",
    name: "Done",
    description: "A task that has been completed",
    color: "bg-green-500",
  },
];
function TaskTypeRadioGroup() {
  const {
    addTaskFields: { taskType },
    setAddTaskFields,
  } = useModalStore((state) => state);
  return (
    <div className="w-full py-5">
      <div className="mx-auto w-full max-w-md">
        <RadioGroup
          value={taskType}
          onChange={(e) => setAddTaskFields("taskType", e)}
        >
          <div className="space-y-2">
            {types.map(({ id, name, description, color }) => (
              <Option
                key={id}
                value={id}
                className={({ active, checked }) => `
              ${
                active
                  ? "ring-2 ring-white ring-opacity-60 ring-offset-2 ring-offset-sky-300"
                  : ""
              }
              ${checked ? `${color} bg-opacity-75 text-white` : "bg-white"}
              relative flex cursor-pointer rounded-lg px-5 py-4 shadow-md focus:outline-none
              `}
              >
                {({ active, checked }) => (
                  <>
                    <div className="flex w-full items-center justify-between">
                      <div className="flex items-center">
                        <div className="text-sm">
                          <Label
                            as="p"
                            className={`font-medium ${
                              checked ? "text-white" : "text-gray-900"
                            }`}
                          >
                            {name}
                          </Label>
                          <Description
                            as="span"
                            className={`inline ${
                              checked ? "text-white" : "text-gray-500"
                            }`}
                          >
                            <span>{description}</span>
                          </Description>
                        </div>
                      </div>
                      {checked && (
                        <div className="shrink-0 text-white">
                          <CheckCircleIcon className="h-6 w-6" />
                        </div>
                      )}
                    </div>
                  </>
                )}
              </Option>
            ))}
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}

export default TaskTypeRadioGroup;
