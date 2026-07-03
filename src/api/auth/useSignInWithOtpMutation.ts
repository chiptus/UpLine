import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface SignInWithOtpParams {
  email: string;
  inviteToken?: string;
}

export function useSignInWithOtpMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, inviteToken }: SignInWithOtpParams) => {
      const { data, error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: inviteToken
            ? `${window.location.origin}/?invite=${inviteToken}`
            : `${window.location.origin}/`,
          shouldCreateUser: true,
          data: {
            invite_token: inviteToken,
          },
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Check your email!",
        description:
          "We've sent you a magic link and a 6-digit code. Click the link or enter the code below.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
}
