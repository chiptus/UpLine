import { useUpdateProfileMutation } from "@/api/auth/useUpdateProfile";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { User as UserIcon } from "lucide-react";
import { User } from "@supabase/supabase-js";
import { useForm } from "react-hook-form";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface UsernameStepProps {
  user: User;
  username: string;
  setUsername: (username: string) => void;
  onNext: () => void;
}

type UsernameFormData = {
  username: string;
};

export function UsernameStep({
  user,
  username,
  setUsername,
  onNext,
}: UsernameStepProps) {
  const { toast } = useToast();
  const updateProfileMutation = useUpdateProfileMutation();

  const form = useForm<UsernameFormData>({
    defaultValues: {
      username: username,
    },
  });

  function handleSubmit(data: UsernameFormData) {
    const trimmedUsername = data.username.trim();
    if (!trimmedUsername) return;

    setUsername(trimmedUsername);

    updateProfileMutation.mutate(
      {
        userId: user.id,
        updates: { username: trimmedUsername },
      },
      {
        onSuccess: () => {
          toast({
            title: "Username set!",
            description: "Let's show you around UpLine.",
          });
          onNext();
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

  return (
    <div className="flex flex-col h-full">
      {/* Header - fixed */}
      <DialogHeader>
        <DialogTitle className="flex items-center space-x-2">
          <UserIcon className="h-5 w-5" />
          <span>Welcome to UpLine!</span>
        </DialogTitle>
        <DialogDescription>
          Let's start by choosing your username. This is how other
          festival-goers will see you in groups.
        </DialogDescription>
      </DialogHeader>

      {/* Form content - scrollable if needed */}
      <div className="flex-1 overflow-y-auto mt-3 sm:mt-4 min-h-0">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="username"
              rules={{
                required: "Username is required",
                minLength: {
                  value: 2,
                  message: "Username must be at least 2 characters",
                },
                maxLength: {
                  value: 50,
                  message: "Username must be less than 50 characters",
                },
                pattern: {
                  value: /^[a-zA-Z0-9_-]+$/,
                  message:
                    "Username can only contain letters, numbers, hyphens, and underscores",
                },
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Username</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Your display name"
                      autoFocus
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      </div>

      {/* Button - fixed at bottom */}
      <div className="pt-4 mt-4 border-t">
        <Button
          onClick={form.handleSubmit(handleSubmit)}
          className="w-full"
          disabled={
            updateProfileMutation.isPending ||
            !form.formState.isValid ||
            !form.watch("username")?.trim()
          }
        >
          {updateProfileMutation.isPending ? "Setting up..." : "Continue"}
        </Button>
      </div>
    </div>
  );
}
