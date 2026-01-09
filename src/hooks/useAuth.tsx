import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CustomRole {
  id: string;
  name: string;
  display_name: string;
  color: string;
  has_admin_access: boolean;
  has_reports_access: boolean;
  has_news_access: boolean;
  has_giveaways_access: boolean;
  has_roulette_access: boolean;
  has_developer_access: boolean;
}

interface Profile {
  id: string;
  username: string;
  discord_id: string | null;
  avatar_url: string | null;
  role: "guest" | "member" | "admin" | "developer";
  admin_code_verified: boolean;
  password_reset_required: boolean;
  created_at: string;
  updated_at: string;
  custom_role_id: string | null;
  custom_role?: CustomRole | null;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  signUp: (email: string, password: string, username: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, custom_roles(*)")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      
      // Map custom_roles to custom_role
      if (data) {
        const profileData = {
          ...data,
          custom_role: data.custom_roles || null,
        };
        delete (profileData as any).custom_roles;
        setProfile(profileData as Profile);
      } else {
        setProfile(null);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }

        setIsLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchProfile(session.user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, username: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username },
        },
      });

      if (error) throw error;

      toast({
        title: "Реєстрація успішна!",
        description: "Ласкаво просимо до Blood Residence!",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Помилка реєстрації",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Вхід успішний!",
        description: "З поверненням!",
      });

      return { error: null };
    } catch (error) {
      const err = error as Error;
      toast({
        title: "Помилка входу",
        description: err.message,
        variant: "destructive",
      });
      return { error: err };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setProfile(null);
    toast({
      title: "Вихід",
      description: "До зустрічі!",
    });
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchProfile(user.id);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        isLoading,
        signUp,
        signIn,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
