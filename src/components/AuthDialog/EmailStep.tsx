import { useForm } from "react-hook-form";
import { useSignInWithOtpMutation } from "@/api/auth/useSignInWithOtpMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EmailStepProps {
  inviteToken?: string | undefined;
  onSuccess: (email: string) => void;
}

interface FormData {
  email: string;
}

export function EmailStep({ inviteToken, onSuccess }: EmailStepProps) {
  const signInMutation = useSignInWithOtpMutation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: { email: "" },
  });

  function onSubmit(data: FormData) {
    signInMutation.mutate(
      {
        email: data.email,
        inviteToken,
      },
      {
        onSuccess: () => {
          onSuccess(data.email);
        },
      },
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="your@email.com"
          {...register("email", {
            required: "Email is required",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "Please enter a valid email address",
            },
          })}
        />
        {errors.email && (
          <p className="text-sm text-red-600 mt-1">{errors.email.message}</p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={signInMutation.isPending}
      >
        {signInMutation.isPending ? "Sending..." : "Send Magic Link & Code"}
      </Button>
    </form>
  );
}
