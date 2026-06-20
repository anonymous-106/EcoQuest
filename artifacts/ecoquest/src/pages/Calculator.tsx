import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCalculateFootprint } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";
import { Calculator as CalcIcon, Trees, Car, Home } from "lucide-react";
import type { FootprintResult } from "@workspace/api-client-react";

const calculatorSchema = z.object({
  transportation: z.string().min(1, "Required"),
  dailyTravelKm: z.coerce.number().min(0, "Must be positive"),
  electricityBill: z.coerce.number().min(0, "Must be positive"),
  householdSize: z.coerce.number().min(1, "Must be at least 1"),
  foodPreference: z.string().min(1, "Required"),
  shoppingFrequency: z.string().min(1, "Required"),
  airTravelPerYear: z.coerce.number().min(0, "Must be positive"),
});

type CalculatorFormValues = z.infer<typeof calculatorSchema>;

const COLORS = ['hsl(152 65% 42%)', 'hsl(42 100% 50%)', 'hsl(180 60% 40%)', 'hsl(220 70% 50%)', 'hsl(300 60% 60%)'];

export default function Calculator() {
  const [result, setResult] = useState<FootprintResult | null>(null);
  const calculateMutation = useCalculateFootprint();

  const form = useForm<CalculatorFormValues>({
    resolver: zodResolver(calculatorSchema),
    defaultValues: {
      transportation: "",
      dailyTravelKm: 0,
      electricityBill: 0,
      householdSize: 1,
      foodPreference: "",
      shoppingFrequency: "",
      airTravelPerYear: 0,
    },
  });

  const onSubmit = (data: CalculatorFormValues) => {
    calculateMutation.mutate({ data }, {
      onSuccess: (res) => {
        setResult(res);
      }
    });
  };

  const chartData = result ? [
    { name: "Transportation", value: result.breakdown.transportation },
    { name: "Electricity", value: result.breakdown.electricity },
    { name: "Food", value: result.breakdown.food },
    { name: "Shopping", value: result.breakdown.shopping },
    { name: "Lifestyle", value: result.breakdown.lifestyle },
  ] : [];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto overflow-y-auto h-full space-y-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-bold font-['Outfit'] tracking-tight">Footprint Calculator</h1>
        <p className="text-muted-foreground mt-2 text-lg">Estimate your carbon emissions instantly.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-['Outfit']">Input Your Details</CardTitle>
            <CardDescription>Fill out this quick form to calculate your footprint.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="transportation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Transportation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="calc-transport">
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car_gas">Gasoline Car</SelectItem>
                          <SelectItem value="car_ev">Electric Car</SelectItem>
                          <SelectItem value="public">Public Transit</SelectItem>
                          <SelectItem value="bicycle">Bicycle / Walking</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dailyTravelKm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Daily Travel (km)</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="calc-km" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="electricityBill"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Monthly Elec. Bill ($)</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="calc-bill" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="householdSize"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Household Size</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="calc-house" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="airTravelPerYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Flights Per Year</FormLabel>
                        <FormControl><Input type="number" {...field} data-testid="calc-flights" /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="foodPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="calc-diet">
                            <SelectValue placeholder="Select diet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="meat_heavy">Meat Heavy</SelectItem>
                          <SelectItem value="balanced">Balanced Omnivore</SelectItem>
                          <SelectItem value="vegetarian">Vegetarian</SelectItem>
                          <SelectItem value="vegan">Vegan</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="shoppingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Shopping Habit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="calc-shop">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="frequent">Frequent</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="rare">Rare</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  className="w-full mt-6" 
                  disabled={calculateMutation.isPending}
                  data-testid="btn-calculate"
                >
                  {calculateMutation.isPending ? "Calculating..." : "Calculate My Footprint"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {result ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className={`border-none shadow-md overflow-hidden ${
              result.impactLevel === 'low' ? 'bg-green-50' : 
              result.impactLevel === 'moderate' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              <div className="p-8 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Your Annual Footprint</p>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <h2 className={`text-6xl font-bold font-['Outfit'] ${
                    result.impactLevel === 'low' ? 'text-green-700' : 
                    result.impactLevel === 'moderate' ? 'text-yellow-700' : 'text-red-700'
                  }`}>
                    {(result.annualKg / 1000).toFixed(1)}
                  </h2>
                  <span className="text-xl font-medium text-muted-foreground">tons CO₂e</span>
                </div>
                <div className={`inline-block px-4 py-1 rounded-full text-sm font-semibold capitalize ${
                    result.impactLevel === 'low' ? 'bg-green-200 text-green-800' : 
                    result.impactLevel === 'moderate' ? 'bg-yellow-200 text-yellow-800' : 'bg-red-200 text-red-800'
                  }`}>
                  {result.impactLevel} Impact Level
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-3 gap-4">
              <Card className="text-center p-4">
                <Trees className="h-8 w-8 mx-auto text-green-600 mb-2" />
                <p className="font-bold text-xl">{result.comparisons.treesNeeded}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">Trees needed to offset</p>
              </Card>
              <Card className="text-center p-4">
                <Car className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="font-bold text-xl">{result.comparisons.carKm.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">Km driven in a car</p>
              </Card>
              <Card className="text-center p-4">
                <Home className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <p className="font-bold text-xl">{result.comparisons.householdDays.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground leading-tight mt-1">Days of home energy</p>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Emissions Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="h-64 flex items-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip formatter={(value: number) => [`${value.toFixed(1)} kg`, 'Amount']} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="w-48 space-y-2">
                  {chartData.map((entry, index) => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="flex-1">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed rounded-xl bg-muted/20 text-muted-foreground p-8 text-center">
            <div className="bg-muted p-4 rounded-full mb-4">
              <CalcIcon className="h-8 w-8 opacity-50" />
            </div>
            <p className="font-medium text-lg">Waiting for input</p>
            <p className="text-sm mt-1 max-w-sm">Fill out the form and hit calculate to see your detailed carbon footprint breakdown.</p>
          </div>
        )}
      </div>
    </div>
  );
}