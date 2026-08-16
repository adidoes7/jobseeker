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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Loader2Icon, CheckCircle2Icon } from "lucide-react";

type Cv = {
  id: string;
  name: string;
  fileName: string;
  isDefault: boolean;
};

type FlowStep = "uploading" | "analyzing" | "success" | "error";

type FlowState = {
  step: FlowStep;
  skills?: string[];
  experienceSummary?: string | null;
  error?: string;
  retry?: () => void;
};

export function CvManager({ cvs }: { cvs: Cv[] }) {
  const [name, setName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [flow, setFlow] = useState<FlowState | null>(null);

  const processing = flow?.step === "uploading" || flow?.step === "analyzing";

  async function runAnalysis(cvId: string) {
    setFlow({ step: "analyzing" });
    try {
      const extracted = await extractCvSkillsAction(cvId);
      setFlow({ step: "success", skills: extracted.skills, experienceSummary: extracted.experienceSummary });
    } catch (err) {
      setFlow({
        step: "error",
        error: err instanceof Error ? err.message : "Couldn't read that CV",
        retry: () => runAnalysis(cvId),
      });
    }
  }

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

    setFlow({ step: "uploading" });
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

      setFlow({ step: "analyzing" });
      const result = await registerCv({
        name: name.trim() || file.name,
        storagePath: path,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
      });

      setName("");
      if (fileInputRef.current) fileInputRef.current.value = "";

      if (result.extracted) {
        setFlow({
          step: "success",
          skills: result.extracted.skills,
          experienceSummary: result.extracted.experienceSummary,
        });
      } else {
        setFlow({
          step: "error",
          error: result.extractionError ?? "Couldn't read that CV",
          retry: () => runAnalysis(result.cvId),
        });
      }
    } catch (err) {
      setFlow(null);
      setError(err instanceof Error ? err.message : "Upload failed");
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
                      disabled={isPending || processing}
                      onClick={() => startTransition(() => setDefaultCv(cv.id))}
                    >
                      Set as default
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={processing}
                    onClick={() => runAnalysis(cv.id)}
                  >
                    Re-analyze
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
          <Button type="submit" disabled={processing}>
            {flow?.step === "uploading" ? "Uploading…" : "Upload"}
          </Button>
        </form>
      </CardContent>

      <Dialog
        open={flow !== null}
        onOpenChange={(open) => {
          if (!open && !processing) setFlow(null);
        }}
      >
        <DialogContent showCloseButton={!processing}>
          {(flow?.step === "uploading" || flow?.step === "analyzing") && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Loader2Icon className="size-4 animate-spin" />
                  {flow.step === "uploading" ? "Uploading your CV…" : "Reading your CV…"}
                </DialogTitle>
                <DialogDescription>
                  {flow.step === "uploading"
                    ? "Storing your file securely."
                    : "Pulling out your skills and experience — this powers your AI fit scores, so it's worth the wait."}
                </DialogDescription>
              </DialogHeader>
            </>
          )}

          {flow?.step === "success" && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  Got it — here&apos;s what we found
                </DialogTitle>
                <DialogDescription>
                  This is now saved to your profile and used to score job matches. You can edit it anytime below.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-3">
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Skills</p>
                  {flow.skills && flow.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {flow.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No skills found in this CV.</p>
                  )}
                </div>
                {flow.experienceSummary && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Experience summary</p>
                    <p className="text-sm">{flow.experienceSummary}</p>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" onClick={() => setFlow(null)}>
                  Done
                </Button>
              </DialogFooter>
            </>
          )}

          {flow?.step === "error" && (
            <>
              <DialogHeader>
                <DialogTitle>Couldn&apos;t analyze this CV</DialogTitle>
                <DialogDescription>
                  Your file was saved, but we weren&apos;t able to read skills from it yet. Job fit scores won&apos;t
                  work until this succeeds.
                </DialogDescription>
              </DialogHeader>
              <Alert variant="destructive">
                <AlertDescription>{flow.error}</AlertDescription>
              </Alert>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setFlow(null)}>
                  Close
                </Button>
                <Button type="button" onClick={() => flow.retry?.()}>
                  Retry
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
