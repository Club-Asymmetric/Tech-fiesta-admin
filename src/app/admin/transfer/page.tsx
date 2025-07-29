// In src/app/admin/page.tsx (or similar)
import ManualDbSync from '@/components/ManualDbSync';

export default function AdminPage() {
  return (
    <div>
      {/* Your other admin dashboard components */}

      <div className="mt-12">
        <ManualDbSync />
      </div>
    </div>
  );
}