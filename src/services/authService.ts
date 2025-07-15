import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User 
} from "firebase/auth";
import { auth } from "@/lib/firebase";

// Define allowed email addresses from environment variable
const getAllowedEmails = (): string[] => {
  const adminEmails = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "";
  if (!adminEmails) {
    console.warn('NEXT_PUBLIC_ADMIN_EMAILS not configured, using default admin emails');
  }
  return adminEmails.split(',').map(email => email.trim().toLowerCase());
};

// Check if an email is in the whitelist
export const isEmailAllowed = (email: string): boolean => {
  const allowedEmails = getAllowedEmails();
  return allowedEmails.includes(email.toLowerCase());
};

// Sign in with Google and check email whitelist
export const signInWithGoogle = async (): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Check if the user's email is in the whitelist
    if (!user.email || !isEmailAllowed(user.email)) {
      // Sign out the user if not authorized
      await firebaseSignOut(auth);
      return { 
        success: false, 
        error: "Your email is not authorized to access this admin panel. Please contact the administrator." 
      };
    }

    return { success: true, user };
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sign in" 
    };
  }
};

// Sign in with email and password and check email whitelist
export const signInWithEmail = async (email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> => {
  try {
    // Check email whitelist before attempting to sign in
    if (!isEmailAllowed(email)) {
      return { 
        success: false, 
        error: "Your email is not authorized to access this admin panel." 
      };
    }

    const result = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: result.user };
  } catch (error) {
    console.error("Error signing in with email:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to sign in" 
    };
  }
};

// Sign out
export const signOut = async (): Promise<void> => {
  try {
    await firebaseSignOut(auth);
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
};

// Auth state listener
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    // Double-check email authorization on auth state change
    if (user && user.email && !isEmailAllowed(user.email)) {
      firebaseSignOut(auth);
      callback(null);
      return;
    }
    callback(user);
  });
};

// Get current user
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

// Check if user is authenticated and authorized
export const isUserAuthorized = (): boolean => {
  const user = getCurrentUser();
  return !!(user && user.email && isEmailAllowed(user.email));
};
