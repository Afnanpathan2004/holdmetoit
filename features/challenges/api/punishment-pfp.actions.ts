"use server";

import {
   AdminAccessError,
   requireAdminUser,
} from "@/features/auth/api/require-admin";
import {
   deleteManagedChallengeImage,
   isManagedChallengeImageUrl,
   uploadChallengeImage,
} from "@/core/storage/supabase-storage";
import { isChallengeImageReferenced } from "@/features/challenges/data/punishment-pfp.repository";
import {
   isChallengeImagePurpose,
   validatePunishmentPfpFile,
} from "@/features/challenges/domain/punishment-pfp";

export type PunishmentPfpActionResult<T = undefined> =
   { ok: true; data?: T } | { ok: false; code: string; message: string };

export async function uploadChallengeImageAction(
   formData: FormData
): Promise<PunishmentPfpActionResult<{ url: string }>> {
   try {
      await requireAdminUser();

      const purpose = formData.get("purpose");
      if (!isChallengeImagePurpose(purpose)) {
         return {
            ok: false,
            code: "INVALID_INPUT",
            message: "Please select a valid image purpose.",
         };
      }

      const file = formData.get("file");
      if (!(file instanceof File)) {
         return {
            ok: false,
            code: "INVALID_INPUT",
            message: "Please choose an image to upload.",
         };
      }

      const validation = validatePunishmentPfpFile({
         type: file.type,
         size: file.size,
         headerBytes: new Uint8Array(await file.slice(0, 12).arrayBuffer()),
      });

      if (!validation.ok) {
         return {
            ok: false,
            code: "INVALID_INPUT",
            message: validation.reason,
         };
      }

      const { url } = await uploadChallengeImage(
         {
            bytes: await file.arrayBuffer(),
            contentType: validation.contentType,
            ext: validation.ext,
         },
         purpose
      );

      return { ok: true, data: { url } };
   } catch (error) {
      if (error instanceof AdminAccessError) {
         return { ok: false, code: error.code, message: error.message };
      }
      console.error("[challenge-images] Upload failed:", error);
      return {
         ok: false,
         code: "UPLOAD_FAILED",
         message: "Could not upload the image. Please try again.",
      };
   }
}

/**
 * Deletes an uploaded-but-never-saved image (e.g. the admin replaced it before
 * submitting). Refuses anything that is not our managed file or that a
 * challenge still references.
 */
export async function discardChallengeImageUploadAction(
   url: string
): Promise<PunishmentPfpActionResult> {
   try {
      await requireAdminUser();

      if (typeof url !== "string" || !isManagedChallengeImageUrl(url)) {
         return { ok: true };
      }
      if (await isChallengeImageReferenced(url)) {
         return { ok: true };
      }

      await deleteManagedChallengeImage(url);
      return { ok: true };
   } catch (error) {
      if (error instanceof AdminAccessError) {
         return { ok: false, code: error.code, message: error.message };
      }
      return {
         ok: false,
         code: "DISCARD_FAILED",
         message: "Could not discard the uploaded image.",
      };
   }
}
