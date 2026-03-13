"use client";

import { useCallback, useRef, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { X, Upload } from "lucide-react";
import { SUPPORTED_EXTENSIONS } from "@/lib/constants";

export interface ImageFile {
  name: string;
  extension: string;
  dataBase64: string;
}

interface ImageInputProps {
  files: ImageFile[];
  onFilesChange: (files: ImageFile[]) => void;
  urls: string;
  onUrlsChange: (urls: string) => void;
  disabled: boolean;
}

export function ImageInput({
  files,
  onFilesChange,
  urls,
  onUrlsChange,
  disabled,
}: ImageInputProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList) => {
      const newFiles: ImageFile[] = [];
      const promises: Promise<void>[] = [];

      Array.from(fileList).forEach((file) => {
        const ext = "." + file.name.split(".").pop()?.toLowerCase();
        if (!SUPPORTED_EXTENSIONS.has(ext)) return;

        promises.push(
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = (reader.result as string).split(",")[1];
              newFiles.push({
                name: file.name,
                extension: ext,
                dataBase64: base64,
              });
              resolve();
            };
            reader.readAsDataURL(file);
          })
        );
      });

      Promise.all(promises).then(() => {
        onFilesChange([...files, ...newFiles]);
      });
    },
    [files, onFilesChange]
  );

  const removeFile = (index: number) => {
    onFilesChange(files.filter((_, i) => i !== index));
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (!disabled && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [disabled, handleFiles]
  );

  return (
    <div className="space-y-3">
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload" disabled={disabled}>
            Upload File
          </TabsTrigger>
          <TabsTrigger value="urls" disabled={disabled}>
            URL Immagini
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25"
            } ${disabled ? "opacity-50 pointer-events-none" : "cursor-pointer"}`}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => !disabled && fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Trascina qui le immagini o{" "}
              <span className="text-primary font-semibold">
                clicca per selezionare
              </span>
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              JPG, PNG, WebP, GIF
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            disabled={disabled}
          />
        </TabsContent>

        <TabsContent value="urls">
          <Textarea
            placeholder={"https://esempio.com/img1.jpg\nhttps://esempio.com/img2.png"}
            value={urls}
            onChange={(e) => onUrlsChange(e.target.value)}
            disabled={disabled}
            rows={5}
          />
        </TabsContent>
      </Tabs>

      {files.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {files.map((file, i) => (
            <Badge key={i} variant="secondary" className="gap-1">
              {file.name}
              {!disabled && (
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => removeFile(i)}
                />
              )}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
