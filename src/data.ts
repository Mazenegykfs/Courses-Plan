export type StaffType = 'internal' | 'external';
export type Degree = 'أستاذ' | 'أستاذ مساعد' | 'مدرس' | 'مدرس مساعد' | 'معيد' | 'مهندس حر' | 'موجة بالمعاش' | 'أخرى';

export interface Staff {
  id: string;
  name: string;
  type: StaffType;
  degree: Degree | string;
  department?: string;
}

export interface Course {
  id: string;
  name: string;
  year: string;
  lectures: number;
  exercises: number;
}

export interface Assignment {
  id: string;
  staffId: string;
  courseId: string;
  theory: number;
  exercise: number;
  supervision: number;
  bonusTheory: number;
  bonusExercise: number;
  bonusSupervision: number;
}

export const initialStaff: Staff[] = [
  { id: '1', name: 'أ.د/منتصر مراسى عبد العاطى دويدار', type: 'internal', degree: 'أستاذ' },
  { id: '2', name: 'أ.م.د / مصطفى كامل عبدالرحمن', type: 'internal', degree: 'أستاذ مساعد' },
  { id: '3', name: 'د/ حاتم فؤاد ابو شعیشع', type: 'external', degree: 'أستاذ مساعد', department: 'كلية الهندسة جامعة طنطا' },
  { id: '4', name: 'م. نوران حسن محمد فلفل', type: 'external', degree: 'مهندس حر', department: 'حر' }
];

export const initialCourses: Course[] = [
  { id: 'c1', name: 'الرسم الهندسى والاسقاط', year: 'الاعدادیھ', lectures: 2, exercises: 4 },
  { id: 'c2', name: 'رياضيات هندسية (1)', year: 'الاعدادیھ', lectures: 4, exercises: 2 },
  { id: 'c3', name: 'فيزياء هندسية (1)', year: 'الاعدادیھ', lectures: 4, exercises: 2 }
];

export const initialAssignments: Assignment[] = [
  { id: 'a1', staffId: '1', courseId: 'c1', theory: 2, exercise: 0, supervision: 0, bonusTheory: 0, bonusExercise: 0, bonusSupervision: 0 },
  { id: 'a2', staffId: '2', courseId: 'c2', theory: 8, exercise: 0, supervision: 0, bonusTheory: 0, bonusExercise: 0, bonusSupervision: 0 },
  { id: 'a3', staffId: '3', courseId: 'c3', theory: 8, exercise: 0, supervision: 0, bonusTheory: 0, bonusExercise: 0, bonusSupervision: 0 }
];
