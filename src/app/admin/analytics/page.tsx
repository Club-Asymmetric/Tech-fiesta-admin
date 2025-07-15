"use client"
import AnalyticsDashboard from '@/components/AnalyticsDashboard';
import AuthWrapper from '@/components/AuthWrapper';

export default function AnalyticsPage() {
  return (
    <AuthWrapper>
      <AnalyticsDashboard />
    </AuthWrapper>
  );
}
