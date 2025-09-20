"use server";

import { revalidatePath } from "next/cache";
import path from "path";
import fs from "fs/promises";
import { getCurrentUser } from "@/app/_server/actions/users/current";
import { getDocsUserDir } from "@/app/_server/utils/notes-files";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadImageAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const file = formData.get("image") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return {
        success: false,
        error: "Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.",
      };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: "File too large. Maximum size is 5MB." };
    }

    const userDir = await getDocsUserDir();
    const imagesDir = path.join(userDir, "images");

    await fs.mkdir(imagesDir, { recursive: true });

    const fileExtension = path.extname(file.name);
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${fileExtension}`;
    const filePath = path.join(imagesDir, fileName);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    await fs.writeFile(filePath, buffer);

    const imageUrl = `/api/image/${user.username}/${fileName}`;

    return {
      success: true,
      data: {
        fileName: fileName,
        originalName: file.name,
        url: imageUrl,
      },
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    return { success: false, error: "Failed to upload image" };
  }
}

export async function getImagesAction() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const userDir = await getDocsUserDir();
    const imagesDir = path.join(userDir, "images");

    try {
      await fs.access(imagesDir);
    } catch {
      return { success: true, data: [] };
    }

    const files = await fs.readdir(imagesDir);
    const imageFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return [".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg"].includes(ext);
    });

    const images = imageFiles.map((file) => ({
      fileName: file,
      name: file.replace(/^\d+-/, "").replace(/\.[^/.]+$/, ""),
      url: `/api/image/${user.username}/${file}`,
    }));

    return { success: true, data: images };
  } catch (error) {
    console.error("Error getting images:", error);
    return { success: false, error: "Failed to get images" };
  }
}

export async function deleteImageAction(formData: FormData) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    const fileName = formData.get("fileName") as string;

    if (!fileName) {
      return { success: false, error: "Missing parameters" };
    }

    const userDir = await getDocsUserDir();
    const imagesDir = path.join(userDir, "images");
    const filePath = path.join(imagesDir, fileName);

    try {
      await fs.unlink(filePath);
      return { success: true };
    } catch (error) {
      return { success: false, error: "File not found" };
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    return { success: false, error: "Failed to delete image" };
  }
}
