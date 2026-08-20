import { useForm, Controller } from "react-hook-form";
import { useSignInWithOtpMutation } from "@/api/auth/useSignInWithOtpMutation";
import { useVerifyOtpMutation } from "@/api/auth/useVerifyOtpMutation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

interface OtpStepProps {
  email: string;
  inviteToken?: string | undefined;
  onSuccess: () => void;
}

interface FormData {
  otp: string;
}

export function OtpStep({ email, inviteToken, onSuccess }: OtpStepProps) {
  const signInMutation = useSignInWithOtpMutation();
  const verifyOtpMutation = useVerifyOtpMutation();

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<FormData>({
    defaultValues: { otp: "" },
  });

  const otpValue = watch("otp");

  function onSubmit(data: FormData) {
    verifyOtpMutation.mutate(
      {
        email,
        token: data.otp,
      },
      {
        onSuccess: () => {
          onSuccess();
        },
      },
    );
  }

  function handleResend() {
    signInMutation.mutate({
      email,
      inviteToken,
    });
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <Label htmlFor="otp">Enter 6-digit code</Label>
          <Controller
            name="otp"
            control={control}
            rules={{
              required: "OTP code is required",
              minLength: {
                value: 6,
                message: "OTP must be 6 digits",
              },
              maxLength: {
                value: 6,
                message: "OTP must be 6 digits",
              },
              pattern: {
                value: /^\d{6}$/,
                message: "OTP must contain only numbers",
              },
            }}
            render={({ field }) => (
              <InputOTP
                value={field.value}
                onChange={field.onChange}
                maxLength={6}
                className="w-full justify-center"
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
            )}
          />
          {errors.otp && (
            <p className="text-sm text-red-600 mt-1">{errors.otp.message}</p>
          )}
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={verifyOtpMutation.isPending || otpValue.length !== 6}
        >
          {verifyOtpMutation.isPending ? "Verifying..." : "Verify Code"}
        </Button>
      </form>

      <div className="text-center">
        <Button
          variant="link"
          onClick={handleResend}
          disabled={signInMutation.isPending}
          className="text-sm"
        >
          Resend code
        </Button>
      </div>
    </div>
  );
}
