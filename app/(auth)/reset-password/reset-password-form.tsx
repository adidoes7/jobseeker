"use client";

import { useActionState } from "react";
import Link from "next/link";
import { requestPasswordReset } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ResetPasswordForm() {
  const [state, action, pending] = useActionState(requestPasswordReset, undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Reset your password</CardTitle>
        <CardDescription>We&apos;ll email you a link to set a new password.</CardDescription>
      </CardHeader>
      <form action={action}>
        <CardContent className="flex flex-col gap-4">
          {state?.error && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.message && (
            <Alert>
              <AlertDescription>{state.message}</AlertDescription>
            </Alert>
          )}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-3">
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Sending…" : "Send reset link"}
          </Button>
          <div className="text-sm text-muted-foreground">
            <Link href="/sign-in" className="hover:text-foreground">
              Back to sign in
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
}
