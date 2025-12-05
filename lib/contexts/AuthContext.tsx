import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
} from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { Profile, User } from "../types/database.types";
import { supabase } from "../supabase/client";

interface AuthContextType {
  user: User | null; // Keep User for backward compatibility
  profile: Profile | null; // Add Profile for new code
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  signIn: (email: string) => Promise<{ success: boolean; message: string }>;
  verifyOtp: (
    email: string,
    token: string
  ) => Promise<{ success: boolean; message: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const initializingRef = useRef(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setLoading(false);
      }
      initializingRef.current = false;
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      console.log("Auth state change event:", _event);

      // Skip INITIAL_SESSION event as we handle it with getSession()
      if (_event === "INITIAL_SESSION") {
        return;
      }

      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        // Only reload profile for meaningful events, not token refreshes
        // TOKEN_REFRESHED doesn't indicate profile data changed, only the auth token
        if (_event === "SIGNED_IN" || _event === "USER_UPDATED") {
          // Don't set loading to true for profile updates - only show loading on initial load
          // This prevents flickering when the profile is reloaded
          loadUserProfileSilently(session.user);
        }
      } else {
        setProfile(null);
        setUser(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUserProfile(authUser: SupabaseUser) {
    try {
      console.log("Loading profile for user:", authUser.id, authUser.email);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        // Profile should be auto-created by trigger, but handle edge case
        // Create a basic profile from auth data even if profile fetch fails
        console.log("Creating fallback profile from auth data");
        const fallbackProfile: Profile = {
          id: authUser.id,
          email: authUser.email || "",
          full_name: authUser.email?.split("@")[0] || "User",
          phone: null,
          image_url: null,
          user_type: "medical_rep",
          default_company_id: null,
          default_location_id: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setUser(fallbackProfile); // User is type alias for Profile
      } else if (data) {
        console.log("Profile loaded successfully:", data);
        // Use profile data directly - type assertion needed for Supabase query result
        const profileRow = data as Profile;
        const profileData: Profile = {
          id: profileRow.id,
          email: profileRow.email,
          full_name: profileRow.full_name,
          phone: profileRow.phone,
          image_url: profileRow.image_url,
          user_type: profileRow.user_type,
          default_company_id: profileRow.default_company_id,
          default_location_id: profileRow.default_location_id,
          status: profileRow.status,
          created_at: profileRow.created_at,
          updated_at: profileRow.updated_at,
        };
        setProfile(profileData);
        setUser(profileData); // User is type alias for Profile
      }
    } catch (error) {
      console.error("Unexpected error loading user profile:", error);
      // Don't set profile to null on error - keep the basic auth user data
      const fallbackProfile: Profile = {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.email?.split("@")[0] || "User",
        phone: null,
        image_url: null,
        user_type: "medical_rep",
        default_company_id: null,
        default_location_id: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      setUser(fallbackProfile);
    } finally {
      console.log("Profile load complete, setting loading to false");
      setLoading(false);
    }
  }

  // Silent version that doesn't trigger loading state
  async function loadUserProfileSilently(authUser: SupabaseUser) {
    try {
      console.log("Silently loading profile for user:", authUser.id);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) {
        console.error("Error loading user profile:", error);
        const fallbackProfile: Profile = {
          id: authUser.id,
          email: authUser.email || "",
          full_name: authUser.email?.split("@")[0] || "User",
          phone: null,
          image_url: null,
          user_type: "medical_rep",
          default_company_id: null,
          default_location_id: null,
          status: "active",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        setProfile(fallbackProfile);
        setUser(fallbackProfile);
      } else if (data) {
        // Type assertion needed for Supabase query result
        const profileRow = data as Profile;
        const profileData: Profile = {
          id: profileRow.id,
          email: profileRow.email,
          full_name: profileRow.full_name,
          phone: profileRow.phone,
          image_url: profileRow.image_url,
          user_type: profileRow.user_type,
          default_company_id: profileRow.default_company_id,
          default_location_id: profileRow.default_location_id,
          status: profileRow.status,
          created_at: profileRow.created_at,
          updated_at: profileRow.updated_at,
        };
        setProfile(profileData);
        setUser(profileData);
      }
    } catch (error) {
      console.error("Unexpected error loading user profile:", error);
      const fallbackProfile: Profile = {
        id: authUser.id,
        email: authUser.email || "",
        full_name: authUser.email?.split("@")[0] || "User",
        phone: null,
        image_url: null,
        user_type: "medical_rep",
        default_company_id: null,
        default_location_id: null,
        status: "active",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProfile(fallbackProfile);
      setUser(fallbackProfile);
    }
    // Don't set loading to false - we're not showing a loading screen for this
  }

  async function signIn(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: true,
        },
      });

      if (error) {
        return {
          success: false,
          message: error.message,
        };
      }

      return {
        success: true,
        message: "Check your email for the OTP code",
      };
    } catch (error) {
      console.error("Error signing in:", error);
      return {
        success: false,
        message: "Failed to send OTP. Please try again.",
      };
    }
  }

  async function verifyOtp(email: string, token: string) {
    try {
      console.log("Verifying OTP for:", email, "token:", token);
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "email",
      });

      console.log("OTP verification result:", { data, error });

      if (error) {
        console.error("OTP verification error:", error);
        return {
          success: false,
          message: error.message,
        };
      }

      console.log(
        "OTP verified successfully, session:",
        data.session?.user?.email
      );
      return {
        success: true,
        message: "Successfully signed in",
      };
    } catch (error) {
      console.error("Unexpected error verifying OTP:", error);
      return {
        success: false,
        message: "Failed to verify OTP. Please try again.",
      };
    }
  }

  async function signOut() {
    try {
      await supabase.auth.signOut();
      setProfile(null);
      setUser(null);
      setSupabaseUser(null);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }

  async function refreshProfile() {
    if (!supabaseUser) return;
    await loadUserProfileSilently(supabaseUser);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        supabaseUser,
        loading,
        signIn,
        verifyOtp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
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
