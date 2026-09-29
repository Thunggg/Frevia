import { toastError } from "@repo/ui/components/shadcn/toast";
import { ApiError } from "@shared/types";
import { UseFormSetError } from "react-hook-form";

export const handleErrorApi = ({
  error,
  setError,
  duration,
}: {
  error: ApiError;
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
