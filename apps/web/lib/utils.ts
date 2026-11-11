import { toastError } from "@repo/ui/components/shadcn/toast";
import { ApiError } from "@shared/types";
import { UseFormSetError } from "react-hook-form";
import { ApiFail } from "./http";

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: ApiError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  setError: UseFormSetError<any>;
  duration?: number;
}) => {
  if (error.error.details && error.error.details.length > 0) {
    error.error.details.forEach((detail) => {
      setError(detail.path, {
        type: "server",
        message: detail.message,
      });
    });
  } else {
    toastError({ message: error.error.message, duration });
  }
};

export function getBookmarkErrorMessage(
  error: unknown,
  t: (key: string) => string,
  isRemoving = false,
): string {
  let rawMessage = "";

  if (error instanceof ApiFail) {
    const res = error.response as Record<string, unknown> | undefined;
    const errorObj = res?.error as Record<string, unknown> | undefined;
    const details = errorObj?.details as Array<{ message?: string }> | undefined;
    const detailMsg = details?.[0]?.message;
    const errorMsg =
      typeof errorObj?.message === "string" ? errorObj.message : undefined;
    const topMsg = typeof res?.message === "string" ? res.message : undefined;

    rawMessage = detailMsg || errorMsg || topMsg || error.message || "";
  } else if (error instanceof Error) {
    rawMessage = error.message;
  }

  if (rawMessage) {
    if (rawMessage.includes("CannotBookmarkOwnJob")) {
      return t("errorCannotBookmarkOwnJob");
    }
    if (rawMessage.includes("CannotBookmarkUnavailableJob")) {
      return t("errorCannotBookmarkUnavailableJob");
    }
    if (rawMessage.includes("JobAlreadyBookmarked")) {
      return t("errorJobAlreadyBookmarked");
    }
    if (rawMessage.includes("BookmarkJobOnlyForFreelancer")) {
      return t("errorBookmarkJobOnlyForFreelancer");
    }
    if (rawMessage.includes("JobNotFound")) {
      return t("errorJobNotFound");
    }
    if (rawMessage.includes("BookmarkNotFound")) {
      return t("errorBookmarkNotFound");
    }
    if (rawMessage.includes("FailedToBookmarkJob")) {
      return t("errorFailedToBookmarkJob");
    }
    if (rawMessage.includes("FailedToRemoveBookmark")) {
      return t("errorFailedToRemoveBookmark");
    }

    return rawMessage;
  }

  return isRemoving ? t("removeFailed") : t("updateFailed");
}
