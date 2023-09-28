"use client";
import { useUserStore } from "@/store/UserStore";
import { Spin } from "antd";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "react-toastify";
import { parse } from "url";

function Page() {
  const params =
    typeof document !== "undefined" &&
    typeof location != "undefined" &&
    location.search
      ? parse(location.search, true)
      : null;
  const router = useRouter();
  const { setUserData } = useUserStore((state) => state);

  useEffect(() => {
    if (params?.query) {
      (async () => {
        try {
          let payload = { ...params.query };
          const response = await fetch("/api/google_callback", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          });
          const result = await response.json();
          //@ts-expect-error ignore this check for the result.data
          setUserData({ googleTokens: result.data });
          router.push("/");
          toast("Authorization completed successfully :)", {
            type: "success",
          });
        } catch (err) {
          console.log(err);
          toast("Something happened wrong", { type: "error" });
        }
      })();
    } else {
      router.push("/");
    }
  }, []);

  return (
    <div className="w-full h-screen flex items-center justify-center">
      <Spin size="large" tip={"Loading..."} spinning={true}>
        Wait for a minute
      </Spin>
    </div>
  );
}

export default Page;
