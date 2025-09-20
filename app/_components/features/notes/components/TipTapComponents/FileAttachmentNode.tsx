"use client";

import { NodeViewWrapper, ReactNodeViewProps } from "@tiptap/react";
import { FileAttachment } from "@/app/_components/ui/elements/FileAttachment";

export function FileAttachmentNode({ node }: ReactNodeViewProps) {
  const { url, fileName, mimeType, type } = node.attrs as {
    url: string;
    fileName: string;
    mimeType: string;
    type: 'image' | 'file';
  };

  return (
    <NodeViewWrapper
      className="file-attachment-wrapper"
      data-file-attachment=""
      data-url={url}
      data-file-name={fileName}
      data-mime-type={mimeType}
      data-type={type}
    >
      <FileAttachment
        url={url}
        fileName={fileName}
        mimeType={mimeType}
        type={type}
        className="my-4"
      />
    </NodeViewWrapper>
  );
}
