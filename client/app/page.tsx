'use client';

import { useAuthStore } from "@/store/useAuthStore";
import { redirect } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (user) {
      redirect("/dashboard");
    } else {
      redirect("/login");
    }
  }, [user]);

  return null;
}
