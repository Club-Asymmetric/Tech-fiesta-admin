"use client"
import AuthWrapper from "@/components/AuthWrapper";
import EnhancedAdminDashboard from "@/components/EnhancedAdminDashboard";

export default function AdminPage() {
  return (
    <AuthWrapper>
      <EnhancedAdminDashboard />
    </AuthWrapper>
  );
}