import z from "zod";

export const ContractStatusEnum = z.enum([
    'PENDING_SIGN',
    'ACTIVE',
    'COMPLETED',
    'DISPUTED',
    'CANCELLED',
]);