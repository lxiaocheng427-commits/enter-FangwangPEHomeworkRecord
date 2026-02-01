export interface Profile {
  id: string;
  role: 'parent' | 'teacher';
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  grade: string;
  class_number: string;
  school_name: string;
  created_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  name: string;
  gender: 'male' | 'female';
  class_id: string;
  created_at: string;
  classes?: Class;
}

export interface TeacherClass {
  id: string;
  teacher_id: string;
  class_id: string;
  created_at: string;
  classes?: Class;
}

export interface ExerciseRecord {
  id: string;
  student_id: string;
  exercise_type: string;
  exercise_date: string;
  photo_url: string | null;
  notes: string | null;
  created_at: string;
}

export interface ProfileWithRelations extends Profile {
  students?: Student[];
  teacher_classes?: TeacherClass[];
}

export interface StudentStats extends Student {
  totalDays: number;
  completionRate: number;
  hasCheckedToday: boolean;
}
