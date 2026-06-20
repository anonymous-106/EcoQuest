import { useRef } from "react";
import { useGetChallenges, useCompleteChallenge, getGetChallengesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Target, Zap, Award } from "lucide-react";

export default function Challenges() {
  const { data: challenges, isLoading } = useGetChallenges();
  const completeMutation = useCompleteChallenge();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleComplete = (id: number) => {
    completeMutation.mutate({ id }, {
      onSuccess: (result) => {
        toast({
          title: "Challenge Completed! 🎉",
          description: `You earned ${result.pointsEarned} green points!`,
        });
        
        if (result.newBadges?.length > 0) {
          setTimeout(() => {
            toast({
              title: "New Badge Unlocked! 🏆",
              description: `You earned: ${result.newBadges.join(', ')}`,
            });
          }, 1500);
        }

        // Optimistically update
        queryClient.setQueryData(getGetChallengesQueryKey(), (old: any) => {
          if (!old) return old;
          return old.map((c: any) => c.id === id ? { ...c, completed: true, completedAt: new Date().toISOString() } : c);
        });
      },
      onError: () => {
        toast({
          title: "Error",
          description: "Could not complete challenge. Try again.",
          variant: "destructive"
        });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  const activeChallenges = challenges?.filter(c => !c.completed) || [];
  const completedChallenges = challenges?.filter(c => c.completed) || [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Daily Challenges</h1>
          <p className="text-muted-foreground mt-2 text-lg">Small actions, big impact. Earn points by completing tasks.</p>
        </div>
        <div className="flex items-center gap-2 bg-secondary/20 text-secondary-foreground px-4 py-2 rounded-full font-medium">
          <Zap className="h-5 w-5 text-secondary" />
          <span>{activeChallenges.length} Active Today</span>
        </div>
      </div>

      {activeChallenges.length === 0 && completedChallenges.length > 0 && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Award className="h-16 w-16 text-primary mb-4" />
            <h3 className="text-2xl font-bold font-['Outfit'] text-primary mb-2">All done for today!</h3>
            <p className="text-muted-foreground">Incredible work. You've completed all available challenges.</p>
          </CardContent>
        </Card>
      )}

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
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  className="w-full" 
                  onClick={() => handleComplete(challenge.id)}
                  disabled={completeMutation.isPending}
                  data-testid={`btn-complete-${challenge.id}`}
                >
                  {completeMutation.isPending ? "Completing..." : "Mark Complete"}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {completedChallenges.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold font-['Outfit'] mb-6 flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-green-500" /> 
            Completed Today
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-70">
            {completedChallenges.map(challenge => (
              <Card key={challenge.id} className="bg-muted/30 border-dashed">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground">Completed</Badge>
                    <div className="flex items-center font-bold text-muted-foreground">
                      +{challenge.points} pts
                    </div>
                  </div>
                  <CardTitle className="text-lg line-through text-muted-foreground">
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