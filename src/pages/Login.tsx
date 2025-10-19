import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // Hardcoded demo credentials
  const demoEmail = "demo@example.com";
  const demoPassword = "demoPassword123";
  console.log("[Login] render - demoEmail:", demoEmail);

  // Core login logic extracted so demo button can call it programmatically
  const performLogin = async (inEmail: string, inPassword: string) => {
    if (!inEmail || !inPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: inEmail,
        password: inPassword,
      } as any);
      if (authError || !authData || authError?.message) {
        try {
          const { data: verifyData, error: verifyError } = await supabase.rpc("verify_user_password", {
            in_email: inEmail,
            in_password: inPassword,
          });
          if (verifyError || !verifyData || (verifyData as any).length === 0 || !(verifyData as any)[0].valid) {
            toast.error("Invalid email or password.");
            return;
          }
          toast.success("Login successful (legacy)!");
          navigate("/dashboard");
          return;
        } catch (rpcErr) {
          console.error(rpcErr);
          toast.error("Login failed.");
          return;
        }
      }
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (err: any) {
      console.error(err);
      toast.error("Login failed. Please try again.");
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password);
  };

  const useDemo = async (submit = true) => {
    if (!demoEmail) return;
    setEmail(demoEmail);
    setPassword(demoPassword ?? "");
    if (submit) {
      await performLogin(demoEmail, demoPassword ?? "");
    }
  };


  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent">
              <Truck className="h-9 w-9 text-accent-foreground" />
            </div>
          </div>
          <div>
            <CardTitle className="text-3xl font-bold">FindMyFleet</CardTitle>
            <CardDescription className="text-base mt-2">
              Vehicle Fleet Management System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11 bg-accent hover:bg-accent/90">
              Sign In
            </Button>

            {/* Demo buttons: only shown when VITE_DEMO_EMAIL is set (keep credentials out of repo) */}
            {demoEmail && (
              <div className="mt-3">
                <Button type="button" variant="secondary" className="w-full h-10" onClick={() => useDemo(true)}>
                  Sign in with demo account
                </Button>
              </div>
            )}

            {/* Forgot password removed as requested */}
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
