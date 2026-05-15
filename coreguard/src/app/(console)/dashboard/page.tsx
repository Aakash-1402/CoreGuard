import { SummaryCards } from '@/components/dashboard/SummaryCards';

export default function DashboardPage() {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Dashboard</h2>
      <SummaryCards />
    </div>
  );
}