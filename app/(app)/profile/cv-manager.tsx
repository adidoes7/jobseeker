"use client";

import { useRef, useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";
import { registerCv, setDefaultCv, extractCvSkillsAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

type Cv = {
  id: string;
  name: string;
  fileName: string;
  isDefault: boolean;
};

export function CvManager({ cvs }: { cvs: Cv[] }) {
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extractingId, setExtractingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a PDF file.");
      return;
    }
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in");

      const path = `${user.id}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("cvs").upload(path, file, {
        contentType: file.type,
      });
      if (uploadError) throw uploadError;

      await registerCv({
        name: name.trim() || file.name,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      setName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>CVs</CardTitle>
        <CardDescription>Upload one or more CV versions and mark a default.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {cvs.length > 0 && (
          <ul className="flex flex-col gap-2">
            {cvs.map((cv) => (
              <li
                key={cv.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{cv.name}</span>
                  <span className="text-muted-foreground">{cv.fileName}</span>
                  {cv.isDefault && <Badge>Default</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  {!cv.isDefault && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => startTransition(() => setDefaultCv(cv.id))}
                    >
                      Set as default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={extractingId === cv.id}
                    onClick={async () => {
                      setExtractingId(cv.id);
                      try {
                        await extractCvSkillsAction(cv.id);
                      } finally {
                        setExtractingId(null);
                      }
                    }}
                  >
                    {extractingId === cv.id ? "Extracting…" : "Extract skills"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={handleUpload} className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="cv-name">CV name</Label>
            <Input
              id="cv-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Senior Product Designer CV"
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="cv-file">PDF file</Label>
            <Input id="cv-file" type="file" accept="application/pdf" ref={fileInputRef} />
          </div>
          <Button type="submit" disabled={uploading}>
            {uploading ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
