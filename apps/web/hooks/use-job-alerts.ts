import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  CreateJobAlertBodyType,
  GetJobAlertsQueryType,
  UpdateJobAlertBodyType,
} from "@shared/types";

import { jobAlertApiRequest } from "@/apiRequests/job-alert";

export const jobAlertKeys = {
  all: ["job-alerts"] as const,
  list: (query: GetJobAlertsQueryType) =>
    [...jobAlertKeys.all, "list", query] as const,
};

export function useJobAlerts(query: GetJobAlertsQueryType) {
  return useQuery({
    queryKey: jobAlertKeys.list(query),
    queryFn: () =>
      jobAlertApiRequest
        .getAll(query)
        .then((response) => (response.success ? response.data : undefined)),
    staleTime: 30_000,
  });
}

export function useCreateJobAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateJobAlertBodyType) =>
      jobAlertApiRequest.create(body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jobAlertKeys.all }),
  });
}

export function useUpdateJobAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: UpdateJobAlertBodyType }) =>
      jobAlertApiRequest.update(id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jobAlertKeys.all }),
  });
}

export function useDeleteJobAlert() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => jobAlertApiRequest.delete(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: jobAlertKeys.all }),
  });
}
