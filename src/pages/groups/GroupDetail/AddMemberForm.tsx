import { useForm } from "react-hook-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserPlus } from "lucide-react";
import { useInviteToGroupMutation } from "@/api/groups/useInviteToGroup";

interface AddMemberFormProps {
  groupId: string;
}

interface FormData {
  usernameOrEmail: string;
}

export function AddMemberForm({ groupId }: AddMemberFormProps) {
  const inviteToGroupMutation = useInviteToGroupMutation(groupId);

  // Form for inviting members
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>();

  async function onSubmitInvite(data: FormData) {
    const input = data.usernameOrEmail.trim();
    // For email format, make it lowercase for case-insensitive matching
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const processedInput = emailRegex.test(input) ? input.toLowerCase() : input;

    inviteToGroupMutation.mutate(processedInput, {
      onSuccess() {
        reset(); // Clear the form on success
      },
    });
  }

  return (
    <Card className="bg-white/10 border-purple-400/30">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-white">
          <UserPlus className="h-5 w-5" />
          <span>Add Member</span>
        </CardTitle>
        <CardDescription className="text-purple-200">
          Invite someone to join this group by username or email
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmitInvite)} className="space-y-4">
          <div>
            <Label htmlFor="usernameOrEmail" className="text-white">
              Username or Email
            </Label>
            <Input
              id="usernameOrEmail"
              placeholder="Enter username or email address"
              className="bg-white/10 border-purple-400/30 text-white placeholder:text-purple-300"
              {...register("usernameOrEmail", {
                required: "Username or email is required",
                minLength: {
                  value: 1,
                  message: "Username or email cannot be empty",
                },
              })}
            />
            {errors.usernameOrEmail && (
              <p className="text-red-400 text-sm mt-1">
                {errors.usernameOrEmail.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting || inviteToGroupMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {isSubmitting || inviteToGroupMutation.isPending
              ? "Adding Member..."
              : "Add Member"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
