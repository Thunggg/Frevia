import { RoleName } from "../constants/role.constant";
import { z } from "zod";

const RoleSchema = z.object({
  id: z.number(),
  name: z.enum([RoleName.CLIENT, RoleName.FREELANCER, RoleName.ADMIN]),
  description: z.string().nullable(),
  createdAt: z.date(),
  deletedAt: z.date().nullable(),
});

export type RoleType = z.infer<typeof RoleSchema>;
