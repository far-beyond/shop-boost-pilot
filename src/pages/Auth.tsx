import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Layout from "@/components/Layout";
import { toast } from "sonner";
import { Target, Mail, Lock } from "lucide-react";

export default function Auth() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("確認メールを送信しました。メールをご確認ください。");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast.error("ログインに失敗しました。メールアドレスとパスワードをご確認ください。");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 text-primary-foreground" style={{ background: "var(--gradient-primary)" }}>
            <Target className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">MapBoost AI</h1>
          <p className="text-muted-foreground mt-1">アカウントにログインまたは新規登録</p>
        </div>

        <Card>
          <Tabs defaultValue="login">
            <CardHeader className="pb-2">
              <TabsList className="w-full">
                <TabsTrigger value="login" className="flex-1">ログイン</TabsTrigger>
                <TabsTrigger value="signup" className="flex-1">新規登録</TabsTrigger>
              </TabsList>
            </CardHeader>

            <TabsContent value="login">
              <CardContent>
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">パスワード</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="login-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "処理中…" : "ログイン"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            <TabsContent value="signup">
              <CardContent>
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">メールアドレス</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">パスワード（6文字以上）</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="signup-password" type="password" placeholder="••••••••" className="pl-9" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? "処理中…" : "アカウント作成"}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </Layout>
  );
}
