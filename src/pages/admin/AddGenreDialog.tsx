import { useForm } from "react-hook-form";
import { useCreateGenreMutation } from "@/api/genres/useCreateGenreMutation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

import { useUserPermissionsQuery } from "@/api/auth/useUserPermissions";
import { useAuth } from "@/contexts/AuthContext";

interface AddGenreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FormData {
  name: string;
}

export function AddGenreDialog({ open, onOpenChange }: AddGenreDialogProps) {
  const { user, loading: authLoading } = useAuth();
  const { data: canEdit = false, isLoading: isLoadingPermissions } =
    useUserPermissionsQuery(user?.id, "edit_artists");

  const createGenreMutation = useCreateGenreMutation();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>();

  if (authLoading || isLoadingPermissions) {
    return null;
  }

  function onSubmit(data: FormData) {
    if (!user || !canEdit) {
      return;
    }

    createGenreMutation.mutate(
      {
        name: data.name,
        created_by: user.id,
      },
      {
        onSuccess: () => {
          reset();
          onOpenChange(false);
        },
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add New Genre
          </DialogTitle>
          <DialogDescription>
            Add a new music genre that others can use when adding artists.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="genre-name">Genre Name</Label>
            <Input
              id="genre-name"
              type="text"
              placeholder="Enter genre name"
              {...register("name", {
                required: "Genre name is required",
                minLength: {
                  value: 1,
                  message: "Genre name cannot be empty",
                },
              })}
            />
            {errors.name && (
              <p className="text-sm text-red-600 mt-1">{errors.name.message}</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={createGenreMutation.isPending}
          >
            {createGenreMutation.isPending ? "Adding genre..." : "Add Genre"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
