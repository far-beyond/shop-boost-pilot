import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type SubscriptionState = {
  subscribed: boolean;
  product_id: string | null;
  subscription_end: string | null;
} | null;

type AuthContextType = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  subscription: SubscriptionState;
  refreshSubscription: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  loading: true,
  subscription: null,
  refreshSubscription: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionState>(null);

  const checkSubscription = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (error) throw error;
      setSubscription(data);
    } catch {
      setSubscription(null);
    }
  }, []);

  useEffect(() => {
    const { data: { subscription: sub } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoading(false);
        if (session?.user) {
          setTimeout(() => checkSubscription(), 0);
        } else {
          setSubscription(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
      if (session?.user) {
        checkSubscription();
      }
    });

    return () => sub.unsubscribe();
  }, [checkSubscription]);

  // Periodic refresh every 60s
  useEffect(() => {
    if (!session?.user) return;
    const interval = setInterval(checkSubscription, 60000);
    return () => clearInterval(interval);
  }, [session?.user, checkSubscription]);

  const signOut = async () => {
    await supabase.auth.signOut();
    setSubscription(null);
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, subscription, refreshSubscription: checkSubscription, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
