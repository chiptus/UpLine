import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface VerifyOtpParams {
  email: string;
  token: string;
}

export function useVerifyOtpMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ email, token }: VerifyOtpParams) => {
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      if (error) {
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Welcome! You're now signed in.",
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
