import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, Users, ArrowLeft } from "lucide-react";
import { EmailStep } from "./EmailStep";
import { OtpStep } from "./OtpStep";

interface AuthDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  inviteToken?: string | undefined;
  groupName?: string | undefined;
}

export function AuthDialog({
  open,
  onOpenChange,
  onSuccess,
  inviteToken,
  groupName,
}: AuthDialogProps) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");

  function handleEmailSuccess(email: string) {
    setEmail(email);
    setStep("otp");
  }

  function handleBack() {
    setStep("email");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-paper-foreground">
            {step === "otp" && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                className="mr-2 p-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            {inviteToken && groupName ? (
              <>
                <Users className="h-5 w-5" />
                <span>Join {groupName}</span>
              </>
            ) : (
              <>
                <Mail className="h-5 w-5" />
                <span>Join the Festival!</span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-paper-muted-foreground">
            {step === "email"
              ? inviteToken && groupName
                ? `Enter your email to join ${groupName} - we'll send you a magic link and verification code!`
                : "Enter your email to sign in or create an account - no password needed!"
              : "Check your email! Click the magic link or enter the 6-digit code below."}
          </DialogDescription>
        </DialogHeader>

        {step === "email" ? (
          <EmailStep inviteToken={inviteToken} onSuccess={handleEmailSuccess} />
        ) : (
          <OtpStep
            email={email}
            inviteToken={inviteToken}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
