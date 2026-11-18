"use client";

import { useEffect } from "react";

/** Đổi palette mặc định (shadcn primary/muted/ring) sang xanh dương khi ở forum. */
export function ForumTheme() {
  useEffect(() => {
    document.documentElement.classList.add("forum-theme");
    return () => document.documentElement.classList.remove("forum-theme");
  }, []);

  return null;
}
