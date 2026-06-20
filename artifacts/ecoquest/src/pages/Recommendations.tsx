import { useGetRecommendations } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Cloud, DollarSign, Lightbulb } from "lucide-react";

export default function Recommendations() {
  const { data: recommendations, isLoading } = useGetRecommendations();

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid lg:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Smart Recommendations</h1>
        <p className="text-muted-foreground mt-2 text-lg">Personalized ideas to reduce your footprint and save money.</p>
      </div>

      {recommendations?.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/20 rounded-2xl border border-dashed">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
          <h3 className="text-xl font-medium text-foreground">No recommendations right now</h3>
          <p className="text-muted-foreground max-w-sm mt-2">Log more activities and update your profile to get personalized sustainability ideas.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          {recommendations?.map(rec => (
            <Card key={rec.id} className="overflow-hidden hover-elevate transition-shadow border-2">
              <div className="flex flex-col sm:flex-row h-full">
                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="secondary" className="capitalize">
                        {rec.category}
                      </Badge>
                      <Badge variant="outline" className={`
                        ${rec.difficulty === 'easy' ? 'text-green-600 border-green-200' : ''}
                        ${rec.difficulty === 'medium' ? 'text-yellow-600 border-yellow-200' : ''}
                        ${rec.difficulty === 'hard' ? 'text-red-600 border-red-200' : ''}
                      `}>
                        {rec.difficulty} to implement
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mb-2 leading-tight">{rec.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{rec.description}</p>
                  </div>
                </div>
                
                <div className="bg-muted/50 p-6 sm:w-48 flex flex-row sm:flex-col justify-center gap-6 sm:border-l border-t sm:border-t-0">
                  <div className="flex flex-col items-center text-center">
                    <Cloud className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="font-bold font-['Outfit'] text-xl">-{rec.carbonSavingKg}</span>
                    <span className="text-xs text-muted-foreground">kg CO₂/mo</span>
                  </div>
                  <div className="w-px h-full sm:w-full sm:h-px bg-border"></div>
                  <div className="flex flex-col items-center text-center">
                    <DollarSign className="h-6 w-6 text-green-500 mb-1" />
                    <span className="font-bold font-['Outfit'] text-xl">~${rec.moneySavingMonthly}</span>
                    <span className="text-xs text-muted-foreground">saved/mo</span>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}