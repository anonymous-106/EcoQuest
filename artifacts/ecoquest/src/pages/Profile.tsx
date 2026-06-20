import { useState } from "react";
import { useGetMyProfile, useUpsertProfile, useGetActivities, useLogActivity, getGetMyProfileQueryKey, getGetActivitiesQueryKey, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { PlusCircle, Activity as ActivityIcon, Settings, User } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const activitySchema = z.object({
  category: z.string().min(1, "Required"),
  description: z.string().min(1, "Required"),
  emissionKg: z.coerce.number(),
  date: z.string().min(1, "Required"),
});

export default function Profile() {
  const { data: profile, isLoading: profileLoading } = useGetMyProfile();
  const { data: activities, isLoading: activitiesLoading } = useGetActivities({ limit: 50 });
  const updateProfileMutation = useUpsertProfile();
  const logActivityMutation = useLogActivity();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isLogOpen, setIsLogOpen] = useState(false);

  const profileForm = useForm({
    resolver: zodResolver(profileSchema),
    values: { name: profile?.name || "" },
  });

  const activityForm = useForm({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      category: "",
      description: "",
      emissionKg: 0,
      date: new Date().toISOString().split('T')[0],
    }
  });

  const onProfileSubmit = (data: z.infer<typeof profileSchema>) => {
    updateProfileMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Profile updated successfully" });
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
      }
    });
  };

  const onActivitySubmit = (data: z.infer<typeof activitySchema>) => {
    // ensure ISO format
    data.date = new Date(data.date).toISOString();
    logActivityMutation.mutate({ data }, {
      onSuccess: () => {
        toast({ title: "Activity logged successfully" });
        setIsLogOpen(false);
        activityForm.reset();
        queryClient.invalidateQueries({ queryKey: getGetActivitiesQueryKey({}) });
        queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
      }
    });
  };

  if (profileLoading) {
    return <div className="p-8"><Skeleton className="h-[400px] w-full" /></div>;
  }

  // Prep chart data
  const chartData = [...(activities || [])]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map(a => ({
      date: new Date(a.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      kg: a.emissionKg
    }));

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto overflow-y-auto h-full space-y-8">
      {/* Header Profile Card */}
      <Card className="border-none shadow-md bg-gradient-to-r from-green-600 to-teal-700 text-white overflow-hidden">
        <CardContent className="p-8 md:p-12 flex flex-col md:flex-row items-center gap-8">
          <Avatar className="h-32 w-32 border-4 border-white/20 shadow-xl">
            <AvatarImage src={profile?.profileImage || ""} />
            <AvatarFallback className="text-4xl text-green-700 bg-white">{profile?.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="text-center md:text-left flex-1">
            <h1 className="text-4xl font-bold font-['Outfit'] mb-2">{profile?.name}</h1>
            <p className="text-green-100 mb-6 max-w-md">{profile?.email}</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-4">
              <div className="bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-xs text-green-100 uppercase tracking-wider font-semibold">Carbon Score</p>
                <p className="text-2xl font-bold font-['Outfit']">{profile?.carbonScore}</p>
              </div>
              <div className="bg-black/20 px-4 py-2 rounded-lg backdrop-blur-sm">
                <p className="text-xs text-green-100 uppercase tracking-wider font-semibold">Green Points</p>
                <p className="text-2xl font-bold font-['Outfit']">{profile?.greenPoints}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="history" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="history"><ActivityIcon className="w-4 h-4 mr-2" /> Activity</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="w-4 h-4 mr-2" /> Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-6 mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold font-['Outfit']">Emission History</h2>
            <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="btn-log-activity"><PlusCircle className="mr-2 h-4 w-4" /> Log Activity</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Log Carbon Activity</DialogTitle>
                  <DialogDescription>Record a new activity to track its impact on your footprint.</DialogDescription>
                </DialogHeader>
                <Form {...activityForm}>
                  <form onSubmit={activityForm.handleSubmit(onActivitySubmit)} className="space-y-4 pt-4">
                    <FormField
                      control={activityForm.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger></FormControl>
                            <SelectContent>
                              <SelectItem value="transport">Transport</SelectItem>
                              <SelectItem value="food">Food</SelectItem>
                              <SelectItem value="energy">Energy</SelectItem>
                              <SelectItem value="shopping">Shopping</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={activityForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Input placeholder="e.g. Drove to work" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={activityForm.control}
                        name="emissionKg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Emissions (kg CO₂)</FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={activityForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date</FormLabel>
                            <FormControl><Input type="date" {...field} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full mt-4" disabled={logActivityMutation.isPending}>
                      {logActivityMutation.isPending ? "Logging..." : "Save Activity"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6 h-72">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <XAxis dataKey="date" tick={{fontSize: 12}} stroke="#888888" />
                    <YAxis tick={{fontSize: 12}} stroke="#888888" />
                    <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Line type="monotone" dataKey="kg" stroke="var(--color-primary)" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">No activities logged yet.</div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h3 className="font-bold text-lg">Recent Log</h3>
            {activitiesLoading ? (
              <Skeleton className="h-32 w-full" />
            ) : activities?.length === 0 ? (
              <div className="p-8 text-center bg-muted/30 rounded-xl border border-dashed text-muted-foreground">Empty log</div>
            ) : (
              <div className="grid gap-3">
                {activities?.slice(0, 10).map(activity => (
                  <div key={activity.id} className="flex justify-between items-center p-4 bg-white border rounded-xl shadow-sm">
                    <div>
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground capitalize">{activity.category} • {new Date(activity.date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold font-['Outfit'] ${activity.emissionKg > 0 ? 'text-destructive' : 'text-green-600'}`}>
                        {activity.emissionKg > 0 ? '+' : ''}{activity.emissionKg} kg
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6 max-w-md">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl><Input {...field} data-testid="input-name" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="pt-2">
                    <Button type="submit" disabled={updateProfileMutation.isPending} data-testid="btn-save-profile">
                      {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}