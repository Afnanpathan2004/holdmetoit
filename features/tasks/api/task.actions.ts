"use server";

import { revalidatePath } from "next/cache";
import { AuthError, requireSessionUser } from "@/features/auth/api/require-session";
import {
  createCategorySchema,
  createTaskSchema,
  deleteTaskSchema,
  toggleTaskSchema,
  type CreateCategoryInput,
  type CreateTaskInput,
  type DeleteTaskInput,
  type ToggleTaskInput,
} from "@/features/tasks/domain/task.validation";
import {
  createCategory,
  createTask,
  deleteTask,
  toggleTask,
} from "@/features/tasks/data/task.repository";

export interface TaskActionResult<T = unknown> {
  ok: boolean;
  message?: string;
  code?: string;
  data?: T;
}

export async function createTaskAction(
  input: CreateTaskInput,
): Promise<TaskActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = createTaskSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Invalid task input.",
      };
    }

    const task = await createTask({
      userId: user.id,
      title: parsed.data.title,
      taskType: parsed.data.taskType,
      categoryId: parsed.data.categoryId,
      newCategoryName: parsed.data.newCategoryName,
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true, data: task };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }
    return {
      ok: false,
      code: "PERSISTENCE_ERROR",
      message: "Could not create task. Please try again.",
    };
  }
}

export async function toggleTaskAction(
  input: ToggleTaskInput,
): Promise<TaskActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = toggleTaskSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Invalid task update.",
      };
    }

    const updated = await toggleTask({
      taskId: parsed.data.taskId,
      userId: user.id,
      isComplete: parsed.data.isComplete,
    });

    if (!updated) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "Task not found or access denied.",
      };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true, data: updated };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }
    return {
      ok: false,
      code: "PERSISTENCE_ERROR",
      message: "Could not update task.",
    };
  }
}

export async function deleteTaskAction(
  input: DeleteTaskInput,
): Promise<TaskActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = deleteTaskSchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Invalid task id.",
      };
    }

    const deleted = await deleteTask({
      taskId: parsed.data.taskId,
      userId: user.id,
    });

    if (!deleted) {
      return {
        ok: false,
        code: "NOT_FOUND",
        message: "Task not found or access denied.",
      };
    }

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }
    return {
      ok: false,
      code: "PERSISTENCE_ERROR",
      message: "Could not delete task.",
    };
  }
}

export async function createCategoryAction(
  input: CreateCategoryInput,
): Promise<TaskActionResult> {
  try {
    const user = await requireSessionUser();
    const parsed = createCategorySchema.safeParse(input);

    if (!parsed.success) {
      return {
        ok: false,
        code: "INVALID_INPUT",
        message: parsed.error.issues[0]?.message || "Invalid category name.",
      };
    }

    const category = await createCategory({
      userId: user.id,
      name: parsed.data.name,
    });

    revalidatePath("/");
    revalidatePath("/dashboard");
    return { ok: true, data: category };
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }
    return {
      ok: false,
      code: "PERSISTENCE_ERROR",
      message: "Could not create category.",
    };
  }
}
