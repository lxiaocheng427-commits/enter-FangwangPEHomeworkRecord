import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell } from "lucide-react";

const UNIFIED_PASSWORD = "123456";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 将手机号转换为邮箱格式以适配Supabase
  const phoneToEmail = (phoneNumber: string) => {
    return `${phoneNumber}@fangwang.school`;
  };

  const validatePhone = (phoneNumber: string) => {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validatePhone(phone)) {
      toast({
        title: "登录失败",
        description: "请输入正确的手机号码",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: phoneToEmail(phone),
      password: UNIFIED_PASSWORD,
    });

    if (error) {
      toast({
        title: "登录失败",
        description: "手机号不存在或密码错误",
        variant: "destructive",
      });
    } else {
      navigate("/");
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!validatePhone(phone)) {
      toast({
        title: "注册失败",
        description: "请输入正确的手机号码",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: phoneToEmail(phone),
      password: UNIFIED_PASSWORD,
      options: {
        data: {
          name,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      toast({
        title: "注册失败",
        description: error.message.includes("already registered") 
          ? "该手机号已注册" 
          : "注册失败，请稍后重试",
        variant: "destructive",
      });
    } else {
      toast({
        title: "注册成功",
        description: "账号已创建，正在登录...",
      });
      // 注册成功后自动跳转
      setTimeout(() => navigate("/"), 1000);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-md shadow-[var(--shadow-card)]">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-2">
            <div className="bg-gradient-to-br from-primary to-primary-glow p-3 rounded-2xl shadow-[var(--shadow-button)]">
              <Dumbbell className="h-8 w-8 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            方旺小学体育作业
          </CardTitle>
          <CardDescription>寒假运动记录系统</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">登录</TabsTrigger>
              <TabsTrigger value="signup">注册</TabsTrigger>
            </TabsList>
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-phone">手机号码</Label>
                  <Input
                    id="signin-phone"
                    type="tel"
                    placeholder="请输入手机号码"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    统一密码：123456
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full shadow-[var(--shadow-button)]"
                  disabled={loading}
                >
                  {loading ? "登录中..." : "登录"}
                </Button>
              </form>
            </TabsContent>
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">姓名</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="请输入您的姓名"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-phone">手机号码</Label>
                  <Input
                    id="signup-phone"
                    type="tel"
                    placeholder="请输入手机号码"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    maxLength={11}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    系统将自动设置密码为：123456
                  </p>
                </div>
                <Button
                  type="submit"
                  className="w-full shadow-[var(--shadow-button)]"
                  disabled={loading}
                >
                  {loading ? "注册中..." : "注册"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
