import { NextResponse } from "next/server";
import {
   AuthError,
   requireSessionUser,
} from "@/features/auth/api/require-session";
import { batchSyncSchema } from "@/features/tasks/domain/task-sync.schema";
import { processBatchSync } from "@/features/tasks/data/task-sync.repository";
import { cacheTags, invalidateTags } from "@/core/cache";

export async function POST(request: Request) {
   try {
      const user = await requireSessionUser();

      const body = await request.json().catch(() => null);
      const parsed = batchSyncSchema.safeParse(body);

      if (!parsed.success) {
         return NextResponse.json(
            {
               success: false,
               error:
                  parsed.error.issues[0]?.message ||
                  "Invalid batch sync payload.",
            },
            { status: 400 }
         );
      }

      const result = await processBatchSync(user.id, parsed.data.mutations);
      if (result.success && result.processedMutationIds.length > 0) {
         invalidateTags([cacheTags.userTasks(user.id)]);
      }
      return NextResponse.json(result);
   } catch (error) {
      if (error instanceof AuthError) {
         return NextResponse.json(
            { success: false, error: "Unauthorized" },
            { status: 401 }
         );
      }

      console.error("[TaskSync] Server route error:", error);
      return NextResponse.json(
         { success: false, error: "Internal sync error occurred" },
         { status: 500 }
      );
   }
}
