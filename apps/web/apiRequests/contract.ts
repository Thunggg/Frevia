import { http } from "@/lib/http";
import type {
  ContractDetailType,
  ContractType,
  GetContractListResponseType,
} from "@shared/types";

export const contractApi = {
  forProposal: (proposalId: number) =>
    http.get<GetContractListResponseType>(
      `/contracts?page=1&limit=1&proposalId=${proposalId}`,
    ),
  listCompleted: () =>
    http.get<GetContractListResponseType>(
      "/contracts?page=1&limit=50&status=COMPLETED",
    ),
  detail: (contractId: number) =>
    http.get<ContractDetailType>(`/contracts/${contractId}`),
  sign: (contractId: number) =>
    http.patch<ContractType>(`/contracts/${contractId}/sign`, {}),
  complete: (contractId: number) =>
    http.patch<ContractType>(`/contracts/${contractId}/complete`, {}),
};
