import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, RefreshCw } from "lucide-react";

const UNIFIED_PASSWORD = "123456";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // 页面加载时清除缓存（可选）
  useEffect(() => {
    // 检查是否有强制退出的标记
    const shouldClearCache = sessionStorage.getItem('force_logout');
    if (shouldClearCache) {
      sessionStorage.removeItem('force_logout');
      localStorage.clear();
      toast({
        title: "已退出",
        description: "缓存已清除",
      });
    }
  }, [toast]);

  // 手动清除缓存功能
  const handleClearCache = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast({
      title: "清除成功",
      description: "所有缓存数据已清除",
    });
    // 强制刷新页面
    window.location.reload();
  };

  // 将手机号转换为邮箱格式以适配Supabase
  const phoneToEmail = (phoneNumber: string) => {
    return `${phoneNumber}@fangwang.edu.cn`;
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

    const email = phoneToEmail(phone);
    console.log("正在登录:", { email, phone });

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: UNIFIED_PASSWORD,
    });

    console.log("登录结果:", { data, error });

    if (error) {
      console.error("登录错误详情:", error);
      toast({
        title: "登录失败",
        description: `${error.message}`,
        variant: "destructive",
      });
    } else {
      toast({
        title: "登录成功",
        description: "正在跳转...",
      });
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

    if (!name.trim()) {
      toast({
        title: "注册失败",
        description: "请输入姓名",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const email = phoneToEmail(phone);
    console.log("正在注册:", { email, phone, name });

    const { data, error } = await supabase.auth.signUp({
      email,
      password: UNIFIED_PASSWORD,
      options: {
        data: {
          name,
          phone,
        },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    console.log("注册结果:", { data, error });

    if (error) {
      console.error("注册错误详情:", error);
      toast({
        title: "注册失败",
        description: error.message.includes("already registered") || error.message.includes("already been registered")
          ? "该手机号已注册" 
          : `错误：${error.message}`,
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
          
          {/* 清除缓存按钮 */}
          <div className="mt-4 pt-4 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCache}
              className="w-full text-muted-foreground"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              清除缓存数据
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
