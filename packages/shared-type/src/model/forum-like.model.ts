import { z } from "zod";

// Schema cho ForumLike model
export const ForumLikeSchema = z.object({
  id: z.number(),
  userId: z.number(),
  postId: z.number().nullable(),
  commentId: z.number().nullable(),
  reactionType: z.string(),
  createdAt: z.date(),
});

// Schema cho ToggleLikeResponse response type
export const ToggleLikeResponseSchema = z.object({
  liked: z.boolean(),
});

export type ForumLikeType = z.infer<typeof ForumLikeSchema>;
export type ToggleLikeResponseType = z.infer<typeof ToggleLikeResponseSchema>;
