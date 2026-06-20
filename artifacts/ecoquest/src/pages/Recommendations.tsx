import { useGetRecommendations, useCompleteRecommendation, getGetRecommendationsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, DollarSign, Lightbulb, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

function useCountdown(resetsAt: string | null) {
  const [, setTick] = [0, () => {}];
  if (!resetsAt) return null;

  const diff = new Date(resetsAt).getTime() - Date.now();
  if (diff <= 0) return null;

  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

function RecommendationCard({ rec }: { rec: any }) {
  const completeMutation = useCompleteRecommendation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const countdown = useCountdown(rec.completedUntil ?? null);
  const isDone = rec.completedUntil != null && new Date(rec.completedUntil) > new Date();

  const handleMark = () => {
    completeMutation.mutate({ id: rec.id }, {
      onSuccess: (result) => {
        toast({
          title: "Nice work! ✅",
          description: "This idea will reset in 24 hours.",
        });
        queryClient.setQueryData(getGetRecommendationsQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((r: any) =>
            r.id === rec.id ? { ...r, completedUntil: result.completedUntil } : r
          );
        });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not mark as done. Try again.", variant: "destructive" });
      },
    });
  };

  return (
    <Card className={`overflow-hidden transition-all border-2 ${isDone ? "opacity-60 border-dashed bg-muted/30" : "hover-elevate"}`}>
      <div className="flex flex-col sm:flex-row h-full">
        <div className="p-6 flex-1 flex flex-col justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge variant="secondary" className="capitalize">{rec.category}</Badge>
              <Badge variant="outline" className={`
                ${rec.difficulty === 'easy' ? 'text-green-600 border-green-200' : ''}
                ${rec.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' : ''}
                ${rec.difficulty === 'hard' ? 'text-red-600 border-red-200' : ''}
              `}>
                {rec.difficulty} to implement
              </Badge>
              {isDone && (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </Badge>
              )}
            </div>
            <CardTitle className="text-xl mb-2 leading-tight">{rec.title}</CardTitle>
            <p className="text-muted-foreground text-sm">{rec.description}</p>
          </div>

          {isDone ? (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-medium">
              <Clock className="h-4 w-4" />
              Resets in {countdown ?? "soon"}
            </div>
          ) : (
            <Button
              variant="outline"
              className="w-full sm:w-auto border-primary/40 text-primary hover:bg-primary/10"
              onClick={handleMark}
              disabled={completeMutation.isPending}
            >
              {completeMutation.isPending ? "Marking..." : "✓ I did this!"}
            </Button>
          )}
        </div>

        <div className="bg-muted/50 p-6 sm:w-48 flex flex-row sm:flex-col justify-center gap-6 sm:border-l border-t sm:border-t-0">
          <div className="flex flex-col items-center text-center">
            <Cloud className="h-6 w-6 text-blue-500 mb-1" />
            <span className="font-bold font-['Outfit'] text-xl">-{rec.carbonSavingKg}</span>
            <span className="text-xs text-muted-foreground">kg CO₂/mo</span>
          </div>
          <div className="w-px h-full sm:w-full sm:h-px bg-border" />
          <div className="flex flex-col items-center text-center">
            <DollarSign className="h-6 w-6 text-green-500 mb-1" />
            <span className="font-bold font-['Outfit'] text-xl">~${rec.moneySavingMonthly}</span>
            <span className="text-xs text-muted-foreground">saved/mo</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function Recommendations() {
  const { data: recommendations, isLoading } = useGetRecommendations();

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const active = recommendations?.filter(r => !r.completedUntil || new Date(r.completedUntil!) <= new Date()) ?? [];
  const done = recommendations?.filter(r => r.completedUntil && new Date(r.completedUntil!) > new Date()) ?? [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Smart Ideas</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Mark ideas you act on — they refresh every 24 hours so you can do them again.
        </p>
      </div>

      {recommendations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-foreground">No ideas right now</h3>
          <p className="text-muted-foreground max-w-sm mt-2">Log more activities to unlock personalized eco ideas.</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-primary" />
                Available ({active.length})
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {active.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
              </div>
            </div>
          )}

          {done.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                Done today ({done.length})
              </h2>
              <div className="grid lg:grid-cols-2 gap-6">
                {done.map(rec => <RecommendationCard key={rec.id} rec={rec} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
