import z from "zod";

export const ContractStatusEnum = z.enum([
    'AWAITING_PAYMENT',
    'PENDING_SIGN',
    'ACTIVE',
    'COMPLETED',
    'DISPUTED',
    'CANCELLED',
    'REJECTED',
    'EXPIRED',
]);