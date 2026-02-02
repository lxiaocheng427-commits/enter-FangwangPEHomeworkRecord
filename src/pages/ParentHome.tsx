import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Trophy, Activity, LogOut, UserCog, Users } from "lucide-react";
import { Student, ExerciseRecord } from "@/types/database";

const EXERCISE_TYPES = ["跳绳", "跑步", "仰卧起坐", "开合跳", "球类运动", "其他"];

export default function ParentHome() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [exerciseType, setExerciseType] = useState("");
  const [customExercise, setCustomExercise] = useState("");
  const [notes, setNotes] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>("");
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, thisMonth: 0 });
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const fetchStudents = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("students")
      .select("*, classes(grade, class_number)")
      .eq("parent_id", user.id)
      .order("created_at", { ascending: true });
    if (data && data.length > 0) {
      setStudents(data as Student[]);
      // 默认选中第一个学生
      if (!selectedStudent) {
        setSelectedStudent(data[0] as Student);
      }
    }
  }, [user, selectedStudent]);

  const fetchRecords = useCallback(async () => {
    if (!selectedStudent) return;
    const { data } = await supabase
      .from("exercise_records")
      .select("*")
      .eq("student_id", selectedStudent.id)
      .order("exercise_date", { ascending: false });
    
    if (data) {
      setRecords(data as ExerciseRecord[]);
      // 统计数据
      const now = new Date();
      const thisMonth = data.filter((r) => {
        const recordDate = new Date(r.exercise_date);
        return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
      });
      setStats({ total: data.length, thisMonth: thisMonth.length });
    }
  }, [selectedStudent]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    if (selectedStudent) {
      fetchRecords();
    }
  }, [selectedStudent, fetchRecords]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !photoFile) return;

    setLoading(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      
      // 检查是否已经提交过今天的记录
      const { data: existingRecord } = await supabase
        .from("exercise_records")
        .select("*")
        .eq("student_id", selectedStudent.id)
        .eq("exercise_date", today)
        .maybeSingle();

      if (existingRecord) {
        toast({
          title: "提交失败",
          description: "今天已经提交过运动记录了",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 上传照片
      const fileExt = photoFile.name.split('.').pop();
      const fileName = `${selectedStudent.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("exercise-photos")
        .upload(fileName, photoFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("exercise-photos")
        .getPublicUrl(fileName);

      // 保存记录
      const finalExerciseType = exerciseType === "其他" ? customExercise : exerciseType;
      const { error: insertError } = await supabase
        .from("exercise_records")
        .insert({
          student_id: selectedStudent.id,
          exercise_type: finalExerciseType,
          exercise_date: today,
          photo_url: publicUrl,
          notes,
        });

      if (insertError) throw insertError;

      toast({
        title: "提交成功",
        description: "今日运动记录已保存",
      });

      // 重置表单
      setExerciseType("");
      setCustomExercise("");
      setNotes("");
      setPhotoFile(null);
      setPhotoPreview("");
      fetchRecords();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      toast({
        title: "提交失败",
        description: errorMessage,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  if (!selectedStudent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>暂无学生信息</CardTitle>
            <CardDescription>请先添加学生</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/students")} className="w-full">
              <Users className="h-4 w-4 mr-2" />
              管理学生
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-6">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 rounded-b-3xl shadow-[var(--shadow-card)]">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            {/* 学生选择器 */}
            {students.length > 1 ? (
              <Select
                value={selectedStudent.id}
                onValueChange={(id) => {
                  const student = students.find(s => s.id === id);
                  if (student) setSelectedStudent(student);
                }}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-primary-foreground mb-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} - {s.classes?.grade} {s.classes?.class_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-1">{selectedStudent.name}</h1>
                <p className="text-sm opacity-90">
                  {selectedStudent.classes?.grade} {selectedStudent.classes?.class_number}
                </p>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => navigate("/students")} 
              className="text-primary-foreground hover:bg-white/20"
              title="管理学生"
            >
              <UserCog className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={signOut} 
              className="text-primary-foreground hover:bg-white/20"
              title="退出登录"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
        
        {/* 卡通形象 */}
        <div className="flex justify-center my-6">
          <div className="text-6xl">
            {selectedStudent.gender === "male" ? "🏃‍♂️" : "🏃‍♀️"}
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold">{stats.thisMonth}</div>
            <div className="text-xs opacity-90 mt-1">本月打卡</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs opacity-90 mt-1">累计天数</div>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl mx-auto px-4 mt-6 space-y-6">
        {/* 打卡表单 */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              今日运动打卡
            </CardTitle>
            <CardDescription>记录你的运动，坚持每一天！</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>运动项目</Label>
                <Select value={exerciseType} onValueChange={setExerciseType} required>
                  <SelectTrigger>
                    <SelectValue placeholder="选择运动项目" />
                  </SelectTrigger>
                  <SelectContent>
                    {EXERCISE_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {exerciseType === "其他" && (
                <div className="space-y-2">
                  <Label>请输入运动项目</Label>
                  <Input
                    value={customExercise}
                    onChange={(e) => setCustomExercise(e.target.value)}
                    placeholder="例如：室内操"
                    required
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label>运动照片</Label>
                <div className="flex flex-col gap-3">
                  {photoPreview && (
                    <img
                      src={photoPreview}
                      alt="预览"
                      className="w-full h-48 object-cover rounded-xl"
                    />
                  )}
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    required
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground">
                    📸 提示：请上传当日真实运动照片
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>备注（可选）</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="记录今天的运动感受..."
                  rows={3}
                />
              </div>

              <Button
                type="submit"
                className="w-full shadow-[var(--shadow-button)]"
                disabled={loading || !exerciseType || !photoFile}
              >
                {loading ? "提交中..." : "提交打卡"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* 历史记录 */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              打卡记录
            </CardTitle>
          </CardHeader>
          <CardContent>
            {records.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无打卡记录</p>
            ) : (
              <div className="space-y-3">
                {records.map((record) => (
                  <div
                    key={record.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    {record.photo_url && (
                      <img
                        src={record.photo_url}
                        alt="运动照片"
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{record.exercise_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(record.exercise_date).toLocaleDateString('zh-CN')}
                      </div>
                      {record.notes && (
                        <div className="text-sm text-muted-foreground mt-1">
                          {record.notes}
                        </div>
                      )}
                    </div>
                    <Trophy className="h-5 w-5 text-accent flex-shrink-0" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
