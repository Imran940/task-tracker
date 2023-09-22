"use client";
import { useState } from "react";

import { useModalStore } from "@/store/ModalStore";

import { useBoardStore } from "@/store/BoardStore";
import { Board, Image, Priority, Todo, TypeColumns } from "@/typings";
import {
  Input,
  Modal,
  Avatar,
  Badge,
  Image as AntdImage,
  Popconfirm,
  Select,
  DatePicker,
  Button,
} from "antd";
import {
  getStorage,
  ref,
  uploadBytes,
  deleteObject,
  getDownloadURL,
  StorageReference,
} from "firebase/storage";
import { storage } from "@/firebase";
import { v4 } from "uuid";
import { toast } from "react-toastify";
import { LoadingOutlined } from "@ant-design/icons";
import { useUserStore } from "@/store/UserStore";
import moment from "moment";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";
import { updateUserInFirestore } from "@/lib/helpers";
import dayjs from "dayjs";

const { TextArea } = Input;
const { PreviewGroup } = AntdImage;
const { Option } = Select;
const priorities: Priority[] = ["low", "medium", "high"];
const statuses: { id: TypeColumns; name: string }[] = [
  { id: "todo", name: "ToDo" },
  { id: "inprogress", name: "In-Progress" },
  { id: "done", name: "Done" },
];

function TaskModal() {
  const {
    isOpen,
    toggleModal,
    taskFields,
    setTaskFields,
    resetAddTaskFields,
    addTask,
    openType,
  } = useModalStore((state) => state);
  // const { setBoardState, board } = useBoardStore((state) => state);
  const {
    user: { email, name, invitedUsers = [], tasks = [], role },
    user,
    board,
    setBoard,
    setUserData,
  } = useUserStore((state) => state);
  const defaultTaskValue: Todo & {
    loading?: {
      imageUpload: boolean;
      imageRemove: boolean;
      taskSubmit: boolean;
    };
  } = {
    ...taskFields,
    ...(taskFields?.images?.length && {
      images: taskFields?.images?.map((tm) => ({
        ...tm,
        //@ts-expect-error ignore this imageRef as we're storing this as string on the firestore
        imageRef: JSON.parse(tm.imageRef),
      })),
    }),
    assignee: { name: name!, email: email! },
    loading: {
      imageRemove: false,
      imageUpload: false,
      taskSubmit: false,
    },
  };
  const [taskInputs, setTaskInputs] = useState<
    Todo & {
      loading?: {
        imageUpload: boolean;
        imageRemove: boolean;
        taskSubmit: boolean;
      };
    }
  >(defaultTaskValue);
  console.log({ defaultTaskValue, taskInputs, taskFields });
  const {
    id,
    images,
    loading: {
      imageRemove: imageRemoveLoading,
      imageUpload: imageUploadLoading,
      taskSubmit: taskSubmitLoading,
    } = {},
    status,
    priority,
    assignee: { name: assigneeName, email: assigneeEmail },
    title: taskTitle,
    description,
    startDate,
    endDate,
  } = taskInputs;
  const assignees: { email: string; name: string }[] = [
    { email: email!, name: name! },
    ...invitedUsers
      ?.filter((i) => i.status == "active")
      .map((i) => ({ name: i.name!, email: i.email! })),
  ];
  const disableSubmitButton = !taskTitle || !startDate || !endDate;
  const isUpdate = taskFields.title;
  // console.log(moment(startDate?.$d).format("DD-MM-YYYY HH:mm"), startDate);

  // const { Panel, Title } = Dialog;
  // const imagePickerRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      if (disableSubmitButton) {
        toast("please fill the important fields", { type: "info" });
        return;
      }

      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          taskSubmit: true,
        },
      }));
      const newTasks = [...tasks];
      const payload = { ...taskInputs };
      const newUser = { ...user };

      delete payload.loading;

      if (payload.images?.length) {
        payload.images.forEach((i, index) => {
          payload.images[index].imageRef = JSON.stringify(i.imageRef);
        });
      }
      if (isUpdate) {
        const index = newTasks.findIndex((n) => n.id == id);
        if (index >= 0) {
          newTasks[index] = payload;
        }
      } else {
        payload.id = v4();
        payload.createdAt = new Date();

        newTasks.push(payload);
      }

      console.log({ newTasks, payload, board });
      //add task
      await updateUserInFirestore(email!, { tasks: newTasks });

      newUser.tasks = newTasks;
      setUserData(newUser);
      resetAddTaskFields();
      toggleModal();
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          taskSubmit: true,
        },
      }));
      toast(`Task ${isUpdate ? "updated" : "added"} successfully`);
    } catch (err) {
      console.log(err);
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          taskSubmit: false,
        },
      }));
    }
  };

  const handleImageChange = async (e) => {
    try {
      const files = Object.values(e.target.files);
      console.log(files);
      if (!files?.length) return;
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          imageUpload: true,
        },
      }));
      const images: Image[] = [];
      files.forEach(async (file, index) => {
        const storageRef = ref(storage, `images/${file.name}-${v4()}`);
        const response = await uploadBytes(storageRef, file);
        const imageUrl = await getDownloadURL(response.ref);
        images.push({
          imageRef: storageRef,
          imageUrl,
        });
        console.log({ images });
        if (index == files.length - 1) {
          console.log({ images });
          setTaskInputs((prevValue) => ({
            ...prevValue,
            images: [...prevValue.images!, ...images],
            loading: {
              ...prevValue.loading!,
              imageUpload: false,
            },
          }));
        }
      });
    } catch (err) {
      console.log(err);
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          imageUpload: false,
        },
      }));
    }
  };

  const handleImageRemove = async (
    imageRef: StorageReference,
    imageUrl: string
  ) => {
    try {
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          imageRemove: true,
        },
      }));
      let newImages: Image[] = [];
      await deleteObject(imageRef);
      newImages = images!?.filter((i) => i.imageUrl != imageUrl);
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          imageRemove: false,
        },
        images: newImages,
      }));
    } catch (err) {
      console.log(err);
      setTaskInputs((prevValue) => ({
        ...prevValue,
        loading: {
          ...prevValue.loading!,
          imageRemove: false,
        },
      }));
      toast("something went wrong");
    }
  };

  return (
    // Use the `Transition` component at the root level
    // <Transition show={isOpen} as={Fragment}>
    //   <Dialog
    //     onSubmit={handleSubmit}
    //     as="form"
    //     className="z-10 relative"
    //     onClose={toggleModal}
    //   >
    //     <Transition.Child
    //       as={Fragment}
    //       enter="ease-out duration-300"
    //       enterFrom="opacity-0"
    //       enterTo="opacity-100"
    //       leave="ease-in duration-200"
    //       leaveFrom="opacity-100"
    //       leaveTo="opacity-0"
    //     >
    //       <div className="fixed inset-0 bg-black bg-opacity-25" />
    //     </Transition.Child>

    //     <div className="fixed inset-0 overflow-y-auto">
    //       <div className="flex min-h-full items-center justify-center p-4 text-center">
    //         <Transition.Child
    //           as={Fragment}
    //           enter="ease-out duration-300"
    //           enterFrom="opacity-0"
    //           enterTo="opacity-100"
    //           leave="ease-in duration-200"
    //           leaveFrom="opacity-100"
    //           leaveTo="opacity-0"
    //         >
    //           <Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all ">
    //             <Title
    //               as="h3"
    //               className="text-lg font-medium leading-6 text-gray-900 pb-2"
    //             >
    //               Add a Task
    //             </Title>

    //             <div className="mt-2">
    //               <input
    //                 type="text"
    //                 value={title}
    //                 onChange={(e) => {
    //                   setAddTaskFields("title", e.target.value);
    //                 }}
    //                 placeholder="Enter a task here.."
    //                 className="w-full border border-gray-300 rounded-md outline-none p-5"
    //               />
    //             </div>

    //             <TaskTypeRadioGroup />

    //             <div className="mt-2">
    //               <button
    //                 type="button"
    //                 onClick={() => imagePickerRef.current?.click()}
    //                 className="w-full border border-gray-300 rounded-md outline-none p-5 focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
    //               >
    //                 <PhotoIcon className="h-6 w-6 mr-2 inline-block" />
    //                 Upload Image
    //               </button>

    //               {image && (
    //                 <Image
    //                   width={200}
    //                   height={200}
    //                   className="w-full h-44 object-cover mt-2 filter hover:grayscale transition-all duration-150 cursor-not-allowed"
    //                   src={URL.createObjectURL(image)}
    //                   alt="uploaded image"
    //                   onClick={() => {
    //                     setAddTaskFields("image", null);
    //                   }}
    //                 />
    //               )}
    //               <input
    //                 type="file"
    //                 hidden
    //                 ref={imagePickerRef}
    //                 onChange={(e) => {
    //                   const file = e.target.files![0];
    //                   if (!file.type.startsWith("image/")) return;

    //                   setAddTaskFields("image", file);
    //                 }}
    //               />
    //             </div>

    //             <div>
    //               <button
    //                 type="submit"
    //                 disabled={!title}
    //                 className="inline-flex justify-center rounded-md border-transparent bg-blue-200 px-4 py-2 text-sm font-medium text-blue-900 hover:bg-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed "
    //               >
    //                 Add Task
    //               </button>
    //             </div>
    //           </Panel>
    //         </Transition.Child>
    //       </div>
    //     </div>
    //   </Dialog>
    // </Transition>
    <Modal open={isOpen} footer={null} onCancel={toggleModal} width={1200}>
      <div style={{ margin: "30px 15px" }}>
        <span className="text-lg font-bold uppercase">{openType} a task</span>
        <div
          className="flex flex-col md:flex-row w-full justify-between"
          style={{ marginTop: "15px" }}
        >
          <div style={{ width: "68%" }} className=" flex flex-col gap-3">
            <Input
              type="text"
              placeholder="Enter a task name"
              className="w-full border-2"
              required
              style={{ border: "1.5px solid gray" }}
              allowClear
              value={taskTitle}
              onChange={(e) =>
                setTaskInputs((prevValue) => ({
                  ...prevValue,
                  title: e.target.value,
                }))
              }
              readOnly={openType == "view"}
            />
            <div className="w-full" style={{ marginBottom: "10px" }}>
              <ReactQuill
                theme="snow"
                placeholder="Please add your description here..."
                value={description}
                onChange={(value) =>
                  setTaskInputs((prevValue) => ({
                    ...prevValue,
                    description: value,
                  }))
                }
                readOnly={openType == "view"}
                style={{ height: "155px" }}
              />
            </div>
          </div>
          <div style={{ width: "29%" }} className="w-1/2">
            <div
              style={{
                width: "100%",
                display: "grid",
                gridTemplateColumns: "25% 75%",
                alignItems: "center",
                rowGap: "21px",
              }}
            >
              <label className="font-bold">Assignee</label>
              {openType == "view" ? (
                <span title={assigneeEmail}>{assigneeName}</span>
              ) : (
                <Select
                  defaultValue={assigneeEmail}
                  onChange={(value) =>
                    setTaskInputs((prevValue) => ({
                      ...prevValue,
                      assignee: {
                        name: assignees?.find((a) => a.email == value)?.name!,
                        email: value,
                      },
                    }))
                  }
                  value={assigneeEmail}
                >
                  {assignees.map((a, i) => (
                    <Option key={i} value={a.email}>
                      {a.name}
                    </Option>
                  ))}
                </Select>
              )}
              <label className="font-bold">Priority</label>
              {openType == "view" ? (
                <span>{priority}</span>
              ) : (
                <Select
                  defaultValue={priority}
                  onChange={(value) =>
                    setTaskInputs((prevValue) => ({
                      ...prevValue,
                      priority: value,
                    }))
                  }
                  value={priority}
                >
                  {priorities.map((p, i) => (
                    <Option key={i} value={p}>
                      {p.toUpperCase()}
                    </Option>
                  ))}
                </Select>
              )}
              <label className="font-bold">Status</label>
              {openType == "view" ? (
                <span>{status}</span>
              ) : (
                <Select
                  defaultValue={status}
                  onChange={(value) =>
                    setTaskInputs((prevValue) => ({
                      ...prevValue,
                      status: value,
                    }))
                  }
                  value={status}
                >
                  {statuses.map((s, i) => (
                    <Option key={i} value={s.id}>
                      {s.name}
                    </Option>
                  ))}
                </Select>
              )}

              <label className="font-bold">
                Start Date{" "}
                {openType != "view" && <span className="text-red-600">*</span>}
              </label>

              {openType == "view" ? (
                <span>{startDate}</span>
              ) : (
                <DatePicker
                  showTime
                  format={"YYYY-MM-DD h:mm a"}
                  onChange={(value) => {
                    setTaskInputs((prevValue) => ({
                      ...prevValue,
                      startDate: moment(value?.$d).format("YYYY-MM-DD HH:mm"),
                    }));
                  }}
                  defaultValue={
                    startDate ? dayjs(startDate, "YYYY-MM-DD HH:mm") : undefined
                  }
                  value={
                    startDate ? dayjs(startDate, "YYYY-MM-DD HH:mm") : undefined
                  }
                />
              )}
              <label className="font-bold">
                End Date{" "}
                {openType != "view" && <span className="text-red-600">*</span>}
              </label>
              {openType == "view" ? (
                <span>{endDate}</span>
              ) : (
                <DatePicker
                  showTime
                  format={"YYYY-MM-DD h:mm a"}
                  onChange={(value) =>
                    setTaskInputs((prevValue) => ({
                      ...prevValue,
                      endDate: moment(value?.$d).format("YYYY-MM-DD HH:mm"),
                    }))
                  }
                  defaultValue={
                    endDate ? dayjs(endDate, "YYYY-MM-DD HH:mm") : undefined
                  }
                  value={
                    endDate ? dayjs(endDate, "YYYY-MM-DD HH:mm") : undefined
                  }
                />
              )}
            </div>
          </div>
        </div>

        <div
          className="flex w-full justify-between items-center"
          style={{ marginTop: "45px" }}
        >
          <div style={{ margin: "10px 0" }} className="flex gap-5 items-center">
            {openType != "view" ? (
              <label
                className="p-5 flex items-center justify-center rounded-md cursor-pointer text-white"
                style={{ background: "#0055d1", height: "50px" }}
              >
                {imageUploadLoading ? (
                  <>
                    Loading
                    <LoadingOutlined
                      style={{ fontSize: "20px", marginLeft: "8px" }}
                    />
                  </>
                ) : (
                  "Choose File"
                )}
                <input
                  type="file"
                  multiple
                  hidden
                  accept="images/*"
                  onChange={handleImageChange}
                  disabled={imageUploadLoading}
                />
              </label>
            ) : null}
            <div style={{ display: "flex", gap: "20px" }}>
              {images?.length
                ? images.map(({ imageRef, imageUrl }, index) => (
                    <div style={{ display: "flex" }}>
                      <PreviewGroup items={[imageUrl]} key={index}>
                        <AntdImage
                          src={imageUrl}
                          width={100}
                          height={100}
                          style={{ borderRadius: "50%", objectFit: "cover" }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </PreviewGroup>
                      <Popconfirm
                        key={index}
                        title="Are you sure that you want to remove this picture"
                        onConfirm={() => handleImageRemove(imageRef, imageUrl)}
                        okButtonProps={{
                          style: { background: "rgb(37 99 235)" },
                          loading: imageRemoveLoading,
                          htmlType: "submit",
                        }}
                      >
                        {openType != "view" ? (
                          <Badge
                            style={{ cursor: "pointer", zIndex: 10 }}
                            count={"X"}
                            title="Click to remove"
                            className="remove-button"
                          />
                        ) : null}
                      </Popconfirm>
                    </div>
                  ))
                : null}
            </div>
          </div>
          {openType != "view" ? (
            <div className="flex gap-3 items-center">
              <Button onClick={() => setTaskInputs(defaultTaskValue)} danger>
                Reset
              </Button>
              <Button
                disabled={disableSubmitButton}
                onClick={handleSubmit}
                title={
                  disableSubmitButton
                    ? "please fill the important fields title, startDate and endDate"
                    : ""
                }
                loading={taskSubmitLoading}
              >
                {isUpdate ? "Update" : "Add"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export default TaskModal;
