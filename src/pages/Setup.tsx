import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import { Class } from "@/types/database";

type Role = "parent" | "teacher";

export default function Setup() {
  const [role, setRole] = useState<Role>("parent");
  const [name, setName] = useState("");
  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchUserProfile = useCallback(async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("role, name")
      .eq("id", user.id)
      .single();
    
    if (profileData) {
      setRole(profileData.role as Role);
      setName(profileData.name);
    }
    setInitialLoading(false);
  }, [user]);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .order("grade", { ascending: true });
    if (data) setClasses(data as Class[]);
  };

  useEffect(() => {
    fetchClasses();
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // 验证教师必须选择班级
    if (role === "teacher" && !classId) {
      toast({
        title: "设置失败",
        description: "请选择管理班级",
        variant: "destructive",
      });
      return;
    }

    // 验证家长填写学生信息时必须选择班级
    if (role === "parent" && studentName && !classId) {
      toast({
        title: "设置失败",
        description: "请选择学生班级",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // 更新profile (只更新name，role已经在注册时设置)
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name })
        .eq("id", user.id);

      if (profileError) throw profileError;

      if (role === "parent") {
        // 如果填写了学生信息，则创建学生记录
        if (studentName.trim() && classId) {
          const { error: studentError } = await supabase
            .from("students")
            .insert({
              parent_id: user.id,
              name: studentName,
              gender,
              class_id: classId,
            });

          if (studentError) throw studentError;
        }
      } else {
        // 创建教师班级关联
        const { error: teacherError } = await supabase
          .from("teacher_classes")
          .insert({
            teacher_id: user.id,
            class_id: classId,
          });

        if (teacherError) throw teacherError;
      }

      toast({
        title: "设置成功",
        description: "正在跳转...",
      });

      navigate("/");
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        title: "设置失败",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-center">
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <Card className="w-full max-w-lg shadow-[var(--shadow-card)]">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">完善信息</CardTitle>
              <CardDescription>
                您注册为：<span className="font-medium text-primary">{role === "parent" ? "家长" : "教师"}</span>
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={signOut}
              title="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 姓名 - 显示但可编辑 */}
            <div className="space-y-2">
              <Label htmlFor="name">{role === "parent" ? "家长姓名" : "教师姓名"}</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="请输入您的姓名"
                required
              />
            </div>

            {role === "parent" && (
              <>
                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    💡 提示：可以稍后在"管理学生"页面添加孩子信息
                  </p>
                </div>
                
                {/* 学生姓名 */}
                <div className="space-y-2">
                  <Label htmlFor="studentName">学生姓名（可选）</Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="请输入学生姓名"
                  />
                </div>

                {/* 性别 */}
                {studentName && (
                  <div className="space-y-2">
                    <Label>学生性别</Label>
                    <RadioGroup value={gender} onValueChange={(v) => setGender(v as "male" | "female")} className="flex gap-4">
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="cursor-pointer">男孩</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="cursor-pointer">女孩</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </>
            )}

            {/* 班级选择 */}
            {((role === "parent" && studentName) || role === "teacher") && (
              <div className="space-y-2">
                <Label htmlFor="class">{role === "parent" ? "学生班级" : "管理班级"}</Label>
                <Select value={classId} onValueChange={setClassId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择班级" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.grade} {cls.class_number}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <Button type="submit" className="w-full shadow-[var(--shadow-button)]" disabled={loading}>
              {loading ? "保存中..." : "完成设置"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
