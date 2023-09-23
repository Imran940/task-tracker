import {
  getUserFromFirestore,
  roleAccess,
  sendEmail,
  updateUserInFirestore,
} from "@/lib/helpers";
import { useUserStore } from "@/store/UserStore";
import { ProjectRole, sendMailPayload } from "@/typings";
import {
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
} from "antd";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";
import { useModalStore } from "@/store/ModalStore";
import { UserAddOutlined } from "@ant-design/icons";

const { Item } = Form;
const { Option } = Select;
function InviteModal() {
  const {
    user: { name, email, role, invitedUsers = [] },
    user,
    setUserData,
  } = useUserStore((state) => state);
  const [form] = Form.useForm();
  const roles: ProjectRole[] = ["viewer", "editor", "owner"];
  const {
    inviteModalStates: {
      isOpen,
      loading,
      setFieldValues,
      resetFieldValues,
      openType,
      fieldValues: {
        name: invitedUserName,
        email: invitedUserEmail,
        role: invitedUserRole,
      },
    },
    setInviteModalState,
  } = useModalStore((state) => state);

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      key: "name",
      className: "cursor-pointer",
    },
    {
      title: "Email",
      dataIndex: "email",
      key: "email",
      className: "cursor-pointer",
    },
    {
      title: "Role",
      dataIndex: "role",
      key: "role",
      className: "cursor-pointer",
    },
    {
      title: "Status",
      key: "status",
      dataIndex: "status",
      className: "cursor-pointer",
      render: (status: "pending" | "active" | "block") => (
        <Tag
          color={
            status == "pending"
              ? "orange"
              : status == "active"
              ? "green"
              : "red"
          }
          key={status}
        >
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      //@ts-expect-error ignore this record and _ types
      render: (_, record) => (
        <Space size="middle">
          {record.status == "pending" ? <a>Re-Invite</a> : null}
          {/* going to add this block and un-block feature {record.status == "active" ? (
            <a>Block</a>
          ) : (
            record.status == "block" && <a>Un-Block</a>
          )} */}
          <Popconfirm
            okButtonProps={{
              title: "Delete",
              loading,
              style: { background: "red", color: "white" },
            }}
            title={`Are you sure that you want to delete this ${record.name}`}
            onConfirm={async (e) => {
              try {
                e?.stopPropagation();
                const newUser = { ...user };
                setInviteModalState({ loading: true });
                const newInvitedUsers = invitedUsers?.filter(
                  (i) => i.email != record.email
                );
                await updateUserInFirestore(email!, {
                  invitedUsers: newInvitedUsers,
                });
                newUser.invitedUsers = newInvitedUsers;
                toast(`Member ${record.name} deleted successfully`);
                setInviteModalState({ loading: false });
                setUserData(newUser);
              } catch (err) {
                console.log(err);
                toast("something happened wrong");
                setInviteModalState({ loading: false });
              }
            }}
          >
            <a onClick={(e) => e.stopPropagation()} className="text-red-600">
              Delete
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <Modal
      open={isOpen}
      onCancel={() => {
        setInviteModalState({
          isOpen: openType == "view" ? false : true,
          openType: "view",
        });
        form.resetFields();
        resetFieldValues();
      }}
      okText={<span>Send</span>}
      okButtonProps={{
        style: { background: "rgb(37 99 235)" },
        loading: loading,
        htmlType: "submit",
      }}
      footer={null}
      width={openType == "view" ? 800 : 370}
    >
      <div
        className="flex flex-col"
        style={{ gap: "18px", margin: "20px 15px" }}
      >
        {openType == "view" ? (
          <div className="flex flex-col gap-3">
            <div className="flex gap-3">
              <span className="text-2xl font-bold">All Members</span>
              {roleAccess[role!]?.includes("invite") ? (
                <Button
                  title="Click to add member"
                  icon={<UserAddOutlined />}
                  onClick={() => {
                    setInviteModalState({ isOpen: true, openType: "add" });
                    form.setFieldValue("role", "viewer");
                  }}
                >
                  ADD
                </Button>
              ) : null}
            </div>

            <Table
              onRow={(record) => {
                return {
                  onClick: () => {
                    setFieldValues(record);
                    form.setFieldsValue({
                      name: record.name,
                      email: record.email,
                      role: record.role,
                    });
                    setInviteModalState({ isOpen: true, openType: "edit" });
                  },
                };
              }}
              columns={columns}
              dataSource={invitedUsers}
            />
          </div>
        ) : (
          <>
            <h2 className="text-center text-lg font-semibold text-blue-600">
              {openType == "add" ? "Add Member" : "Update Member"}
            </h2>
            <Form
              onFinish={async (values) => {
                if (
                  (invitedUserEmail == values.email &&
                    invitedUserName == values.name &&
                    invitedUserRole == values.role) ||
                  role != "owner"
                ) {
                  return;
                }

                try {
                  const newUser = { ...user };
                  setInviteModalState({ loading: true });
                  let newInvitedUsers = [...invitedUsers];
                  const foundIndex = newInvitedUsers?.length
                    ? newInvitedUsers.findIndex((n) => n.email == values.email)
                    : -1;
                  if (openType == "add" && foundIndex >= 0) {
                    toast("Member already added", { type: "info" });
                    return;
                  }

                  let payload: sendMailPayload = {
                    email: values.email,
                    ...(openType == "edit"
                      ? {
                          message: `Hey <b>${values.name}</b>, ${name} the owner of the task management application has updated your information. Kindly check that. Thank you :)`,
                        }
                      : openType == "add" && {
                          message: `Hey <b>${values.name}</b>, ${name} the owner of the task management application is requesting you to visit their project by clicking the below link and You got the role of <b>${role}</b><br/>
                <a href=${process.env.NEXT_PUBLIC_HOST}/login/?ownerEmail=${email}&userEmail=${values.email}>Click here to go to project</a>`,
                        }),
                    subject:
                      openType == "add"
                        ? "Invitation of task management application"
                        : "Update on invitation of task management application",
                  };

                  //sending email to the user
                  await sendEmail(payload);

                  // updating user owner invitedUser field
                  if (foundIndex == -1)
                    newInvitedUsers.push({
                      id: uuidv4(),
                      ...values,
                      status: "pending",
                    });
                  else {
                    newInvitedUsers[foundIndex] = {
                      ...newInvitedUsers[foundIndex],
                      ...values,
                    };
                  }

                  //updating stuff in the owner's data
                  await updateUserInFirestore(email!, {
                    invitedUsers: newInvitedUsers,
                  });

                  //updating stuff in the user's data
                  if (openType == "edit") {
                    let userData = await getUserFromFirestore(invitedUserEmail);
                    userData = {
                      ...userData,
                      ...values,
                    };
                    await updateUserInFirestore(invitedUserEmail, userData!);
                  }

                  newUser.invitedUsers = newInvitedUsers;
                  toast(
                    openType == "add"
                      ? `Invitation email sent successfully to ${values.email}`
                      : "Member invitation updated successfully"
                  );
                  form.resetFields();
                  setUserData(newUser);
                  setInviteModalState({ loading: false, openType: "view" });
                } catch (err) {
                  console.log(err);
                  setInviteModalState({ loading: false });
                }
              }}
              className="flex flex-col space-y-3"
              autoComplete="off"
              form={form}
            >
              <Item
                label="Name"
                name="name"
                rules={[
                  {
                    required: true,
                    message: "Please input your username!",
                  },
                  {
                    min: 5,
                    message: "Name equal to 5 or more characters",
                  },
                ]}
                //initialValue={invitedUserName}
              >
                <Input placeholder="Enter the user's name" />
              </Item>
              <Item
                label="Email"
                name="email"
                rules={[
                  {
                    type: "email",
                    message: "The input is not valid E-mail!",
                  },
                  {
                    required: true,
                    message: "Please input your E-mail!",
                  },
                ]}
                //initialValue={invitedUserEmail}
              >
                <Input placeholder="Enter the user email" />
              </Item>
              <Item
                name="role"
                //initialValue={invitedUserRole}
                label="Role"
              >
                <Select className="w-full">
                  {roles.map((r, i) => (
                    <Option value={r} key={i}>
                      {r}
                    </Option>
                  ))}
                </Select>
              </Item>

              <Button
                className="bg-blue-600 text-white flex justify-center items-center gap-1 py-5 text-lg"
                htmlType="submit"
                loading={loading}
                style={{ background: " rgb(37 99 235)" }}
              >
                {openType == "add" ? (
                  <div className="flex justify-center items-center gap-1">
                    <span>Send</span>{" "}
                    <PaperAirplaneIcon width={20} className="-rotate-45" />
                  </div>
                ) : (
                  "Update"
                )}
              </Button>
            </Form>
          </>
        )}
      </div>
    </Modal>
  );
}

export default InviteModal;
