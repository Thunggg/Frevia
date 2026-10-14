import { adminApiRequest } from "@/apiRequests/admin";
import type {
  AdminCreateUserBodyType,
  AdminUpdateClientProfileBodyType,
  AdminUpdateUserBodyType,
  ApiResponse,
} from "@shared/types";
import { useMutation } from "@tanstack/react-query";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (body: AdminCreateUserBodyType) =>
      adminApiRequest.createUser(body).then(extractData),
  });
}

export function useUpdateUser() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminUpdateUserBodyType;
    }) => adminApiRequest.updateUser(id, body).then(extractData),
  });
}

export function useUpdateClientProfile() {
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: AdminUpdateClientProfileBodyType;
    }) => adminApiRequest.updateClientProfile(id, body).then(extractData),
  });
}
