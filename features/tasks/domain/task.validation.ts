import { z } from "zod";

export const taskTypeSchema = z.enum(["DAILY", "WEEKLY"]);

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, "Task title cannot be empty.")
      .max(255, "Task title cannot exceed 255 characters."),
    taskType: taskTypeSchema,
    categoryId: z.string().trim().min(1).optional(),
    newCategoryName: z
      .string()
      .trim()
      .min(1, "Category name cannot be empty.")
      .max(100, "Category name cannot exceed 100 characters.")
      .optional(),
  })
  .refine((data) => Boolean(data.categoryId || data.newCategoryName), {
    message: "Either an existing category or a new category name must be provided.",
    path: ["categoryId"],
  });

export const toggleTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Task ID is required."),
  isComplete: z.boolean(),
});

export const deleteTaskSchema = z.object({
  taskId: z.string().trim().min(1, "Task ID is required."),
});

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Category name cannot be empty.")
    .max(100, "Category name cannot exceed 100 characters."),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type ToggleTaskInput = z.infer<typeof toggleTaskSchema>;
export type DeleteTaskInput = z.infer<typeof deleteTaskSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
