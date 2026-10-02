import { z } from "zod";

export const JobSkillSchema = z.object({
  jobId: z.number(),

  skillId: z.number(),

  skill: z.object({
    name: z.string().max(100),
  }),
});

export type JobSkillType = z.infer<typeof JobSkillSchema>;
