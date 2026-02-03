import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Dumbbell, RefreshCw, Users, GraduationCap } from "lucide-react";

const UNIFIED_PASSWORD = "123456";

type Role = "parent" | "teacher";

export default function Login() {
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("parent");
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
    console.log("正在注册:", { email, phone, name, role });

    try {
      // 第一步：注册用户
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password: UNIFIED_PASSWORD,
        options: {
          data: {
            name,
            phone,
            role,
          },
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      console.log("注册结果:", { authData, authError });

      if (authError) {
        console.error("注册错误详情:", authError);
        toast({
          title: "注册失败",
          description: authError.message.includes("already registered") || authError.message.includes("already been registered")
            ? "该手机号已注册" 
            : `错误：${authError.message}`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 第二步：等待用户创建完成后更新profile的role
      if (authData.user) {
        // 等待一下确保profile创建完成
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { error: profileError } = await supabase
          .from("profiles")
          .update({ role, name })
          .eq("id", authData.user.id);

        if (profileError) {
          console.error("更新profile错误:", profileError);
        }
      }

      toast({
        title: "注册成功",
        description: "账号已创建，正在跳转...",
      });
      
      // 注册成功后跳转到设置页面
      setTimeout(() => navigate("/setup"), 1000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      console.error("注册异常:", error);
      toast({
        title: "注册失败",
        description: errorMessage,
        variant: "destructive",
      });
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
                {/* 身份选择 */}
                <div className="space-y-3">
                  <Label>选择身份</Label>
                  <RadioGroup value={role} onValueChange={(v) => setRole(v as Role)} className="grid grid-cols-2 gap-4">
                    <div>
                      <RadioGroupItem value="parent" id="role-parent" className="peer sr-only" />
                      <Label
                        htmlFor="role-parent"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <Users className="mb-3 h-6 w-6" />
                        <span className="font-medium">家长</span>
                      </Label>
                    </div>
                    <div>
                      <RadioGroupItem value="teacher" id="role-teacher" className="peer sr-only" />
                      <Label
                        htmlFor="role-teacher"
                        className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-card p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                      >
                        <GraduationCap className="mb-3 h-6 w-6" />
                        <span className="font-medium">教师</span>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

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
