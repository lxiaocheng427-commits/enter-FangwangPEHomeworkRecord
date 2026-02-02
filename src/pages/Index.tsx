import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import ParentHome from "./ParentHome";
import TeacherHome from "./TeacherHome";
import { ProfileWithRelations } from "@/types/database";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<ProfileWithRelations | null>(null);
  const [checkingProfile, setCheckingProfile] = useState(true);

  const checkProfile = useCallback(async () => {
    if (!user) return;
    
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*, students(*), teacher_classes(*)")
      .eq("id", user.id)
      .single();

    if (profileData) {
      // 检查是否需要完善信息
      if (profileData.role === "parent") {
        // 家长可以没有学生，允许进入首页
        setProfile(profileData as ProfileWithRelations);
      } else if (profileData.role === "teacher" && (!profileData.teacher_classes || profileData.teacher_classes.length === 0)) {
        // 教师必须有班级
        navigate("/setup");
        return;
      } else {
        setProfile(profileData as ProfileWithRelations);
      }
    }
    
    setCheckingProfile(false);
  }, [user, navigate]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        navigate("/login");
      } else {
        checkProfile();
      }
    }
  }, [user, loading, navigate, checkProfile]);

  if (loading || checkingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="text-center">
          <div className="text-4xl mb-4">🏃‍♂️</div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  // 根据角色显示不同的首页
  if (profile.role === "teacher") {
    return <TeacherHome />;
  }

  return <ParentHome />;
};

export default Index;