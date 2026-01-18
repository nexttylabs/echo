"use client";


/*
 * Copyright (c) 2026 Echo Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Upload, File as FileIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type UploadStatus = "pending" | "uploading" | "success" | "error";

interface UploadedFile {
  file: File;
  preview?: string;
  status: UploadStatus;
  attachmentId?: number;
}

interface FileUploadProps {
  feedbackId?: number;
  onFilesSelected?: (count: number) => void;
  onUploaded?: (ids: number[]) => void;
  maxSize?: number;
  accept?: string;
}

export function FileUpload({
  feedbackId,
  onFilesSelected,
  onUploaded,
  maxSize = 5 * 1024 * 1024,
  accept = "image/png,image/jpeg,image/gif,application/pdf",
}: FileUploadProps) {
  const t = useTranslations("feedback.fileUpload");
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const allowedTypes = useMemo(() => accept.split(","), [accept]);
  const maxSizeMb = useMemo(() => Math.round(maxSize / 1024 / 1024), [maxSize]);

  const notifySelection = useCallback(
    (nextFiles: UploadedFile[]) => {
      onFilesSelected?.(nextFiles.length);
    },
    [onFilesSelected],
  );

  const validateFile = useCallback(
    (file: File): string | null => {
      if (file.size > maxSize) {
        return t("errors.size", { maxMb: maxSizeMb });
      }
      if (!allowedTypes.includes(file.type)) {
        return t("errors.type");
      }
      return null;
    },
    [allowedTypes, maxSize, maxSizeMb, t],
  );

  const handleFiles = useCallback(
    (newFiles: File[]) => {
      const validFiles: UploadedFile[] = [];

      for (const file of newFiles) {
        const error = validateFile(file);
        if (error) {
          alert(error);
          continue;
        }

        const preview = file.type.startsWith("image/")
          ? URL.createObjectURL(file)
          : undefined;

        validFiles.push({ file, preview, status: "pending" });
      }

      setFiles((prev) => {
        const nextFiles = [...prev, ...validFiles];
        notifySelection(nextFiles);
        return nextFiles;
      });
    },
    [notifySelection, validateFile],
  );

  useEffect(() => {
    return () => {
      files.forEach((file) => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [files]);

  const uploadFiles = async () => {
    if (!feedbackId) {
      alert(t("errors.missingFeedbackId"));
      return;
    }

    const pending = files.filter((file) => file.status === "pending");

    for (const fileItem of pending) {
      setFiles((prev) =>
        prev.map((item) =>
          item === fileItem ? { ...item, status: "uploading" } : item,
        ),
      );

      try {
        const formData = new FormData();
        formData.append("files", fileItem.file);
        formData.append("feedbackId", String(feedbackId));

        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          setFiles((prev) =>
            prev.map((item) =>
              item === fileItem ? { ...item, status: "error" } : item,
            ),
          );
          continue;
        }

        const result = await response.json();
        const attachmentId = result.data?.[0]?.attachmentId as number | undefined;

        setFiles((prev) =>
          prev.map((item) =>
            item === fileItem
              ? { ...item, status: "success", attachmentId }
              : item,
          ),
        );
      } catch {
        setFiles((prev) =>
          prev.map((item) =>
            item === fileItem ? { ...item, status: "error" } : item,
          ),
        );
      }
    }

    const uploadedIds = files
      .filter((file) => file.attachmentId !== undefined)
      .map((file) => file.attachmentId as number);

    onUploaded?.(uploadedIds);
  };

  const removeFile = (fileItem: UploadedFile) => {
    setFiles((prev) => {
      const nextFiles = prev.filter((file) => file !== fileItem);
      notifySelection(nextFiles);
      return nextFiles;
    });
    if (fileItem.preview) {
      URL.revokeObjectURL(fileItem.preview);
    }
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          handleFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-muted-foreground/25 hover:border-muted-foreground/50",
        )}
      >
        <input
          id="file-upload"
          type="file"
          multiple
          accept={accept}
          onChange={(event) =>
            handleFiles(Array.from(event.target.files ?? []))
          }
          className="hidden"
        />
        <label htmlFor="file-upload" className="cursor-pointer">
          <Upload className="mx-auto h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            {t("dropzone.title")}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {t("dropzone.subtitle", { maxMb: maxSizeMb })}
          </p>
        </label>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((fileItem) => (
            <div
              key={`${fileItem.file.name}-${fileItem.file.size}`}
              className="flex items-center gap-3 p-3 border rounded-lg"
            >
              {fileItem.preview ? (
                <Image
                  src={fileItem.preview}
                  alt={fileItem.file.name}
                  width={48}
                  height={48}
                  unoptimized
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 bg-muted rounded flex items-center justify-center">
                  <FileIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {fileItem.file.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  {(fileItem.file.size / 1024).toFixed(1)} KB
                </p>
              </div>

              <div className="text-xs">
                {fileItem.status === "pending" && t("status.pending")}
                {fileItem.status === "uploading" && t("status.uploading")}
                {fileItem.status === "success" && t("status.success")}
                {fileItem.status === "error" && t("status.error")}
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeFile(fileItem)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}

          <Button
            type="button"
            onClick={uploadFiles}
            disabled={!feedbackId || files.every((file) => file.status !== "pending")}
            className="w-full"
          >
            {t("buttons.upload")}
          </Button>
        </div>
      )}
    </div>
  );
}
