import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useProfileQuery } from "@/api/auth/useProfile";
import { useToast } from "@/hooks/use-toast";
import { AuthDialog } from "@/components/AuthDialog/AuthDialog";
import { Profile } from "@/api/auth/types";

interface AuthContextType {
  // Auth state
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  needsOnboarding: boolean;

  // Auth actions
  signOut: () => Promise<void>;

  // Dialog management
  showAuthDialog: (inviteToken?: string, groupName?: string) => void;
  hideAuthDialog: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | undefined>();
  const [groupName, setGroupName] = useState<string | undefined>();

  const { toast } = useToast();
  const profileQuery = useProfileQuery(user?.id);
  const profile = profileQuery.data;

  useEffect(() => {
    // Set up auth state listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // setSession(session);
      setUser(session?.user || null);
      setLoading(false);

      // Clear cached profile on sign out for security
      if (event === "SIGNED_OUT") {
        // For sign out, use the current user state from closure
        if (user?.id) {
          // await profileOfflineService.clearCachedProfile(user.id);
        }
      }

      // Handle invite processing when user signs in
      if (event === "SIGNED_IN" && session?.user) {
        const urlParams = new URLSearchParams(window.location.search);
        const inviteToken = urlParams.get("invite");

        if (inviteToken) {
          try {
            const { data, error } = await supabase.rpc("use_invite_token", {
              token: inviteToken,
              user_id: session.user.id,
            });

            if (error) {
              console.error("Error using invite:", error);
              toast({
                title: "Error",
                description: "Failed to join group",
                variant: "destructive",
              });
            } else if (data && data.length > 0) {
              const result = data[0];
              if (result.success) {
                toast({
                  title: "Success",
                  description: "Welcome to the group!",
                });
                // Clear invite from URL
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete("invite");
                window.history.replaceState({}, "", newUrl.toString());
              } else {
                toast({
                  title: "Error",
                  description: result.message,
                  variant: "destructive",
                });
              }
            }
          } catch (error) {
            console.error("Error processing invite:", error);
          }
        }

        // Close auth dialog on successful sign in
        setAuthDialogOpen(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      // setSession(session);
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [toast, user?.id]);

  async function signOut() {
    // Clear cached profile before signing out
    if (user?.id) {
      // await profileOfflineService.clearCachedProfile(user.id);
    }
    await supabase.auth.signOut();
  }

  function showAuthDialog(token?: string, name?: string) {
    setInviteToken(token);
    setGroupName(name);
    setAuthDialogOpen(true);
  }

  function hideAuthDialog() {
    setAuthDialogOpen(false);
    setInviteToken(undefined);
    setGroupName(undefined);
  }

  const needsOnboarding = useMemo(() => {
    if (!profile) return false; // Don't show onboarding until profile is loaded

    const hasUsername = Boolean(
      profile.username && profile.username.trim() !== "",
    );
    const hasCompletedOnboarding = Boolean(profile.completed_onboarding);

    return !hasUsername || !hasCompletedOnboarding;
  }, [profile]);

  const contextValue: AuthContextType = {
    user,
    profile: profile || null,
    loading,
    needsOnboarding,
    signOut,
    showAuthDialog,
    hideAuthDialog,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
      <AuthDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        onSuccess={hideAuthDialog}
        inviteToken={inviteToken}
        groupName={groupName}
      />
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
