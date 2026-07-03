import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Package, Users, ShoppingBag, Wallet, Heart, ShoppingCart } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, BarChart, Bar } from 'recharts';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatUZS } from '@/lib/utils';

const COLORS = ['#2563EB', '#0EA5E9', '#22C55E', '#F59E0B', '#EF4444', '#A855F7'];
const ALL_STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED'];

function fillDailyData(daily) {
  if (daily.length > 0) return daily;
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    result.push({ date: d.toISOString().slice(0, 10), total: 0 });
  }
  return result;
}

function fillMonthlyData(monthly) {
  if (monthly.length > 0) return monthly;
  const result = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    result.push({ month: d.toISOString().slice(0, 7), total: 0 });
  }
  return result;
}

function formatDateLabel(dateStr) {
  const [, month, day] = dateStr.split('-');
  return `${day}.${month}`;
}

function formatMonthLabel(monthStr) {
  const [year, month] = monthStr.split('-');
  const months = ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyun', 'Iyul', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'];
  return `${months[parseInt(month, 10) - 1]} ${year}`;
}

function uzTooltipFormatter(value) {
  return [formatUZS(value), 'Summa'];
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [sales, setSales] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.get('/admin/stats'), api.get('/admin/analytics/sales')])
      .then(([statsRes, salesRes]) => {
        setStats(statsRes.data);
        setSales(salesRes.data);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const cards = stats && [
    { label: t('admin.total_products'), value: stats.totalProducts, icon: Package },
    { label: t('admin.total_users'), value: stats.totalUsers, icon: Users },
    { label: t('admin.total_orders'), value: stats.totalOrders, icon: ShoppingBag },
    { label: t('admin.revenue'), value: formatUZS(stats.revenue), icon: Wallet },
    { label: t('nav.wishlist'), value: stats.wishlistCount, icon: Heart },
    { label: t('nav.cart'), value: stats.cartItemCount, icon: ShoppingCart },
  ];

  const dailyData = sales ? fillDailyData(sales.daily) : [];
  const monthlyData = sales ? fillMonthlyData(sales.monthly) : [];
  const hasDailySales = sales?.daily?.length > 0;
  const hasMonthlySales = sales?.monthly?.length > 0;

  const statusData = ALL_STATUSES.map((status) => {
    const found = sales?.byStatus?.find((s) => s.status === status);
    return {
      status,
      label: t(`order.status.${status}`),
      count: found?._count?.status || 0,
    };
  });
  const hasStatusData = statusData.some((s) => s.count > 0);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold sm:text-2xl">{t('admin.dashboard')}</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex flex-col gap-2 p-4">
              <Icon className="h-5 w-5 text-primary" />
              <p className="text-lg font-bold leading-tight">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('admin.daily_sales')}</CardTitle>
            {!hasDailySales && (
              <span className="text-xs text-muted-foreground">{t('admin.no_data_yet')}</span>
            )}
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={formatDateLabel} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
                <Tooltip
                  formatter={uzTooltipFormatter}
                  labelFormatter={(label) => `Sana: ${label}`}
                  contentStyle={{ borderRadius: 8, fontSize: 12 }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Savdo"
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={hasDailySales}
                  strokeOpacity={hasDailySales ? 1 : 0.4}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">{t('admin.orders_by_status')}</CardTitle>
            {!hasStatusData && (
              <span className="text-xs text-muted-foreground">{t('admin.no_data_yet')}</span>
            )}
          </CardHeader>
          <CardContent className="h-72">
            {hasStatusData ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.filter((s) => s.count > 0)}
                    dataKey="count"
                    nameKey="label"
                    cx="50%"
                    cy="45%"
                    outerRadius={70}
                    label={({ label, count }) => `${label}: ${count}`}
                    labelLine={false}
                    isAnimationActive={false}
                  >
                    {statusData.filter((s) => s.count > 0).map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Buyurtmalar']} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10 }} domain={[0, 1]} />
                  <YAxis type="category" dataKey="label" tick={{ fontSize: 10 }} width={90} />
                  <Tooltip formatter={(v) => [v, 'Buyurtmalar']} />
                  <Bar dataKey="count" fill="#94A3B8" radius={[0, 4, 4, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">{t('admin.monthly_sales')}</CardTitle>
          {!hasMonthlySales && (
            <span className="text-xs text-muted-foreground">{t('admin.no_data_yet')}</span>
          )}
        </CardHeader>
        <CardContent className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={formatMonthLabel} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => (v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v)} />
              <Tooltip
                formatter={uzTooltipFormatter}
                labelFormatter={formatMonthLabel}
                contentStyle={{ borderRadius: 8, fontSize: 12 }}
              />
              <Bar
                dataKey="total"
                name="Savdo"
                fill="#22C55E"
                radius={[4, 4, 0, 0]}
                fillOpacity={hasMonthlySales ? 1 : 0.35}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
