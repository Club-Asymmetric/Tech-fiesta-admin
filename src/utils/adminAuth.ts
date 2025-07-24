import { getAuth } from "firebase/auth";

// Utility to get the current admin user's email from Firebase Auth (Google login)
export function getCurrentAdminUser(): string | null {
  if (typeof window !== "undefined") {
    const auth = getAuth();
    const user = auth.currentUser;
    return user?.email || null;
  }
  return null;
}
