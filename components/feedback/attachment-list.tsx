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

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { File, Download, Image as ImageIcon, FileText, FileSpreadsheet } from "lucide-react";
import { formatFileSize } from "@/lib/utils/format";

interface Attachment {
  attachmentId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

interface AttachmentListProps {
  attachments: Attachment[];
  className?: string;
}

export function AttachmentList({ attachments, className }: AttachmentListProps) {
  if (attachments.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        暂无附件
      </div>
    );
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) {
      return <ImageIcon className="w-5 h-5 text-blue-500" />;
    }
    if (mimeType.includes("pdf")) {
      return <FileText className="w-5 h-5 text-red-500" />;
    }
    if (mimeType.includes("word")) {
      return <FileText className="w-5 h-5 text-blue-600" />;
    }
    if (mimeType.includes("excel") || mimeType.includes("spreadsheet")) {
      return <FileSpreadsheet className="w-5 h-5 text-green-600" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className={className}>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <Card key={attachment.attachmentId} className="p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className="shrink-0">
                  {getFileIcon(attachment.mimeType)}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{attachment.fileName}</p>
                  <p className="text-sm text-muted-foreground">
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                asChild
              >
                <a
                  href={`/${attachment.filePath}`}
                  download={attachment.fileName}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  下载
                </a>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
