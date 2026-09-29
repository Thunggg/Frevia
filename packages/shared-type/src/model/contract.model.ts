import { z } from 'zod';
import { ManageContractMessage } from '../message/manage-contract.message';

export const ContractStatusEnum = z.enum([
  'PENDING_SIGN',
  'ACTIVE',
  'COMPLETED',
  'DISPUTED',
  'CANCELLED',
]);

export const PaymentStatusEnum = z.enum(['PENDING', 'PAID']);

export const ContractSchema = z.object({
  id: z.number(),
  jobId: z.number(),
  clientId: z.number(),
  freelancerId: z.number(),
  escrowContractAddress: z.string().nullable(),
  terms: z.string().nullable(),
  totalAmount: z.any(),
  depositPercent: z.any(),
  status: ContractStatusEnum,
  paymentStatus: PaymentStatusEnum,
  signedByClient: z.boolean(),
  signedByFreelancer: z.boolean(),
  createdAt: z.date(),
  signedAt: z.date().nullable(),
  completedAt: z.date().nullable(),
  expiresAt: z.date().nullable(),
  deletedAt: z.date().nullable(),
});

export const CreateContractBodySchema = z.object({
  jobId: z.number(ManageContractMessage.JOB_ID_REQUIRED).int().positive(),

  clientId: z.number(ManageContractMessage.CLIENT_ID_REQUIRED).int().positive(),

  freelancerId: z
    .number(ManageContractMessage.FREELANCER_ID_REQUIRED)
    .int()
    .positive(),

  totalAmount: z
    .number(ManageContractMessage.TOTAL_AMOUNT_REQUIRED)
    .positive(ManageContractMessage.TOTAL_AMOUNT_POSITIVE),

  depositPercent: z
    .number()
    .min(0, ManageContractMessage.DEPOSIT_PERCENT_RANGE)
    .max(100, ManageContractMessage.DEPOSIT_PERCENT_RANGE)
    .default(0),

  terms: z.string().optional(),

  escrowContractAddress: z.string().max(42).optional(),

  expiresAt: z
    .string()
    .datetime(ManageContractMessage.EXPIRES_AT_FUTURE)
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: ManageContractMessage.EXPIRES_AT_FUTURE },
    ),
});

export const CreateContractResponseSchema = ContractSchema;

export type ContractType = z.infer<typeof ContractSchema>;
export type CreateContractBodyType = z.infer<typeof CreateContractBodySchema>;
export type CreateContractResponseType = z.infer<typeof CreateContractResponseSchema>;

export const UpdateContractTermsBodySchema = z.object({
  terms: z.string().optional(),

  totalAmount: z
    .number()
    .positive(ManageContractMessage.TOTAL_AMOUNT_POSITIVE)
    .optional(),

  depositPercent: z
    .number()
    .min(0, ManageContractMessage.DEPOSIT_PERCENT_RANGE)
    .max(100, ManageContractMessage.DEPOSIT_PERCENT_RANGE)
    .optional(),

  escrowContractAddress: z.string().max(42).optional(),

  expiresAt: z
    .string()
    .datetime(ManageContractMessage.EXPIRES_AT_FUTURE)
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return new Date(val) > new Date();
      },
      { message: ManageContractMessage.EXPIRES_AT_FUTURE },
    ),
});

export const UpdateContractTermsResponseSchema = ContractSchema;

export type UpdateContractTermsBodyType = z.infer<typeof UpdateContractTermsBodySchema>;
export type UpdateContractTermsResponseType = z.infer<typeof UpdateContractTermsResponseSchema>;

export const CompleteContractResponseSchema = ContractSchema;
export type CompleteContractResponseType = z.infer<typeof CompleteContractResponseSchema>;

export const SignContractResponseSchema = ContractSchema;
export type SignContractResponseType = z.infer<typeof SignContractResponseSchema>;

export const CancelContractResponseSchema = ContractSchema;
export type CancelContractResponseType = z.infer<typeof CancelContractResponseSchema>;

