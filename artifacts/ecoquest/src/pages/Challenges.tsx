import { useEffect, useState } from "react";
import { useGetChallenges, useCompleteChallenge, getGetChallengesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Target, Zap, Award, Clock, RefreshCw } from "lucide-react";

function useMidnightCountdown() {
  const getTimeLeft = () => {
    const now = new Date();
    const midnight = new Date();
    midnight.setHours(24, 0, 0, 0);
    const diff = midnight.getTime() - now.getTime();
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const [countdown, setCountdown] = useState(getTimeLeft);

  useEffect(() => {
    const interval = setInterval(() => setCountdown(getTimeLeft()), 1000);
    return () => clearInterval(interval);
  }, []);

  return countdown;
}

export default function Challenges() {
  const { data: challenges, isLoading } = useGetChallenges();
  const completeMutation = useCompleteChallenge();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const countdown = useMidnightCountdown();

  const handleComplete = (id: number) => {
    completeMutation.mutate({ id }, {
      onSuccess: (result) => {
        toast({
          title: result.pointsEarned > 0 ? "Challenge Completed! 🎉" : "Already completed!",
          description: result.pointsEarned > 0
            ? `+${result.pointsEarned} green points earned!`
            : "You already completed this one today.",
        });

        if (result.newBadges?.length > 0) {
          setTimeout(() => {
            toast({
              title: "New Badge Unlocked! 🏆",
              description: `You earned: ${result.newBadges.join(", ")}`,
            });
          }, 1500);
        }

        queryClient.setQueryData(getGetChallengesQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((c: any) =>
            c.id === id ? { ...c, completed: true, completedAt: new Date().toISOString() } : c
          );
        });
      },
      onError: () => {
        toast({ title: "Error", description: "Could not complete challenge. Try again.", variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const activeChallenges = challenges?.filter(c => !c.completed) ?? [];
  const completedChallenges = challenges?.filter(c => c.completed) ?? [];
  const totalPoints = challenges?.reduce((sum, c) => sum + c.points, 0) ?? 0;
  const earnedPoints = completedChallenges.reduce((sum, c) => sum + c.points, 0);

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Daily Challenges</h1>
          <p className="text-muted-foreground mt-2 text-lg">Small actions, big impact. Fresh set of tasks resets every day.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-secondary/10 text-foreground px-4 py-2 rounded-full font-medium border">
            <Zap className="h-4 w-4 text-yellow-500" />
            <span>{activeChallenges.length} active</span>
          </div>
          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-full font-medium text-sm">
            <RefreshCw className="h-4 w-4 text-primary" />
            <span>Resets in</span>
            <span className="font-mono font-bold text-primary">{countdown}</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {(challenges?.length ?? 0) > 0 && (
        <div className="bg-muted/40 rounded-2xl p-5 border flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1 w-full">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-foreground">Today's progress</span>
              <span className="text-primary font-bold">{completedChallenges.length}/{challenges?.length ?? 0} completed</span>
            </div>
            <div className="h-3 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-700"
                style={{ width: `${((challenges?.length ?? 0) > 0 ? completedChallenges.length / (challenges?.length ?? 1) : 0) * 100}%` }}
              />
            </div>
          </div>
          <div className="text-right shrink-0">
            <p className="text-2xl font-bold font-['Outfit'] text-primary">{earnedPoints}</p>
            <p className="text-xs text-muted-foreground">of {totalPoints} pts</p>
          </div>
        </div>
      )}

      {/* All done banner */}
      {activeChallenges.length === 0 && completedChallenges.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-bold font-['Outfit'] text-primary mb-2">All done for today! 🎉</h3>
            <p className="text-muted-foreground">Incredible work. New challenges drop at midnight.</p>
            <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground font-mono bg-muted px-4 py-2 rounded-full">
              <Clock className="h-4 w-4" />
              Next batch in {countdown}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active challenges */}
      {activeChallenges.length > 0 && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeChallenges.map(challenge => (
            <Card key={challenge.id} className="flex flex-col hover-elevate transition-shadow group border-2">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start mb-2">
                  <Badge variant="outline" className={`
                    ${challenge.difficulty === 'easy' ? 'bg-green-50 text-green-700 border-green-200' : ''}
                    ${challenge.difficulty === 'medium' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : ''}
                    ${challenge.difficulty === 'hard' ? 'bg-red-50 text-red-700 border-red-200' : ''}
                  `}>
                    {challenge.difficulty}
                  </Badge>
                  <div className="flex items-center font-bold text-primary font-['Outfit']">
                    +{challenge.points} pts
                  </div>
                </div>
                <CardTitle className="text-xl leading-tight group-hover:text-primary transition-colors">
                  {challenge.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-muted-foreground text-sm">{challenge.description}</p>
                <Badge variant="secondary" className="mt-3 capitalize text-xs">{challenge.category}</Badge>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  className="w-full"
                  onClick={() => handleComplete(challenge.id)}
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? "Completing..." : "✓ Mark Complete"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Completed section */}
      {completedChallenges.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold font-['Outfit'] mb-4 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Completed Today
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {completedChallenges.map(challenge => (
              <Card key={challenge.id} className="bg-muted/30 border-dashed">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start mb-1">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200 gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Done
                    </Badge>
                    <span className="text-sm font-bold text-muted-foreground">+{challenge.points} pts</span>
                  </div>
                  <CardTitle className="text-base line-through text-muted-foreground leading-tight">
                    {challenge.title}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
