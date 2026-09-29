import { z } from "zod";
import { PaginationSchema } from "./forum-post.model";

// Schema cơ bản của ForumComment
export const ForumCommentSchema = z.object({
  id: z.number(),
  postId: z.number(),
  user: z.object({
    id: z.number(),
    profile: z
      .object({
        displayName: z.string().nullable(),
        avatarUrl: z.string().nullable(),
      })
      .nullable(),
  }),
  content: z.string().min(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// Schema cho filter query params (page, limit)
export const ForumCommentFilterSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).default(10),
});

// Schema response khi lấy danh sách comments (comments + pagination)
export const ForumCommentListResponseSchema = z.object({
  comments: z.array(ForumCommentSchema),
  pagination: PaginationSchema,
});

// Type của ForumComment
export type ForumCommentType = z.infer<typeof ForumCommentSchema>;

// Type của filter query params
export type ForumCommentFilterType = z.infer<
  typeof ForumCommentFilterSchema
> & {
  postId: number;
};

// Type của danh sách comments response
export type ForumCommentListResponseType = z.infer<
  typeof ForumCommentListResponseSchema
>;

export const CreateForumCommentSchema = z.object({
  content: z.string().min(1),
});

export type CreateForumCommentType = z.infer<typeof CreateForumCommentSchema>;

export const CreateForumCommentResponseSchema = ForumCommentSchema;

export const EditForumCommentSchema = z.object({
  content: z.string().min(1),
});

export type EditForumCommentType = z.infer<typeof EditForumCommentSchema>;

export const EditForumCommentResponseSchema = ForumCommentSchema;

export const DeleteForumCommentResponseSchema = ForumCommentSchema;

// Schema cho toggle like comment
export const ToggleLikeCommentSchema = z.object({
  liked: z.boolean(),
});

export type ToggleLikeCommentType = z.infer<typeof ToggleLikeCommentSchema>;
