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

  const profileQuery = useProfileQuery(user?.id);
  const profile = profileQuery.data;

  useEffect(() => {
    // Set up auth state listener first. Invite acceptance is handled by
    // useInviteAcceptance (calling supabase inside this callback can deadlock).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
      setLoading(false);

      if (event === "SIGNED_IN") {
        setAuthDialogOpen(false);
      }
    });

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
