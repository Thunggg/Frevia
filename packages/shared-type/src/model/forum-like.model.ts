import { z } from "zod";

export const ForumLikeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  postId: z.number().nullable(),
  commentId: z.number().nullable(),
  reactionType: z.string(),
  createdAt: z.date(),
});

export const CreateForumLikeResponseSchema = ForumLikeSchema;

export type ForumLikeType = z.infer<typeof ForumLikeSchema>;
export type CreateForumLikeResponseType = z.infer<
  typeof CreateForumLikeResponseSchema
>;
