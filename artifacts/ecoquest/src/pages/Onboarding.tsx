import { useEffect } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useSubmitOnboarding, useGetMyProfile } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Leaf } from "lucide-react";

const onboardingSchema = z.object({
  country: z.string().min(1, "Country is required"),
  ageGroup: z.string().min(1, "Age group is required"),
  transportation: z.string().min(1, "Primary transportation is required"),
  dailyTravelKm: z.coerce.number().min(0, "Must be a positive number"),
  electricityBill: z.coerce.number().min(0, "Must be a positive number"),
  householdSize: z.coerce.number().min(1, "Must be at least 1"),
  foodPreference: z.string().min(1, "Diet preference is required"),
  shoppingFrequency: z.string().min(1, "Shopping frequency is required"),
  airTravelPerYear: z.coerce.number().min(0, "Must be a positive number"),
  recyclingHabits: z.string().min(1, "Recycling habit is required"),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const submitOnboarding = useSubmitOnboarding();
  const { data: profile, isLoading } = useGetMyProfile();

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      country: "",
      ageGroup: "",
      transportation: "",
      dailyTravelKm: 0,
      electricityBill: 0,
      householdSize: 1,
      foodPreference: "",
      shoppingFrequency: "",
      airTravelPerYear: 0,
      recyclingHabits: "",
    },
  });

  useEffect(() => {
    if (profile?.onboardingComplete) {
      setLocation("/dashboard");
    }
  }, [profile, setLocation]);

  if (isLoading) return null;
  if (profile?.onboardingComplete) return null;

  const onSubmit = (data: OnboardingFormValues) => {
    submitOnboarding.mutate({ data }, {
      onSuccess: () => {
        toast({
          title: "Profile setup complete!",
          description: "Welcome to your EcoQuest journey.",
        });
        setLocation("/dashboard");
      },
      onError: (err) => {
        toast({
          title: "Failed to save profile",
          description: "Please try again later.",
          variant: "destructive"
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-green-50/50 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl mb-8 flex items-center justify-center gap-3">
        <div className="bg-primary p-3 rounded-xl text-white">
          <Leaf className="h-8 w-8" />
        </div>
        <h1 className="text-4xl font-bold font-['Outfit'] text-primary">EcoQuest</h1>
      </div>

      <Card className="w-full max-w-2xl shadow-xl border-green-100">
        <CardHeader className="text-center pb-8 border-b bg-muted/30">
          <CardTitle className="text-2xl font-['Outfit']">Let's personalize your experience</CardTitle>
          <CardDescription className="text-base">
            Tell us a bit about your lifestyle to establish your carbon baseline.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. United States" {...field} data-testid="input-country" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="ageGroup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age Group</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-age">
                            <SelectValue placeholder="Select age group" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="under_18">Under 18</SelectItem>
                          <SelectItem value="18_24">18-24</SelectItem>
                          <SelectItem value="25_34">25-34</SelectItem>
                          <SelectItem value="35_44">35-44</SelectItem>
                          <SelectItem value="45_54">45-54</SelectItem>
                          <SelectItem value="55_plus">55+</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="transportation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Transportation</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-transport">
                            <SelectValue placeholder="Select transport mode" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="car_gas">Gasoline Car</SelectItem>
                          <SelectItem value="car_ev">Electric Car</SelectItem>
                          <SelectItem value="public">Public Transit</SelectItem>
                          <SelectItem value="bicycle">Bicycle / Walking</SelectItem>
                          <SelectItem value="motorcycle">Motorcycle</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dailyTravelKm"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Daily Travel (km)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-travel-km" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="householdSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Household Size (people)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-household" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="electricityBill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Electricity Bill ($)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-electricity" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foodPreference"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Diet Preference</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-diet">
                            <SelectValue placeholder="Select diet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="meat_heavy">Meat Heavy</SelectItem>
                          <SelectItem value="balanced">Balanced Omnivore</SelectItem>
                          <SelectItem value="pescatarian">Pescatarian</SelectItem>
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
                      <FormLabel>Shopping Habit (Clothes/Goods)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-shopping">
                            <SelectValue placeholder="Select frequency" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="frequent">Frequent (Weekly)</SelectItem>
                          <SelectItem value="moderate">Moderate (Monthly)</SelectItem>
                          <SelectItem value="rare">Rare (Few times a year)</SelectItem>
                          <SelectItem value="second_hand">Mostly Second-hand</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormControl>
                        <Input type="number" {...field} data-testid="input-flights" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="recyclingHabits"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Recycling Habit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-recycling">
                            <SelectValue placeholder="Select habit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="always">Always recycle & compost</SelectItem>
                          <SelectItem value="mostly">Mostly recycle</SelectItem>
                          <SelectItem value="sometimes">Sometimes</SelectItem>
                          <SelectItem value="rarely">Rarely / Never</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="pt-6 border-t">
                <Button 
                  type="submit" 
                  className="w-full h-12 text-lg font-medium" 
                  disabled={submitOnboarding.isPending}
                  data-testid="btn-submit-onboarding"
                >
                  {submitOnboarding.isPending ? "Setting up..." : "Complete Setup"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}