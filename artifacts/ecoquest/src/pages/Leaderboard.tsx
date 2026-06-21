import { useState } from "react";
import { useGetLeaderboard, useGetMyRank } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Medal, Star } from "lucide-react";

interface LeaderboardUser {
  userId: number;
  name: string;
  rank: number;
  greenPoints: number;
  streak: number;
  carbonScore: number;
  badges: string[];
  profileImage?: string;
}

interface LeaderboardListProps {
  data: LeaderboardUser[] | undefined;
  loading: boolean;
}

export default function Leaderboard() {
  const [type, setType] = useState<"global" | "weekly">("global");
  const { data: leaderboard, isLoading: boardLoading } = useGetLeaderboard({ type, limit: 50 });
  const { data: myRank, isLoading: rankLoading } = useGetMyRank();

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto overflow-y-auto h-full space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="bg-yellow-100 p-4 rounded-full mb-4">
          <Trophy className="h-10 w-10 text-yellow-600" />
        </div>
        <h1 className="text-3xl md:text-5xl font-bold font-['Outfit'] tracking-tight mb-2">Hall of Fame</h1>
        <p className="text-muted-foreground text-lg max-w-xl">See how your impact compares to the global community. Every point is a step toward a greener planet.</p>
      </div>

      {myRank && !rankLoading && (
        <Card className="bg-primary text-primary-foreground border-none shadow-lg overflow-hidden relative">
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="text-center md:text-left">
              <p className="text-primary-foreground/80 font-medium uppercase tracking-wider text-sm mb-1">Your Standing</p>
              <div className="flex items-baseline justify-center md:justify-start gap-2">
                <span className="text-5xl font-bold font-['Outfit']">#{myRank.rank}</span>
                <span className="text-primary-foreground/80">of {myRank.totalUsers.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex gap-8">
              <div className="text-center">
                <p className="text-primary-foreground/80 text-sm mb-1">Top</p>
                <p className="text-2xl font-bold font-['Outfit']">{myRank.percentile}%</p>
              </div>
              <div className="text-center">
                <p className="text-primary-foreground/80 text-sm mb-1">Score</p>
                <p className="text-2xl font-bold font-['Outfit']">{myRank.carbonScore}</p>
              </div>
              <div className="text-center">
                <p className="text-primary-foreground/80 text-sm mb-1">Points</p>
                <p className="text-2xl font-bold font-['Outfit']">{myRank.greenPoints}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="global" onValueChange={(v) => setType(v as "global" | "weekly")} className="w-full">
        <div className="flex justify-center mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="global">All Time Global</TabsTrigger>
            <TabsTrigger value="weekly">This Week</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="global" className="space-y-4">
          <LeaderboardList data={leaderboard as LeaderboardUser[] | undefined} loading={boardLoading} />
        </TabsContent>
        <TabsContent value="weekly" className="space-y-4">
          <LeaderboardList data={leaderboard as LeaderboardUser[] | undefined} loading={boardLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeaderboardList({ data, loading }: LeaderboardListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl">
        No ranking data available yet.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {data.map((user, idx) => (
        <div
          key={user.userId}
          className={`flex items-center p-4 sm:p-6 transition-colors hover:bg-muted/50 ${idx !== data.length - 1 ? "border-b" : ""}`}
        >
          <div className="w-12 text-center font-bold font-['Outfit'] text-xl sm:text-2xl flex-shrink-0 flex items-center justify-center">
            {user.rank === 1 ? <Medal className="h-8 w-8 text-yellow-500 fill-yellow-500" /> :
             user.rank === 2 ? <Medal className="h-8 w-8 text-gray-400 fill-gray-400" /> :
             user.rank === 3 ? <Medal className="h-8 w-8 text-amber-600 fill-amber-600" /> :
             <span className="text-muted-foreground">#{user.rank}</span>}
          </div>
          <div className="flex items-center flex-1 gap-4 ml-4 overflow-hidden">
            <Avatar className="h-12 w-12 border-2 border-background shadow-sm">
              <AvatarImage src={user.profileImage} />
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="overflow-hidden">
              <h3 className="font-bold text-lg truncate">{user.name}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-sm font-medium text-green-600 flex items-center gap-1">
                  <Star className="h-3 w-3 fill-green-600" /> {user.greenPoints} pts
                </span>
                <span className="text-muted-foreground text-xs hidden sm:inline">
                  • {user.streak} day streak
                </span>
              </div>
            </div>
          </div>
          <div className="hidden md:flex gap-2 w-48 justify-end">
            {user.badges?.slice(0, 2).map((badge) => (
              <Badge key={badge} variant="outline" className="bg-primary/5 border-primary/20 text-xs py-0.5">
                {badge}
              </Badge>
            ))}
            {user.badges?.length > 2 && (
              <Badge variant="outline" className="text-xs">+{user.badges.length - 2}</Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
