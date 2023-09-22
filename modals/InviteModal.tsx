import { sendEmail, updateUserInFirestore } from "@/lib/helpers";
import { useUserStore } from "@/store/UserStore";
import { ModalState, ProjectRole, sendMailPayload } from "@/typings";
import { Button, Form, Input, Modal, Select } from "antd";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { PaperAirplaneIcon } from "@heroicons/react/24/solid";

const { Item } = Form;
const { Option } = Select;
function InviteModal({
  inviteModalState,
  setInviteModal,
}: {
  inviteModalState: ModalState;
  setInviteModal: any;
}) {
  const {
    user: { name, email, role, invitedUsers = [] },
  } = useUserStore((state) => state);
  const [form] = Form.useForm();
  const roles: ProjectRole[] = ["viewer", "editor", "owner"];
  const { open, loading } = inviteModalState || {};
  return (
    <Modal
      open={open}
      onCancel={() =>
        setInviteModal((prevValue: ModalState) => ({
          ...prevValue,
          open: false,
        }))
      }
      okText={<span>Send</span>}
      okButtonProps={{
        style: { background: "rgb(37 99 235)" },
        loading: loading,
        htmlType: "submit",
      }}
      footer={null}
      onOk={() => {}}
      width={350}
    >
      <h2 className="text-center text-lg font-semibold text-blue-600 my-3">
        Member Invitation
      </h2>
      <Form
        onFinish={async (values) => {
          console.log({ role, values });
          if (role == "owner") {
            try {
              setInviteModal((prevValues: ModalState) => ({
                ...prevValues,
                loading: true,
              }));
              let payload: sendMailPayload = {
                ...values,
                fromEmail: email,
                ownerName: name,
              };
              const response = await sendEmail(payload);
              console.log(response);
              // updating user owner invitedUser field
              let newInvitedUsers = [...invitedUsers];
              const foundIndex = newInvitedUsers?.length
                ? newInvitedUsers.findIndex((n) => n.email == values.email)
                : -1;

              if (foundIndex == -1)
                newInvitedUsers.push({
                  id: uuidv4(),
                  email: values.toEmail,
                  name: values.name,
                  role: values.role,
                  status: "pending",
                });
              else {
                newInvitedUsers[foundIndex] = {
                  ...newInvitedUsers[foundIndex],
                  ...values,
                  email: values.toEmail,
                };
              }
              await updateUserInFirestore(email!, {
                invitedUsers: newInvitedUsers,
              });
              toast(response);
              form.resetFields();
              setInviteModal((preValue: ModalState) => ({
                ...preValue,
                open: false,
                loading: false,
              }));
            } catch (err) {
              console.log(err);
              setInviteModal((preValue: ModalState) => ({
                ...preValue,
                loading: false,
              }));
            }
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
        >
          <Input
            // pattern=".{5,}"
            // title="please enter name containing 5 or more characters"
            // name="name"
            placeholder="Enter the user's name"
          />
        </Item>
        <Item
          label="Email"
          name="toEmail"
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
        >
          <Input placeholder="Enter the user email" />
        </Item>
        <Item name="role" initialValue={"viewer"} label="Role">
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
        >
          <span>Send</span>{" "}
          <PaperAirplaneIcon width={20} className="-rotate-45" />
        </Button>
      </Form>
    </Modal>
  );
}

export default InviteModal;
