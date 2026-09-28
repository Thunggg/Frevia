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

// Schema cho viewForumLikeDetail
// Sử dụng z.array vì findMany sẽ trả về mảng các bản ghi
export const ForumLikeDetailResponseSchema = z.array(
  z.object({
    id: z.number(),
    userId: z.number(),
    postId: z.number().nullable(),
    commentId: z.number().nullable(),
    reactionType: z.string(),
    createdAt: z.date(),
    user: z.object({
      id: z.number(),
      profile: z
        .object({
          displayName: z.string().nullable(),
          avatarUrl: z.string().nullable(),
        })
        .nullable(),
    }),
  }),
);

export type ForumLikeDetailResponseType = z.infer<
  typeof ForumLikeDetailResponseSchema
>;
