import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, TrendingUp, CheckCircle2, XCircle } from "lucide-react";
import { TeacherClass, Student, StudentStats } from "@/types/database";

export default function TeacherHome() {
  const [classInfo, setClassInfo] = useState<TeacherClass | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [todayStats, setTodayStats] = useState({ checked: 0, total: 0 });
  const [studentStats, setStudentStats] = useState<StudentStats[]>([]);
  const { user, signOut } = useAuth();

  const fetchClassInfo = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("teacher_classes")
      .select("*, classes(id, grade, class_number)")
      .eq("teacher_id", user.id)
      .single();
    if (data) setClassInfo(data as TeacherClass);
  }, [user]);

  const fetchStudents = useCallback(async () => {
    if (!classInfo?.classes) return;
    const { data: studentsData } = await supabase
      .from("students")
      .select("*, classes(grade, class_number)")
      .eq("class_id", classInfo.classes.id)
      .order("name");

    if (studentsData) {
      setStudents(studentsData as Student[]);

      // 获取今天的打卡统计
      const today = new Date().toISOString().split('T')[0];
      const { data: todayRecords } = await supabase
        .from("exercise_records")
        .select("student_id")
        .eq("exercise_date", today)
        .in("student_id", studentsData.map(s => s.id));

      const checkedIds = new Set(todayRecords?.map(r => r.student_id) || []);
      setTodayStats({
        checked: checkedIds.size,
        total: studentsData.length,
      });

      // 获取每个学生的统计数据
      const statsPromises = studentsData.map(async (student) => {
        const { data: records } = await supabase
          .from("exercise_records")
          .select("id, exercise_date")
          .eq("student_id", student.id);

        const totalDays = records?.length || 0;
        const hasCheckedToday = checkedIds.has(student.id);

        // 计算寒假总天数（假设30天）
        const vacationDays = 30;
        const completionRate = Math.round((totalDays / vacationDays) * 100);

        return {
          ...student,
          totalDays,
          completionRate,
          hasCheckedToday,
        };
      });

      const stats = await Promise.all(statsPromises);
      setStudentStats(stats as StudentStats[]);
    }
  }, [classInfo]);

  useEffect(() => {
    fetchClassInfo();
  }, [fetchClassInfo]);

  useEffect(() => {
    if (classInfo) {
      fetchStudents();
    }
  }, [classInfo, fetchStudents]);

  if (!classInfo?.classes) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">加载中...</p>
      </div>
    );
  }

  const completionPercentage = todayStats.total > 0
    ? (todayStats.checked / todayStats.total) * 100
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 pb-6">
      {/* 头部 */}
      <div className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground p-6 rounded-b-3xl shadow-[var(--shadow-card)]">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">教师管理</h1>
            <p className="text-sm opacity-90">
              {classInfo.classes.grade} {classInfo.classes.class_number}
            </p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="text-primary-foreground hover:bg-white/20">
            退出
          </Button>
        </div>

        {/* 今日看板 */}
        <Card className="bg-white/10 backdrop-blur-sm border-0 text-primary-foreground">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              今日打卡情况
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm opacity-90">完成进度</span>
                <span className="text-2xl font-bold">
                  {todayStats.checked} / {todayStats.total}
                </span>
              </div>
              <Progress value={completionPercentage} className="h-3 bg-white/20" />
              <p className="text-xs opacity-75 text-center">
                {todayStats.total - todayStats.checked} 人未打卡
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="container max-w-4xl mx-auto px-4 mt-6 space-y-6">
        {/* 未打卡学生 */}
        {studentStats.filter(s => !s.hasCheckedToday).length > 0 && (
          <Card className="shadow-[var(--shadow-card)] border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <XCircle className="h-5 w-5" />
                今日未打卡学生
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {studentStats
                  .filter(s => !s.hasCheckedToday)
                  .map((student) => (
                    <Badge key={student.id} variant="destructive" className="text-sm py-1 px-3">
                      {student.name}
                    </Badge>
                  ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 学生完成率报告 */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              学生完成情况
            </CardTitle>
            <CardDescription>寒假运动作业完成率统计</CardDescription>
          </CardHeader>
          <CardContent>
            {studentStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无数据</p>
            ) : (
              <div className="space-y-4">
                {studentStats.map((student) => (
                  <div key={student.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{student.name}</span>
                        {student.hasCheckedToday && (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground">
                          {student.totalDays} 天
                        </span>
                        <Badge variant={student.completionRate >= 80 ? "default" : student.completionRate >= 50 ? "secondary" : "destructive"}>
                          {student.completionRate}%
                        </Badge>
                      </div>
                    </div>
                    <Progress value={student.completionRate} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 班级概览 */}
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              班级概览
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-primary">{students.length}</div>
                <div className="text-sm text-muted-foreground mt-1">班级人数</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-muted/50">
                <div className="text-3xl font-bold text-primary">
                  {studentStats.length > 0
                    ? Math.round(
                        studentStats.reduce((sum, s) => sum + s.completionRate, 0) /
                          studentStats.length
                      )
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground mt-1">平均完成率</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
