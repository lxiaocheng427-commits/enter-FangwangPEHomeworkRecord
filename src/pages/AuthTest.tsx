import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface TestResult {
  data?: unknown;
  error?: unknown;
  type: string;
  session?: unknown;
  user?: unknown;
}

export default function AuthTest() {
  const [result, setResult] = useState<TestResult | null>(null);
  const [loading, setLoading] = useState(false);

  const testSignUp = async () => {
    setLoading(true);
    const testPhone = "13800138000";
    const testEmail = `${testPhone}@fangwang.edu.cn`;
    
    console.log("🧪 测试注册:", { testEmail, password: "123456" });
    
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: "123456",
      options: {
        data: {
          name: "测试用户",
          phone: testPhone,
        },
      },
    });
    
    console.log("📊 注册结果:", { data, error });
    setResult({ data, error, type: "signup" });
    setLoading(false);
  };

  const testConnection = async () => {
    setLoading(true);
    console.log("🔌 测试Supabase连接...");
    
    try {
      const { data, error } = await supabase.from("classes").select("*").limit(1);
      console.log("📊 连接测试结果:", { data, error });
      setResult({ data, error, type: "connection" });
    } catch (err) {
      console.error("❌ 连接错误:", err);
      setResult({ error: err, type: "connection" });
    }
    
    setLoading(false);
  };

  const checkAuthSettings = async () => {
    setLoading(true);
    console.log("⚙️ 检查认证设置...");
    
    const { data: session } = await supabase.auth.getSession();
    const { data: user } = await supabase.auth.getUser();
    
    console.log("📊 当前会话:", session);
    console.log("👤 当前用户:", user);
    
    setResult({ session, user, type: "auth-check" });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-8">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>认证系统测试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <Button onClick={testConnection} disabled={loading}>
              测试连接
            </Button>
            <Button onClick={checkAuthSettings} disabled={loading}>
              检查认证
            </Button>
            <Button onClick={testSignUp} disabled={loading}>
              测试注册
            </Button>
          </div>
          
          {result && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <h3 className="font-bold mb-2">测试结果 ({result.type}):</h3>
              <pre className="text-xs overflow-auto max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-950 rounded-lg text-sm">
            <h4 className="font-bold mb-2">📋 使用说明:</h4>
            <ol className="list-decimal list-inside space-y-1">
              <li>点击"测试连接"检查Supabase数据库连接</li>
              <li>点击"检查认证"查看当前认证状态</li>
              <li>点击"测试注册"尝试创建测试账号</li>
              <li>查看浏览器控制台获取详细日志</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
