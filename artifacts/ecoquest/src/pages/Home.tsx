import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Leaf, Shield, Globe, Zap, BarChart, Calculator, Target, Trophy } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 font-bold text-2xl font-['Outfit'] text-primary">
          <img src="/logo.svg" alt="EcoQuest Logo" className="h-8 w-8" />
          EcoQuest
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" data-testid="link-signin">Sign In</Button>
          </Link>
          <Link href="/sign-up">
            <Button data-testid="link-signup">Get Started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 md:py-32 px-6 max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <h1 className="text-5xl md:text-7xl font-bold font-['Outfit'] text-foreground leading-tight">
              Track your footprint.<br/>
              <span className="text-primary">Change your future.</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
              EcoQuest is your personal AI-powered sustainability companion. Understand your impact, complete daily challenges, and earn real rewards for making a difference.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/sign-up">
                <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto" data-testid="btn-hero-signup">
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/calculator">
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg w-full sm:w-auto bg-white" data-testid="btn-hero-calc">
                  Calculate Free
                </Button>
              </Link>
            </div>
            <div className="pt-4 flex items-center gap-4 text-sm font-medium text-muted-foreground">
              <div className="flex items-center gap-1"><Shield className="h-4 w-4 text-primary" /> AI-Powered</div>
              <div className="flex items-center gap-1"><Globe className="h-4 w-4 text-primary" /> Global Community</div>
              <div className="flex items-center gap-1"><Zap className="h-4 w-4 text-primary" /> Real Impact</div>
            </div>
          </div>
          <div className="flex-1 relative w-full max-w-lg lg:max-w-none">
            <div className="aspect-square rounded-[3rem] bg-green-100 overflow-hidden relative shadow-2xl border-8 border-white transform rotate-3 transition-transform hover:rotate-0 duration-500">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-transparent z-10" />
              <img 
                src="https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?auto=format&fit=crop&q=80&w=1000" 
                alt="Nature environment"
                className="object-cover w-full h-full"
              />
            </div>
            
            {/* Floating UI Elements */}
            <div className="absolute -left-8 top-1/4 bg-white p-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-full text-primary"><Leaf className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Daily Streak</p>
                  <p className="text-xl font-bold font-['Outfit'] text-foreground">12 Days</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -right-4 bottom-1/4 bg-white p-4 rounded-2xl shadow-xl border animate-in slide-in-from-bottom-10 fade-in duration-700 delay-500">
              <div className="flex items-center gap-3">
                <div className="bg-secondary/20 p-2 rounded-full text-secondary-foreground"><BarChart className="h-6 w-6" /></div>
                <div>
                  <p className="text-sm text-muted-foreground font-medium">Carbon Saved</p>
                  <p className="text-xl font-bold font-['Outfit'] text-foreground">45 kg</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="bg-muted py-24 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold font-['Outfit'] text-foreground mb-4">How it works</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">A gamified approach to sustainability that makes reducing your carbon footprint engaging and rewarding.</p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {[
                { title: "Measure", desc: "Use our AI calculator to understand your baseline emissions across transport, food, and lifestyle.", icon: Calculator, color: "text-blue-600", bg: "bg-blue-100" },
                { title: "Act", desc: "Complete daily eco-challenges and log activities to reduce your footprint systematically.", icon: Target, color: "text-green-600", bg: "bg-green-100" },
                { title: "Earn", desc: "Gain green points, climb the global leaderboard, and unlock exclusive sustainability badges.", icon: Trophy, color: "text-yellow-600", bg: "bg-yellow-100" }
              ].map((f, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl shadow-sm border hover-elevate transition-all">
                  <div className={`w-14 h-14 ${f.bg} ${f.color} rounded-2xl flex items-center justify-center mb-6`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-2xl font-bold font-['Outfit'] mb-3">{f.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 px-6 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2 font-bold font-['Outfit'] text-primary">
            <img src="/logo.svg" alt="Logo" className="h-6 w-6 grayscale opacity-70" />
            <span className="text-muted-foreground">EcoQuest &copy; {new Date().getFullYear()}</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="/learn"><span className="hover:text-primary cursor-pointer">Learn</span></Link>
            <Link href="/calculator"><span className="hover:text-primary cursor-pointer">Calculator</span></Link>
            <span className="hover:text-primary cursor-pointer">Privacy</span>
            <span className="hover:text-primary cursor-pointer">Terms</span>
          </div>
        </div>
      </footer>
    </div>
  );
}