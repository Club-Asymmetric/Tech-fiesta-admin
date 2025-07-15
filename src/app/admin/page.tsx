"use client"
import AdminDashboard from "@/components/AdminDashboard";
import AuthWrapper from "@/components/AuthWrapper";

export default function AdminPage() {
  return (
    <AuthWrapper>
      <AdminDashboard />
    </AuthWrapper>
  );
}