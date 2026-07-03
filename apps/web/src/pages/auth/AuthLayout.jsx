import { Link, Outlet } from 'react-router-dom';
import { Logo } from '@/components/layout/Logo';

export default function AuthLayout() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-gradient-to-b from-secondary/60 to-background px-4 py-10">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2 text-xl font-bold">
          <Logo size={36} />
          MarketPro
        </Link>
        <div className="rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
