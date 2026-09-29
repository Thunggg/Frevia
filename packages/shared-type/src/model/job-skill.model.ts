import { z } from "zod";

export const JobSkillSchema = z.object({
  id: z.number(),

  jobId: z.number(),

  skillName: z.string().max(100),
});

export type JobSkillType = z.infer<typeof JobSkillSchema>;
