import { useGetDashboardSummary, useGetMyProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Flame, Medal, ArrowUpRight, TrendingDown } from "lucide-react";

const COLORS = ['hsl(152 65% 42%)', 'hsl(42 100% 50%)', 'hsl(180 60% 40%)', 'hsl(220 70% 50%)', 'hsl(300 60% 60%)'];

export default function Dashboard() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();

  if (profileLoading || summaryLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full rounded-2xl" />
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!profile || !summary) return null;

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto overflow-y-auto h-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Welcome back, {profile.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground mt-2 text-lg">Here's your impact overview for today.</p>
        </div>
        {profile.onboardingComplete && (
          <div className="flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full font-medium">
            <TrendingDown className="h-5 w-5" />
            <span>On track to reduce footprint by 15%</span>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-green-50 to-emerald-100/50 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-green-500/10">
            <Leaf className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-sm font-semibold text-green-800 uppercase tracking-wider mb-2">Carbon Score</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold font-['Outfit'] text-green-950">{summary.carbonScore}</h2>
              <span className="text-sm font-medium text-green-700">/ 1000</span>
            </div>
            <p className="text-sm text-green-700 mt-2 font-medium flex items-center gap-1">
              <ArrowUpRight className="h-4 w-4" /> Top 20% this week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-orange-100/50 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-orange-500/10">
            <Flame className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-sm font-semibold text-orange-800 uppercase tracking-wider mb-2">Daily Streak</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold font-['Outfit'] text-orange-950">{summary.streak}</h2>
              <span className="text-sm font-medium text-orange-700">days</span>
            </div>
            <p className="text-sm text-orange-700 mt-2 font-medium flex items-center gap-1">
              Keep it up! 🔥
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100/50 border-none shadow-sm relative overflow-hidden">
          <div className="absolute -right-6 -top-6 text-indigo-500/10">
            <Medal className="w-32 h-32" />
          </div>
          <CardContent className="p-6 relative z-10">
            <p className="text-sm font-semibold text-indigo-800 uppercase tracking-wider mb-2">Green Points</p>
            <div className="flex items-baseline gap-2">
              <h2 className="text-4xl font-bold font-['Outfit'] text-indigo-950">{summary.greenPoints}</h2>
              <span className="text-sm font-medium text-indigo-700">pts</span>
            </div>
            <p className="text-sm text-indigo-700 mt-2 font-medium flex items-center gap-1">
              Earn more by completing challenges
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Outfit']">Weekly Emissions (kg CO₂)</CardTitle>
            <CardDescription>Your carbon footprint over the last 7 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {summary.weeklyEmissions?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.weeklyEmissions} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }} />
                  <Tooltip cursor={{ fill: 'var(--color-muted)' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="kg" fill="var(--color-primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Outfit']">Category Breakdown</CardTitle>
            <CardDescription>Where your emissions come from</CardDescription>
          </CardHeader>
          <CardContent className="h-72 flex flex-col md:flex-row items-center justify-center">
            {summary.categoryBreakdown?.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={summary.categoryBreakdown}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="percentage"
                    >
                      {summary.categoryBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-full md:w-48 space-y-2 mt-4 md:mt-0">
                  {summary.categoryBreakdown.map((entry, index) => (
                    <div key={entry.category} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="flex-1 capitalize truncate">{entry.category}</span>
                      <span className="font-medium">{entry.percentage}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Badges and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Outfit']">Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.recentActivities?.length > 0 ? (
              <div className="space-y-4">
                {summary.recentActivities.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-muted/40 rounded-xl border">
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{activity.category} • {new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold font-['Outfit'] text-destructive">+{activity.emissionKg} kg</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                <p>No activities logged yet.</p>
                <p className="text-sm mt-1">Start tracking to see your impact!</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Outfit']">Earned Badges</CardTitle>
          </CardHeader>
          <CardContent>
            {summary.badges?.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {summary.badges.map(badge => (
                  <div key={badge} className="flex flex-col items-center justify-center p-3 bg-primary/10 text-primary rounded-xl w-full text-center">
                    <Medal className="h-8 w-8 mb-2" />
                    <span className="font-medium text-sm">{badge}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed h-full flex flex-col items-center justify-center">
                <Medal className="h-10 w-10 mb-2 opacity-20" />
                <p>No badges yet</p>
                <p className="text-sm mt-1">Complete challenges to earn them!</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}