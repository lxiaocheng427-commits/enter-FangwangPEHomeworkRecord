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
import { UserPlus, Trash2, ArrowLeft } from "lucide-react";
import { Class, Student } from "@/types/database";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function ManageStudents() {
  const [students, setStudents] = useState<Student[]>([]);
  const [studentName, setStudentName] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchClasses = async () => {
    const { data } = await supabase
      .from("classes")
      .select("*")
      .order("grade", { ascending: true });
    if (data) setClasses(data as Class[]);
  };

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("students")
      .select("*, classes(grade, class_number)")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setStudents(data as Student[]);
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("students")
        .insert({
          parent_id: user.id,
          name: studentName,
          gender,
          class_id: classId,
        });

      if (error) throw error;

      toast({
        title: "添加成功",
        description: `${studentName} 已添加`,
      });

      // 重置表单
      setStudentName("");
      setGender("male");
      setClassId("");
      setShowAddForm(false);
      fetchStudents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        title: "添加失败",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    try {
      const { error } = await supabase
        .from("students")
        .delete()
        .eq("id", studentId);

      if (error) throw error;

      toast({
        title: "删除成功",
        description: `${studentName} 已删除`,
      });

      fetchStudents();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 p-4">
      <div className="container max-w-2xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate("/")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回首页
        </Button>

        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>管理学生</CardTitle>
            <CardDescription>添加或删除您的孩子信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 学生列表 */}
            {students.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground">已添加的学生</h3>
                {students.map((student) => (
                  <Card key={student.id} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {student.gender === "male" ? "👦" : "👧"}
                        </div>
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {student.classes?.grade} {student.classes?.class_number}
                          </div>
                        </div>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>确认删除</AlertDialogTitle>
                            <AlertDialogDescription>
                              确定要删除 {student.name} 吗？该操作将同时删除所有运动记录，且无法撤销。
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>取消</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteStudent(student.id, student.name)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              确认删除
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {/* 添加学生按钮 */}
            {!showAddForm && (
              <Button
                onClick={() => setShowAddForm(true)}
                className="w-full shadow-[var(--shadow-button)]"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                添加新学生
              </Button>
            )}

            {/* 添加学生表单 */}
            {showAddForm && (
              <form onSubmit={handleAddStudent} className="space-y-4 p-4 border rounded-xl">
                <div className="space-y-2">
                  <Label htmlFor="studentName">学生姓名</Label>
                  <Input
                    id="studentName"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    placeholder="请输入学生姓名"
                    required
                  />
                </div>

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

                <div className="space-y-2">
                  <Label htmlFor="class">学生班级</Label>
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

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false);
                      setStudentName("");
                      setGender("male");
                      setClassId("");
                    }}
                    className="flex-1"
                  >
                    取消
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1 shadow-[var(--shadow-button)]"
                    disabled={loading}
                  >
                    {loading ? "添加中..." : "确认添加"}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
