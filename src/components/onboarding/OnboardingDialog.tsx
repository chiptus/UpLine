import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { User } from "@supabase/supabase-js";
import { UsernameStep } from "./steps/UsernameStep";
import { GroupsExplanationStep } from "./steps/GroupsExplanationStep";
import { VotingExplanationStep } from "./steps/VotingExplanationStep";
import { TimelineExplanationStep } from "./steps/TimelineExplanationStep";
import { WelcomeStep } from "./steps/WelcomeStep";
import { useAuth } from "@/contexts/AuthContext";
import { useUpdateProfileMutation } from "@/api/auth/useUpdateProfile";
import { useToast } from "@/hooks/use-toast";

export type OnboardingStep =
  | "username"
  | "groups"
  | "voting"
  | "timeline"
  | "welcome";

interface OnboardingDialogProps {
  open: boolean;
  user: User;
  onComplete: () => void;
}

export function OnboardingDialog({
  open,
  user,
  onComplete,
}: OnboardingDialogProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfileMutation();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("username");
  const [username, setUsername] = useState("");

  // Set initial step based on whether user has username
  useEffect(() => {
    if (profile?.username && profile.username.trim() !== "") {
      if (currentStep === "username") {
        setCurrentStep("groups");
        setUsername(profile.username);
      }
    } else {
      setCurrentStep("username");
    }
  }, [profile, currentStep]);

  function handleNext() {
    const steps: OnboardingStep[] = [
      "username",
      "groups",
      "voting",
      "timeline",
      "welcome",
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex < steps.length - 1) {
      setCurrentStep(steps[currentIndex + 1]);
    } else {
      onComplete();
    }
  }

  function handlePrevious() {
    const steps: OnboardingStep[] = [
      "username",
      "groups",
      "voting",
      "timeline",
      "welcome",
    ];
    const currentIndex = steps.indexOf(currentStep);

    if (currentIndex > 0) {
      setCurrentStep(steps[currentIndex - 1]);
    }
  }

  function handleSkip() {
    updateProfileMutation.mutate(
      {
        userId: user.id,
        updates: { completed_onboarding: true },
      },
      {
        onSuccess: () => {
          // Show appropriate message based on current step
          const isWelcomeStep = currentStep === "welcome";
          toast({
            title: isWelcomeStep ? "Welcome to UpLine!" : "Onboarding skipped",
            description: isWelcomeStep
              ? "You're all set to start planning your festival experience."
              : "You can always find this information in the help section.",
          });
          onComplete();
        },
        onError: (error) => {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        },
      },
    );
  }

  function renderStep() {
    switch (currentStep) {
      case "username":
        return (
          <UsernameStep
            user={user}
            username={username}
            setUsername={setUsername}
            onNext={handleNext}
          />
        );
      case "groups":
        return (
          <GroupsExplanationStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        );
      case "voting":
        return (
          <VotingExplanationStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        );
      case "timeline":
        return (
          <TimelineExplanationStep
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkip={handleSkip}
          />
        );
      case "welcome":
        return <WelcomeStep username={username} onComplete={handleSkip} />;
      default:
        return null;
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent
        className="sm:max-w-lg max-h-[95vh] w-[95vw] sm:w-full flex flex-col p-4 sm:p-6 my-4 sm:my-auto [&>button]:hidden"
        onInteractOutside={(e) => e.preventDefault()}
      >
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}
