import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { Users, UserCheck, BookOpen, LayoutDashboard, Plus, Trash2, Book, FileText, ClipboardList, Download, Upload, Save, Printer } from 'lucide-react';
import { toPng } from 'html-to-image';
import { asBlob } from 'html-docx-js-typescript';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
// @ts-ignore
import { Staff, Course, Assignment, initialStaff, initialCourses, initialAssignments, StaffType, Degree } from './data';

import ministryLogoImg from './assets/ministry-logo.png';
import instituteLogoImg from './assets/institute-logo.png';

type MainSection = 'dashboard' | 'management' | 'reports';
type ManagementTab = 'assignments' | 'courses' | 'staff';
type ReportTab = 'formB' | 'formC' | 'formA';

export default function App() {
  const ministryLogo = ministryLogoImg;
  const instituteLogo = instituteLogoImg;

  const [activeSection, setActiveSection] = useState<MainSection>('dashboard');
  const [activeManagementTab, setActiveManagementTab] = useState<ManagementTab>('assignments');
  const [activeReportTab, setActiveReportTab] = useState<ReportTab>('formC');
  
  const [selectedDepartment, setSelectedDepartment] = useState<string>('قسم العلوم الاساسية');

  const getAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    let academicYear = '';
    if (month >= 9) {
      academicYear = `${year}/${year + 1}`;
    } else {
      academicYear = `${year - 1}/${year}`;
    }
    
    let semester = '';
    if (month >= 9 || month === 1) {
      semester = 'الفصل الدراسي الأول';
    } else {
      semester = 'الفصل الدراسي الثاني';
    }
    
    return `${academicYear} - ${semester}`;
  };
  
  const [staffData, setStaffData] = useState<Record<string, Staff[]>>({
    'قسم العلوم الاساسية': initialStaff,
    'برنامج الهندسة المدنية': [],
    'برنامج الهندسة المعمارية': [],
    'برنامج الهندسة الكهربية': []
  });
  const [courseData, setCourseData] = useState<Record<string, Course[]>>({
    'قسم العلوم الاساسية': initialCourses,
    'برنامج الهندسة المدنية': [],
    'برنامج الهندسة المعمارية': [],
    'برنامج الهندسة الكهربية': []
  });
  const [assignmentData, setAssignmentData] = useState<Record<string, Assignment[]>>({
    'قسم العلوم الاساسية': initialAssignments,
    'برنامج الهندسة المدنية': [],
    'برنامج الهندسة المعمارية': [],
    'برنامج الهندسة الكهربية': []
  });

  const staffList = staffData[selectedDepartment] || [];
  const courseList = courseData[selectedDepartment] || [];
  const assignmentList = assignmentData[selectedDepartment] || [];

  const setStaffList = (newList: Staff[] | ((prev: Staff[]) => Staff[])) => {
    setStaffData(prev => {
      const currentList = prev[selectedDepartment] || [];
      const updatedList = typeof newList === 'function' ? newList(currentList) : newList;
      return { ...prev, [selectedDepartment]: updatedList };
    });
  };

  const setCourseList = (newList: Course[] | ((prev: Course[]) => Course[])) => {
    setCourseData(prev => {
      const currentList = prev[selectedDepartment] || [];
      const updatedList = typeof newList === 'function' ? newList(currentList) : newList;
      return { ...prev, [selectedDepartment]: updatedList };
    });
  };

  const setAssignmentList = (newList: Assignment[] | ((prev: Assignment[]) => Assignment[])) => {
    setAssignmentData(prev => {
      const currentList = prev[selectedDepartment] || [];
      const updatedList = typeof newList === 'function' ? newList(currentList) : newList;
      return { ...prev, [selectedDepartment]: updatedList };
    });
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    const staffWs = XLSX.utils.json_to_sheet([
      { ID: '1', Name: 'أحمد محمد', Type: 'internal', Degree: 'مدرس', Department: '' },
      { ID: '2', Name: 'محمود علي', Type: 'external', Degree: 'أستاذ', Department: 'جامعة القاهرة' }
    ]);
    XLSX.utils.book_append_sheet(wb, staffWs, "Staff");

    const coursesWs = XLSX.utils.json_to_sheet([
      { ID: 'c1', Name: 'رياضيات 1', Year: 'الفرقة الأولى', Lectures: 4, Exercises: 2 }
    ]);
    XLSX.utils.book_append_sheet(wb, coursesWs, "Courses");

    const assignmentsWs = XLSX.utils.json_to_sheet([
      { StaffID: '1', CourseID: 'c1', Theory: 2, Exercise: 2, Supervision: 0, BonusTheory: 0, BonusExercise: 0, BonusSupervision: 0 }
    ]);
    XLSX.utils.book_append_sheet(wb, assignmentsWs, "Assignments");

    XLSX.writeFile(wb, "Teaching_Load_Template.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target?.result;
      const wb = XLSX.read(bstr, { type: 'binary' });

      // Parse Staff
      const staffWs = wb.Sheets["Staff"];
      if (staffWs) {
        const staffData = XLSX.utils.sheet_to_json(staffWs);
        const newStaff = staffData.map((s: any) => ({
          id: String(s.ID),
          name: s.Name,
          type: (s.Type === 'external' ? 'external' : 'internal') as StaffType,
          degree: s.Degree,
          department: s.Department || undefined
        }));
        if (newStaff.length > 0) setStaffList(newStaff);
      }

      // Parse Courses
      const coursesWs = wb.Sheets["Courses"];
      if (coursesWs) {
        const coursesData = XLSX.utils.sheet_to_json(coursesWs);
        const newCourses = coursesData.map((c: any) => ({
          id: String(c.ID),
          name: c.Name,
          year: c.Year,
          lectures: Number(c.Lectures) || 0,
          exercises: Number(c.Exercises) || 0
        }));
        if (newCourses.length > 0) setCourseList(newCourses);
      }

      // Parse Assignments
      const assignmentsWs = wb.Sheets["Assignments"];
      if (assignmentsWs) {
        const assignmentsData = XLSX.utils.sheet_to_json(assignmentsWs);
        const newAssignments = assignmentsData.map((a: any, index) => ({
          id: String(Date.now() + index),
          staffId: String(a.StaffID),
          courseId: String(a.CourseID),
          theory: Number(a.Theory) || 0,
          exercise: Number(a.Exercise) || 0,
          supervision: Number(a.Supervision) || 0,
          bonusTheory: Number(a.BonusTheory) || 0,
          bonusExercise: Number(a.BonusExercise) || 0,
          bonusSupervision: Number(a.BonusSupervision) || 0,
        }));
        if (newAssignments.length > 0) setAssignmentList(newAssignments);
      }
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      alert('تم استيراد البيانات بنجاح!');
    };
    reader.readAsBinaryString(file);
  };

  const handleExportData = () => {
    const wb = XLSX.utils.book_new();
    
    const staffWs = XLSX.utils.json_to_sheet(staffList.map(s => ({
      ID: s.id, Name: s.name, Type: s.type, Degree: s.degree, Department: s.department || ''
    })));
    XLSX.utils.book_append_sheet(wb, staffWs, "Staff");

    const coursesWs = XLSX.utils.json_to_sheet(courseList.map(c => ({
      ID: c.id, Name: c.name, Year: c.year, Lectures: c.lectures, Exercises: c.exercises
    })));
    XLSX.utils.book_append_sheet(wb, coursesWs, "Courses");

    const assignmentsWs = XLSX.utils.json_to_sheet(assignmentList.map(a => ({
      StaffID: a.staffId, CourseID: a.courseId, Theory: a.theory, Exercise: a.exercise, Supervision: a.supervision, BonusTheory: a.bonusTheory, BonusExercise: a.bonusExercise, BonusSupervision: a.bonusSupervision
    })));
    XLSX.utils.book_append_sheet(wb, assignmentsWs, "Assignments");

    XLSX.writeFile(wb, "Teaching_Load_Data.xlsx");
  };

  // Computed Data for Reports
  const getComputedStaff = (type: StaffType) => {
    return staffList
      .filter(s => s.type === type)
      .map(staff => {
        const assignments = assignmentList
          .filter(a => a.staffId === staff.id)
          .map(a => {
            const course = courseList.find(c => c.id === a.courseId);
            return {
              course: course?.name || 'مقرر محذوف',
              year: course?.year || '',
              theory: a.theory,
              exercise: a.exercise,
              supervision: a.supervision,
              bonusTheory: a.bonusTheory,
              bonusExercise: a.bonusExercise,
              bonusSupervision: a.bonusSupervision,
            };
          });
        return {
          id: staff.id,
          name: staff.name,
          degree: staff.degree,
          department: staff.department,
          assignments
        };
      })
      .filter(s => s.assignments.length > 0);
  };

  const getComputedCourses = () => {
    return courseList.map(course => {
      const staffAssignments = assignmentList
        .filter(a => a.courseId === course.id)
        .map(a => {
          const staff = staffList.find(s => s.id === a.staffId);
          return {
            name: staff?.name || 'عضو محذوف',
            degree: staff?.degree || '',
            theory: a.theory,
            exercise: a.exercise,
          };
        });
      return {
        name: course.name,
        lectures: course.lectures,
        exercises: course.exercises,
        staff: staffAssignments
      };
    }).filter(c => c.staff.length > 0);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            {/* Right Logo (Ministry) */}
            <div className="text-center hidden md:block">
              <img 
                src="https://yt3.googleusercontent.com/p-gOwvpL7qWfqZ0XAC-zsuWXg4ATxIxGCYtGtbsSSh2HGogCeFX17SaueyejOtnJywe32_93FQ=s900-c-k-c0x00ffffff-no-rj" 
                alt="وزارة التعليم العالي والبحث العلمي" 
                className="h-16 w-auto mx-auto mb-1 object-contain" 
                referrerPolicy="no-referrer" 
              />
              <p className="text-[10px] font-bold text-gray-700">وزارة التعليم العالي<br/>والبحث العلمي</p>
            </div>

            {/* Center Text */}
            <div className="text-center flex-1">
              <h1 className="text-2xl font-bold text-blue-900">نظام إدارة الخطة الدراسية</h1>
              <p className="text-sm text-gray-500 mt-1">المعهد العالي للهندسة والتكنولوجيا بكفر الشيخ</p>
            </div>

            {/* Left Logo (Institute) */}
            <div className="text-center hidden md:block">
              <img 
                src="https://mis.kfs-hiet.edu.eg/public//storage//img/settings/inb0K3BloxnrUhM86JVsw3yu4gscsWc8pH4kmlxR.png" 
                alt="المعهد العالي للهندسة والتكنولوجيا بكفر الشيخ" 
                className="h-16 w-auto mx-auto mb-1 object-contain" 
                referrerPolicy="no-referrer" 
              />
              <p className="text-[10px] font-bold text-gray-700">المعهد العالي للهندسة<br/>والتكنولوجيا بكفر الشيخ</p>
            </div>
          </div>
          
          <div className="flex justify-center md:justify-end space-x-3 space-x-reverse mt-4">
            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
              title="تحميل قالب فارغ"
            >
              <Download className="w-4 h-4 ml-2" />
              قالب
            </button>
            <label className="flex items-center px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 cursor-pointer">
              <Upload className="w-4 h-4 ml-2" />
              استيراد
              <input 
                type="file" 
                accept=".xlsx, .xls" 
                className="hidden" 
                onChange={handleImport}
                ref={fileInputRef}
              />
            </label>
            <button 
              onClick={handleExportData}
              className="flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700"
            >
              <Save className="w-4 h-4 ml-2" />
              حفظ البيانات
            </button>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white shadow-sm mb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 space-x-reverse overflow-x-auto items-center">
            <TabButton active={activeSection === 'dashboard'} onClick={() => setActiveSection('dashboard')} icon={<LayoutDashboard className="w-5 h-5 ml-2" />} label="الرئيسية" />
            <TabButton active={activeSection === 'management'} onClick={() => setActiveSection('management')} icon={<ClipboardList className="w-5 h-5 ml-2" />} label="الإدارة" />
            <TabButton active={activeSection === 'reports'} onClick={() => setActiveSection('reports')} icon={<FileText className="w-5 h-5 ml-2" />} label="التقارير" />
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {activeSection === 'dashboard' && (
          <DashboardView 
            totalInternal={staffList.filter(s => s.type === 'internal').length} 
            totalExternal={staffList.filter(s => s.type === 'external').length} 
            totalCourses={courseList.length} 
            selectedDepartment={selectedDepartment}
            setSelectedDepartment={setSelectedDepartment}
          />
        )}

        {activeSection === 'management' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
              <SubNavButton active={activeManagementTab === 'assignments'} onClick={() => setActiveManagementTab('assignments')} icon={<ClipboardList className="w-4 h-4 ml-2" />} label="توزيع الأنصبة" />
              <SubNavButton active={activeManagementTab === 'courses'} onClick={() => setActiveManagementTab('courses')} icon={<Book className="w-4 h-4 ml-2" />} label="إدارة المقررات" />
              <SubNavButton active={activeManagementTab === 'staff'} onClick={() => setActiveManagementTab('staff')} icon={<Users className="w-4 h-4 ml-2" />} label="إدارة الأعضاء" />
            </div>
            
            {activeManagementTab === 'staff' && <StaffManagement staffList={staffList} setStaffList={setStaffList} />}
            {activeManagementTab === 'courses' && <CourseManagement courseList={courseList} setCourseList={setCourseList} />}
            {activeManagementTab === 'assignments' && <AssignmentManagement assignmentList={assignmentList} setAssignmentList={setAssignmentList} staffList={staffList} courseList={courseList} />}
          </div>
        )}

        {activeSection === 'reports' && (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100 no-print">
              <SubNavButton active={activeReportTab === 'formC'} onClick={() => setActiveReportTab('formC')} icon={<BookOpen className="w-4 h-4 ml-2" />} label="نموذج جـ (المقررات)" />
              <SubNavButton active={activeReportTab === 'formA'} onClick={() => setActiveReportTab('formA')} icon={<FileText className="w-4 h-4 ml-2" />} label="نموذج أ (معينون)" />
              <SubNavButton active={activeReportTab === 'formB'} onClick={() => setActiveReportTab('formB')} icon={<FileText className="w-4 h-4 ml-2" />} label="نموذج ب (منتدبون)" />
            </div>

            {activeReportTab === 'formA' && <StaffTableView staffData={getComputedStaff('internal')} title="بيان بأسماء و بيانات السادة القائمون بالتدريس المعينون بالمعهد" ministryLogo={ministryLogo} instituteLogo={instituteLogo} department={selectedDepartment} academicYear={getAcademicYear()} />}
            {activeReportTab === 'formB' && <StaffTableView staffData={getComputedStaff('external')} title="بيان بأسماء و بيانات السادة القائمون بالتدريس المنتدبون من خارج المعهد" showDepartment ministryLogo={ministryLogo} instituteLogo={instituteLogo} department={selectedDepartment} academicYear={getAcademicYear()} />}
            {activeReportTab === 'formC' && <CoursePlanView coursesPlan={getComputedCourses()} ministryLogo={ministryLogo} instituteLogo={instituteLogo} department={selectedDepartment} academicYear={getAcademicYear()} />}
          </div>
        )}
      </main>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
        active 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function SubNavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        active 
          ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

// --- Dashboard ---
function DashboardView({ 
  totalInternal, 
  totalExternal, 
  totalCourses,
  selectedDepartment,
  setSelectedDepartment
}: { 
  totalInternal: number, 
  totalExternal: number, 
  totalCourses: number,
  selectedDepartment: string,
  setSelectedDepartment: (dept: string) => void
}) {
  return (
    <div className="space-y-6">
      {/* Basic Data Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="max-w-md mx-auto bg-gray-50 p-4 rounded-lg border border-gray-100">
          <h2 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
            <FileText className="w-5 h-5 ml-2" />
            البيانات الأساسية
          </h2>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">القسم / البرنامج:</label>
            <select 
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 border bg-white"
            >
              <option value="قسم العلوم الاساسية">قسم العلوم الاساسية</option>
              <option value="برنامج الهندسة المدنية">برنامج الهندسة المدنية</option>
              <option value="برنامج الهندسة المعمارية">برنامج الهندسة المعمارية</option>
              <option value="برنامج الهندسة الكهربية">برنامج الهندسة الكهربية</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard title="أعضاء هيئة التدريس (معينون)" value={totalInternal} icon={<Users className="w-8 h-8 text-blue-500" />} />
        <StatCard title="أعضاء هيئة التدريس (منتدبون)" value={totalExternal} icon={<UserCheck className="w-8 h-8 text-green-500" />} />
        <StatCard title="إجمالي المقررات" value={totalCourses} icon={<BookOpen className="w-8 h-8 text-purple-500" />} />
      </div>
      
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">مرحباً بك في نظام إدارة الخطة الدراسية</h2>
        <p className="text-gray-600 leading-relaxed">
          هذا النظام يتيح لك إدخال بيانات المقررات وأعضاء هيئة التدريس وتوزيع الساعات التدريسية عليهم.
          بمجرد إدخال البيانات في تبويبات الإدارة، سيقوم النظام تلقائياً بإنشاء النماذج والتقارير (أ، ب، جـ).
        </p>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex items-center">
      <div className="p-3 rounded-full bg-gray-50 ml-4">
        {icon}
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// --- Management Components ---
const inputClass = "mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border";
const labelClass = "block text-sm font-medium text-gray-700";

function StaffManagement({ staffList, setStaffList }: { staffList: Staff[], setStaffList: any }) {
  const [name, setName] = useState('');
  const [type, setType] = useState<StaffType>('internal');
  const [degree, setDegree] = useState<Degree>('مدرس');
  const [department, setDepartment] = useState('');

  const handleAdd = () => {
    if (!name) return;
    setStaffList([...staffList, { id: Date.now().toString(), name, type, degree, department: type === 'external' ? department : undefined }]);
    setName('');
    setDepartment('');
  };

  const handleDelete = (id: string) => {
    setStaffList(staffList.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-blue-900">إضافة عضو هيئة تدريس</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>الاسم</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="اسم العضو" />
          </div>
          <div>
            <label className={labelClass}>النوع</label>
            <select className={inputClass} value={type} onChange={e => setType(e.target.value as StaffType)}>
              <option value="internal">معين</option>
              <option value="external">منتدب</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>الدرجة العلمية</label>
            <select className={inputClass} value={degree} onChange={e => setDegree(e.target.value as Degree)}>
              <option value="أستاذ">أستاذ</option>
              <option value="أستاذ مساعد">أستاذ مساعد</option>
              <option value="مدرس">مدرس</option>
              <option value="مدرس مساعد">مدرس مساعد</option>
              <option value="معيد">معيد</option>
              <option value="مهندس حر">مهندس حر</option>
              <option value="موجة بالمعاش">موجة بالمعاش</option>
            </select>
          </div>
          {type === 'external' && (
            <div>
              <label className={labelClass}>جهة العمل</label>
              <input className={inputClass} value={department} onChange={e => setDepartment(e.target.value)} placeholder="الجامعة / المعهد" />
            </div>
          )}
        </div>
        <button onClick={handleAdd} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 ml-2" /> إضافة عضو
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">الاسم</th>
              <th className="px-4 py-3">النوع</th>
              <th className="px-4 py-3">الدرجة</th>
              <th className="px-4 py-3">جهة العمل</th>
              <th className="px-4 py-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map(staff => (
              <tr key={staff.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{staff.name}</td>
                <td className="px-4 py-3">{staff.type === 'internal' ? 'معين' : 'منتدب'}</td>
                <td className="px-4 py-3">{staff.degree}</td>
                <td className="px-4 py-3">{staff.department || '-'}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(staff.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CourseManagement({ courseList, setCourseList }: { courseList: Course[], setCourseList: any }) {
  const [name, setName] = useState('');
  const [year, setYear] = useState('');
  const [lectures, setLectures] = useState(0);
  const [exercises, setExercises] = useState(0);

  const handleAdd = () => {
    if (!name) return;
    setCourseList([...courseList, { id: Date.now().toString(), name, year, lectures, exercises }]);
    setName(''); setYear(''); setLectures(0); setExercises(0);
  };

  const handleDelete = (id: string) => {
    setCourseList(courseList.filter(c => c.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-blue-900">إضافة مقرر دراسي</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className={labelClass}>اسم المقرر</label>
            <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="مثال: رياضيات هندسية" />
          </div>
          <div>
            <label className={labelClass}>الفرقة</label>
            <input className={inputClass} value={year} onChange={e => setYear(e.target.value)} placeholder="مثال: الإعدادية" />
          </div>
          <div>
            <label className={labelClass}>ساعات المحاضرة (لائحة)</label>
            <input type="number" className={inputClass} value={lectures} onChange={e => setLectures(Number(e.target.value))} />
          </div>
          <div>
            <label className={labelClass}>ساعات التمارين (لائحة)</label>
            <input type="number" className={inputClass} value={exercises} onChange={e => setExercises(Number(e.target.value))} />
          </div>
        </div>
        <button onClick={handleAdd} className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 ml-2" /> إضافة مقرر
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">المقرر</th>
              <th className="px-4 py-3">الفرقة</th>
              <th className="px-4 py-3 text-center">محاضرات</th>
              <th className="px-4 py-3 text-center">تمارين</th>
              <th className="px-4 py-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {courseList.map(course => (
              <tr key={course.id} className="border-b border-gray-100">
                <td className="px-4 py-3 font-medium">{course.name}</td>
                <td className="px-4 py-3">{course.year}</td>
                <td className="px-4 py-3 text-center">{course.lectures}</td>
                <td className="px-4 py-3 text-center">{course.exercises}</td>
                <td className="px-4 py-3 text-center">
                  <button onClick={() => handleDelete(course.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AssignmentManagement({ assignmentList, setAssignmentList, staffList, courseList }: { assignmentList: Assignment[], setAssignmentList: any, staffList: Staff[], courseList: Course[] }) {
  const [staffId, setStaffId] = useState('');
  const [courseId, setCourseId] = useState('');
  
  const [theory, setTheory] = useState(0);
  const [exercise, setExercise] = useState(0);
  const [supervision, setSupervision] = useState(0);
  
  const [bonusTheory, setBonusTheory] = useState(0);
  const [bonusExercise, setBonusExercise] = useState(0);
  const [bonusSupervision, setBonusSupervision] = useState(0);

  const handleAdd = () => {
    if (!staffId || !courseId) return;
    setAssignmentList([...assignmentList, { 
      id: Date.now().toString(), staffId, courseId, 
      theory, exercise, supervision, 
      bonusTheory, bonusExercise, bonusSupervision 
    }]);
    // Reset hours
    setTheory(0); setExercise(0); setSupervision(0);
    setBonusTheory(0); setBonusExercise(0); setBonusSupervision(0);
  };

  const handleDelete = (id: string) => {
    setAssignmentList(assignmentList.filter(a => a.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-bold mb-4 text-blue-900">توزيع الساعات التدريسية</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>عضو هيئة التدريس</label>
            <select className={inputClass} value={staffId} onChange={e => setStaffId(e.target.value)}>
              <option value="">-- اختر العضو --</option>
              {staffList.map(s => <option key={s.id} value={s.id}>{s.name} ({s.degree})</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>المقرر الدراسي</label>
            <select className={inputClass} value={courseId} onChange={e => setCourseId(e.target.value)}>
              <option value="">-- اختر المقرر --</option>
              {courseList.map(c => <option key={c.id} value={c.id}>{c.name} - {c.year}</option>)}
            </select>
          </div>
        </div>

        <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <h4 className="font-bold text-gray-700 mb-3">ساعات النصاب</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>نظري</label><input type="number" className={inputClass} value={theory} onChange={e => setTheory(Number(e.target.value))} /></div>
            <div><label className={labelClass}>درس</label><input type="number" className={inputClass} value={exercise} onChange={e => setExercise(Number(e.target.value))} /></div>
            <div><label className={labelClass}>اشراف</label><input type="number" className={inputClass} value={supervision} onChange={e => setSupervision(Number(e.target.value))} /></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg mb-4 border border-green-100">
          <h4 className="font-bold text-green-800 mb-3">ساعات بمكافأة</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div><label className={labelClass}>نظري</label><input type="number" className={inputClass} value={bonusTheory} onChange={e => setBonusTheory(Number(e.target.value))} /></div>
            <div><label className={labelClass}>درس</label><input type="number" className={inputClass} value={bonusExercise} onChange={e => setBonusExercise(Number(e.target.value))} /></div>
            <div><label className={labelClass}>اشراف</label><input type="number" className={inputClass} value={bonusSupervision} onChange={e => setBonusSupervision(Number(e.target.value))} /></div>
          </div>
        </div>

        <button onClick={handleAdd} className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center">
          <Plus className="w-4 h-4 ml-2" /> إضافة التوزيع
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <table className="w-full text-sm text-right">
          <thead className="bg-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3">العضو</th>
              <th className="px-4 py-3">المقرر</th>
              <th className="px-4 py-3 text-center">إجمالي النصاب</th>
              <th className="px-4 py-3 text-center">إجمالي المكافأة</th>
              <th className="px-4 py-3 text-center">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {assignmentList.map(assignment => {
              const staff = staffList.find(s => s.id === assignment.staffId);
              const course = courseList.find(c => c.id === assignment.courseId);
              const totalNisab = assignment.theory + assignment.exercise + assignment.supervision;
              const totalBonus = assignment.bonusTheory + assignment.bonusExercise + assignment.bonusSupervision;
              
              return (
                <tr key={assignment.id} className="border-b border-gray-100">
                  <td className="px-4 py-3 font-medium">{staff?.name || 'محذوف'}</td>
                  <td className="px-4 py-3">{course?.name || 'محذوف'}</td>
                  <td className="px-4 py-3 text-center">{totalNisab}</td>
                  <td className="px-4 py-3 text-center">{totalBonus}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => handleDelete(assignment.id)} className="text-red-500 hover:text-red-700">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --- Report Views ---
function PrintHeader({ title, ministryLogo, instituteLogo, department, academicYear }: { title: string, ministryLogo?: string, instituteLogo?: string, department?: string, academicYear?: string }) {
  return (
    <table className="header-table" style={{ width: '100%', marginBottom: '20px', borderBottom: '4px solid black', paddingBottom: '15px', borderCollapse: 'collapse', border: 'none' }}>
      <tbody>
        <tr>
          {/* Right Logo (Ministry) */}
          <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
            {ministryLogo ? (
              <img 
                src={ministryLogo}
                alt="وزارة التعليم العالي والبحث العلمي" 
                width={90}
                height={90}
                style={{ width: '90px', height: '90px', margin: '0 auto', marginBottom: '12px' }}
                className="mx-auto mb-3 object-contain" 
              />
            ) : (
              <div style={{ width: '90px', height: '90px', margin: '0 auto', marginBottom: '12px' }}></div>
            )}
            <p className="text-xl font-bold text-black leading-none" style={{ margin: 0 }}>وزارة التعليم العالي<br/>والبحث العلمي</p>
          </td>

          {/* Center Text */}
          <td style={{ width: '50%', textAlign: 'center', verticalAlign: 'middle', border: 'none', padding: 0 }}>
            <h1 className="text-4xl font-bold text-black mb-4 leading-none" style={{ margin: '0 0 15px 0' }}>{title}</h1>
            <p className="text-2xl font-bold text-black leading-none" style={{ margin: '0 0 10px 0' }}>المعهد العالي للهندسة والتكنولوجيا بكفر الشيخ</p>
            {department && <p className="text-xl font-bold text-black leading-none" style={{ margin: '0 0 10px 0' }}>{department}</p>}
            {academicYear && <p className="text-xl font-bold text-black leading-none" style={{ margin: 0 }}>العام الدراسي {academicYear}</p>}
          </td>

          {/* Left Logo (Institute) */}
          <td style={{ width: '25%', textAlign: 'center', verticalAlign: 'top', border: 'none', padding: 0 }}>
            {instituteLogo ? (
              <img 
                src={instituteLogo}
                alt="المعهد العالي للهندسة والتكنولوجيا بكفر الشيخ" 
                width={90}
                height={90}
                style={{ width: '90px', height: '90px', margin: '0 auto', marginBottom: '12px' }}
                className="mx-auto mb-3 object-contain" 
              />
            ) : (
              <div style={{ width: '90px', height: '90px', margin: '0 auto', marginBottom: '12px' }}></div>
            )}
            <p className="text-xl font-bold text-black leading-none" style={{ margin: 0 }}>المعهد العالي للهندسة<br/>والتكنولوجيا بكفر الشيخ</p>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

const PrintableReport = ({ children, orientation = 'landscape' }: { children: React.ReactNode, orientation?: 'portrait' | 'landscape' }) => {
  return (
    <div style={{ width: '100%', padding: '20px', backgroundColor: 'white', direction: 'rtl' }}>
      {children}
    </div>
  );
};

const exportToPDF = (content: React.ReactNode, filename: string, orientation: 'portrait' | 'landscape' = 'landscape') => {
  // Show loading overlay
  const loadingOverlay = document.createElement('div');
  loadingOverlay.style.position = 'fixed';
  loadingOverlay.style.top = '0';
  loadingOverlay.style.left = '0';
  loadingOverlay.style.width = '100vw';
  loadingOverlay.style.height = '100vh';
  loadingOverlay.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.flexDirection = 'column';
  loadingOverlay.style.justifyContent = 'center';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.zIndex = '9999';
  loadingOverlay.innerHTML = `
    <div style="width: 50px; height: 50px; border: 5px solid #f3f3f3; border-top: 5px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite;"></div>
    <p style="margin-top: 20px; font-family: sans-serif; font-weight: bold; color: #333; font-size: 18px;">جاري تجهيز ملف PDF...</p>
    <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
  `;
  document.body.appendChild(loadingOverlay);

  // Create a container for rendering
  const printContainer = document.createElement('div');
  printContainer.id = 'pdf-render-container';
  printContainer.dir = 'rtl';
  printContainer.style.position = 'absolute';
  printContainer.style.left = '0';
  printContainer.style.top = '0';
  printContainer.style.zIndex = '1000'; // Behind loading overlay (9999) but on screen
  printContainer.style.width = orientation === 'landscape' ? '1123px' : '794px';
  printContainer.style.backgroundColor = '#ffffff';
  document.body.appendChild(printContainer);

  const root = createRoot(printContainer);
  root.render(
    <PrintableReport orientation={orientation}>
      {content}
    </PrintableReport>
  );

  // Wait for render and images
  setTimeout(async () => {
    try {
      // Wait for images to load with a timeout
      const images = Array.from(printContainer.getElementsByTagName('img'));
      await Promise.race([
        Promise.all(images.map(img => {
          if (img.complete) return Promise.resolve();
          return new Promise(resolve => {
            img.onload = resolve;
            img.onerror = resolve;
          });
        })),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]);

      // Generate image using html-to-image with a timeout
      const dataUrl = await Promise.race([
        toPng(printContainer, {
          quality: 1,
          pixelRatio: 2,
          backgroundColor: '#ffffff',
          width: printContainer.scrollWidth,
          height: printContainer.scrollHeight,
          imagePlaceholder: 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', // Prevent image fetching CORS errors
          style: {
            transform: 'scale(1)',
            transformOrigin: 'top left'
          }
        }),
        new Promise<string>((_, reject) => setTimeout(() => reject(new Error('PDF generation timed out. The images might be taking too long to load.')), 10000))
      ]);

      // Create PDF
      const pdf = new jsPDF({
        orientation: orientation,
        unit: 'mm',
        format: 'a4'
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Calculate image dimensions in PDF units
      const imgProps = pdf.getImageProperties(dataUrl);
      const imgHeightInPdf = (imgProps.height * pdfWidth) / imgProps.width;
      
      let heightLeft = imgHeightInPdf;
      let position = 0;
      
      // Add first page
      pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
      heightLeft -= pdfHeight;
      
      // Add subsequent pages if needed
      while (heightLeft > 0) {
        position = heightLeft - imgHeightInPdf;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, pdfWidth, imgHeightInPdf);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${filename}.pdf`);
      
      // Cleanup
      root.unmount();
      if (document.body.contains(printContainer)) {
        document.body.removeChild(printContainer);
      }
      if (document.body.contains(loadingOverlay)) {
        document.body.removeChild(loadingOverlay);
      }
    } catch (err: any) {
      console.error('PDF Error:', err);
      if (document.body.contains(loadingOverlay)) {
        loadingOverlay.innerHTML = `
          <div style="color: #e74c3c; margin-bottom: 15px;">
            <svg width="50" height="50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"></circle>
              <line x1="12" y1="8" x2="12" y2="12"></line>
              <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
          </div>
          <p style="font-family: sans-serif; font-weight: bold; color: #333; font-size: 18px; text-align: center; direction: rtl;">
            حدث خطأ أثناء إنشاء ملف PDF<br/>
            <span style="font-size: 14px; color: #666; font-weight: normal;">${err.message || err}</span>
          </p>
          <button id="close-error-btn" style="margin-top: 20px; padding: 8px 16px; background-color: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; font-family: sans-serif;">إغلاق</button>
        `;
        const closeBtn = document.getElementById('close-error-btn');
        if (closeBtn) {
          closeBtn.onclick = () => {
            root.unmount();
            if (document.body.contains(printContainer)) document.body.removeChild(printContainer);
            if (document.body.contains(loadingOverlay)) document.body.removeChild(loadingOverlay);
          };
        }
      }
    }
  }, 1000); // Give React time to render
};

const exportToWord = async (content: React.ReactNode, filename: string) => {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(
    <div dir="rtl">
      {content}
    </div>
  );

  // Wait for React to render
  await new Promise(resolve => setTimeout(resolve, 500));

  // Convert all images to Base64
  const images = container.querySelectorAll('img');
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    try {
      const response = await fetch(img.src);
      const blob = await response.blob();
      const reader = new FileReader();
      const base64Url = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
      img.src = base64Url;
    } catch (e) {
      console.error('Failed to convert image to base64', e);
    }
  }

  const html = container.innerHTML;
  const sourceHTML = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset='utf-8'>
      <title>${filename}</title>
      <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; direction: rtl; font-size: 12pt; line-height: 1; }
        table { border-collapse: collapse; width: 100%; margin-top: 10px; }
        th, td { border: 1px solid #000000; padding: 2px 4px; text-align: center; vertical-align: middle; font-size: 12pt; font-weight: bold; color: #000000; line-height: 1; }
        th { background-color: #e5e7eb; font-size: 14pt; }
        table.header-table { border: none !important; margin-top: 0; margin-bottom: 10px; border-bottom: 2px solid black !important; }
        table.header-table td { border: none !important; padding: 0; }
        .print-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        .text-center { text-align: center; }
        .font-bold { font-weight: bold; }
        .leading-tight { line-height: 1; }
        .leading-none { line-height: 1; }
        .text-4xl { font-size: 24pt; font-weight: bold; color: #000000; }
        .text-3xl { font-size: 20pt; font-weight: bold; color: #000000; }
        .text-2xl { font-size: 16pt; font-weight: bold; color: #000000; }
        .text-xl { font-size: 14pt; font-weight: bold; color: #000000; }
        .text-lg { font-size: 12pt; font-weight: bold; color: #000000; }
        .text-base { font-size: 11pt; font-weight: bold; color: #000000; }
        .text-sm { font-size: 10pt; font-weight: bold; color: #000000; }
        .text-xs { font-size: 9pt; font-weight: bold; color: #000000; }
        .mb-2 { margin-bottom: 5px; }
        .mb-3 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 10px; }
        img { width: 70px; height: 70px; }
      </style>
    </head><body>${html}</body></html>
  `;

  try {
    const blob = await asBlob(sourceHTML, { orientation: 'landscape' });
    const url = URL.createObjectURL(blob as Blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.docx`;
    document.body.appendChild(link);
    link.click();
    
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  } catch (error) {
    console.error('Failed to generate DOCX', error);
    root.unmount();
    document.body.removeChild(container);
  }
};

function StaffTableView({ staffData, title, showDepartment = false, ministryLogo, instituteLogo, department, academicYear }: { staffData: any[], title: string, showDepartment?: boolean, ministryLogo?: string, instituteLogo?: string, department?: string, academicYear?: string }) {
  if (staffData.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        لا توجد بيانات لعرضها في هذا التقرير. يرجى إضافة أعضاء وتوزيع أنصبة عليهم.
      </div>
    );
  }

  const reportContent = (
    <div className="bg-white p-4" dir="rtl">
      <PrintHeader title={title} ministryLogo={ministryLogo} instituteLogo={instituteLogo} department={department} academicYear={academicYear} />
      <table className="w-full text-xl font-bold text-black text-center border-collapse border-2 border-black leading-none">
        <thead className="text-2xl text-black uppercase bg-gray-200 border-b-2 border-black">
          <tr>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black w-12 text-center">م</th>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black">الأسم</th>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black">الدرجة العلمية</th>
            {showDepartment && <th rowSpan={2} className="px-4 py-1 border-2 border-black">جهة العمل</th>}
            <th rowSpan={2} className="px-4 py-1 border-2 border-black">المواد التي يقوم بتدريسها</th>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black">الفرقة</th>
            <th colSpan={3} className="px-4 py-1 border-2 border-black text-center bg-blue-100">ساعات النصاب</th>
            <th colSpan={3} className="px-4 py-1 border-2 border-black text-center bg-green-100">ساعات بمكافأة</th>
            <th rowSpan={2} className="px-4 py-1 text-center font-bold border-2 border-black">جملة</th>
          </tr>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border-2 border-black text-center">نظري</th>
            <th className="px-2 py-1 border-2 border-black text-center">درس</th>
            <th className="px-2 py-1 border-2 border-black text-center">اشراف</th>
            <th className="px-2 py-1 border-2 border-black text-center">نظري</th>
            <th className="px-2 py-1 border-2 border-black text-center">درس</th>
            <th className="px-2 py-1 border-2 border-black text-center">اشراف</th>
          </tr>
        </thead>
        <tbody>
          {staffData.map((staff, index) => {
            const rowSpan = staff.assignments.length;
            let totalStaffHours = 0;
            
            return staff.assignments.map((assignment: any, aIndex: number) => {
              const rowTotal = assignment.theory + assignment.exercise + assignment.supervision +
                               assignment.bonusTheory + assignment.bonusExercise + assignment.bonusSupervision;
              totalStaffHours += rowTotal;

              return (
                <tr key={`${staff.id}-${aIndex}`} className="border-b-2 border-black hover:bg-gray-50 transition-colors">
                  {aIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black text-center font-bold">{index + 1}</td>
                      <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black font-bold text-black">{staff.name}</td>
                      <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black font-bold">{staff.degree}</td>
                      {showDepartment && <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black font-bold">{staff.department}</td>}
                    </>
                  )}
                  <td className="px-4 py-1 border-2 border-black font-bold">{assignment.course}</td>
                  <td className="px-4 py-1 border-2 border-black font-bold text-black">{assignment.year}</td>
                  
                  <td className="px-2 py-1 border-2 border-black text-center font-bold">{assignment.theory || '-'}</td>
                  <td className="px-2 py-1 border-2 border-black text-center font-bold">{assignment.exercise || '-'}</td>
                  <td className="px-2 py-1 border-2 border-black text-center font-bold">{assignment.supervision || '-'}</td>
                  
                  <td className="px-2 py-1 border-2 border-black text-center font-bold bg-green-50">{assignment.bonusTheory || '-'}</td>
                  <td className="px-2 py-1 border-2 border-black text-center font-bold bg-green-50">{assignment.bonusExercise || '-'}</td>
                  <td className="px-2 py-1 border-2 border-black text-center font-bold bg-green-50">{assignment.bonusSupervision || '-'}</td>
                  
                  {aIndex === 0 && (
                    <td rowSpan={rowSpan} className="px-4 py-1 text-center font-bold text-black bg-blue-100 border-2 border-black text-2xl">
                      {staff.assignments.reduce((acc: number, curr: any) => acc + curr.theory + curr.exercise + curr.supervision + curr.bonusTheory + curr.bonusExercise + curr.bonusSupervision, 0)}
                    </td>
                  )}
                </tr>
              );
            });
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center no-print">
        <h2 className="text-lg font-bold text-blue-900">{title}</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToWord(reportContent, title)}
            className="flex items-center px-3 py-1.5 bg-white border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <FileText className="w-4 h-4 ml-2" />
            تصدير Word
          </button>
          <button 
            onClick={() => exportToPDF(reportContent, title, 'landscape')}
            className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 ml-2" />
            طباعة PDF
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto table-container p-6">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200 w-12 text-center">م</th>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">الأسم</th>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">الدرجة العلمية</th>
              {showDepartment && <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">جهة العمل</th>}
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">المواد التي يقوم بتدريسها</th>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">الفرقة</th>
              <th colSpan={3} className="px-4 py-2 border-l border-gray-200 text-center bg-blue-50">ساعات النصاب</th>
              <th colSpan={3} className="px-4 py-2 border-l border-gray-200 text-center bg-green-50">ساعات بمكافأة</th>
              <th rowSpan={2} className="px-4 py-3 text-center font-bold">جملة</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">نظري</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">درس</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">اشراف</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">نظري</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">درس</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">اشراف</th>
            </tr>
          </thead>
          <tbody>
            {staffData.map((staff, index) => {
              const rowSpan = staff.assignments.length;
              let totalStaffHours = 0;
              
              return staff.assignments.map((assignment: any, aIndex: number) => {
                const rowTotal = assignment.theory + assignment.exercise + assignment.supervision +
                                 assignment.bonusTheory + assignment.bonusExercise + assignment.bonusSupervision;
                totalStaffHours += rowTotal;

                return (
                  <tr key={`${staff.id}-${aIndex}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                    {aIndex === 0 && (
                      <>
                        <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200 text-center font-medium">{index + 1}</td>
                        <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200 font-bold text-gray-900">{staff.name}</td>
                        <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200">{staff.degree}</td>
                        {showDepartment && <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200">{staff.department}</td>}
                      </>
                    )}
                    <td className="px-4 py-3 border-l border-gray-200">{assignment.course}</td>
                    <td className="px-4 py-3 border-l border-gray-200 text-gray-600">{assignment.year}</td>
                    
                    <td className="px-2 py-3 border-l border-gray-200 text-center">{assignment.theory || '-'}</td>
                    <td className="px-2 py-3 border-l border-gray-200 text-center">{assignment.exercise || '-'}</td>
                    <td className="px-2 py-3 border-l border-gray-200 text-center">{assignment.supervision || '-'}</td>
                    
                    <td className="px-2 py-3 border-l border-gray-200 text-center bg-green-50/30">{assignment.bonusTheory || '-'}</td>
                    <td className="px-2 py-3 border-l border-gray-200 text-center bg-green-50/30">{assignment.bonusExercise || '-'}</td>
                    <td className="px-2 py-3 border-l border-gray-200 text-center bg-green-50/30">{assignment.bonusSupervision || '-'}</td>
                    
                    {aIndex === 0 && (
                      <td rowSpan={rowSpan} className="px-4 py-3 text-center font-bold text-blue-700 bg-blue-50/30">
                        {staff.assignments.reduce((acc: number, curr: any) => acc + curr.theory + curr.exercise + curr.supervision + curr.bonusTheory + curr.bonusExercise + curr.bonusSupervision, 0)}
                      </td>
                    )}
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CoursePlanView({ coursesPlan, ministryLogo, instituteLogo, department, academicYear }: { coursesPlan: any[], ministryLogo?: string, instituteLogo?: string, department?: string, academicYear?: string }) {
  if (coursesPlan.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center text-gray-500">
        لا توجد بيانات لعرضها في هذا التقرير. يرجى إضافة مقررات وتوزيع أنصبة عليها.
      </div>
    );
  }

  const reportContent = (
    <div className="bg-white p-4" dir="rtl">
      <PrintHeader title="بيان بتوزيع ساعات الخطة الدراسية (نموذج جـ)" ministryLogo={ministryLogo} instituteLogo={instituteLogo} department={department} academicYear={academicYear} />
      <table className="w-full text-xl font-bold text-black text-center border-collapse border-2 border-black leading-none">
        <thead className="text-2xl text-black uppercase bg-gray-200 border-b-2 border-black">
          <tr>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black">المادة</th>
            <th colSpan={2} className="px-4 py-1 border-2 border-black text-center bg-gray-300">الساعات الدراسية اللائحة</th>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black text-center">القائمون بالتدريس</th>
            <th rowSpan={2} className="px-4 py-1 border-2 border-black text-center">الدرجة</th>
            <th colSpan={2} className="px-4 py-1 border-2 border-black text-center bg-blue-100">توزيع الساعات الدراسية</th>
            <th rowSpan={2} className="px-4 py-1 text-center border-2 border-black">إجمالي المادة</th>
          </tr>
          <tr className="bg-gray-100">
            <th className="px-2 py-1 border-2 border-black text-center">محاضرة</th>
            <th className="px-2 py-1 border-2 border-black text-center">درس</th>
            <th className="px-2 py-1 border-2 border-black text-center">محاضرة</th>
            <th className="px-2 py-1 border-2 border-black text-center">درس</th>
          </tr>
        </thead>
        <tbody>
          {coursesPlan.map((course, cIndex) => {
            const rowSpan = course.staff.length;
            const totalCourseHours = course.staff.reduce((acc: number, curr: any) => acc + curr.theory + curr.exercise, 0);
            
            return course.staff.map((staff: any, sIndex: number) => (
              <tr key={`${cIndex}-${sIndex}`} className="border-b-2 border-black hover:bg-gray-50 transition-colors">
                {sIndex === 0 && (
                  <>
                    <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black font-bold text-black">{course.name}</td>
                    <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black text-center font-bold bg-gray-100">{course.lectures}</td>
                    <td rowSpan={rowSpan} className="px-4 py-1 border-2 border-black text-center font-bold bg-gray-100">{course.exercises}</td>
                  </>
                )}
                
                <td className="px-4 py-1 border-2 border-black font-bold">{staff.name}</td>
                <td className="px-4 py-1 border-2 border-black font-bold text-black">{staff.degree}</td>
                
                <td className="px-2 py-1 border-2 border-black text-center font-bold">{staff.theory || '-'}</td>
                <td className="px-2 py-1 border-2 border-black text-center font-bold">{staff.exercise || '-'}</td>
                
                {sIndex === 0 && (
                  <td rowSpan={rowSpan} className="px-4 py-1 text-center font-bold text-black bg-yellow-100 border-2 border-black text-2xl">
                    {totalCourseHours}
                  </td>
                )}
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center no-print">
        <h2 className="text-lg font-bold text-blue-900">بيان بتوزيع ساعات الخطة الدراسية (نموذج جـ)</h2>
        <div className="flex gap-3">
          <button 
            onClick={() => exportToWord(reportContent, 'نموذج جـ')}
            className="flex items-center px-3 py-1.5 bg-white border border-blue-300 rounded-md shadow-sm text-sm font-medium text-blue-700 hover:bg-blue-50"
          >
            <FileText className="w-4 h-4 ml-2" />
            تصدير Word
          </button>
          <button 
            onClick={() => exportToPDF(reportContent, 'نموذج جـ', 'landscape')}
            className="flex items-center px-3 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Printer className="w-4 h-4 ml-2" />
            طباعة PDF
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto table-container p-6">
        <table className="w-full text-sm text-right">
          <thead className="text-xs text-gray-700 uppercase bg-gray-100 border-b border-gray-200">
            <tr>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200">المادة</th>
              <th colSpan={2} className="px-4 py-2 border-l border-gray-200 text-center bg-gray-200">الساعات الدراسية اللائحة</th>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200 text-center">القائمون بالتدريس</th>
              <th rowSpan={2} className="px-4 py-3 border-l border-gray-200 text-center">الدرجة</th>
              <th colSpan={2} className="px-4 py-2 border-l border-gray-200 text-center bg-blue-50">توزيع الساعات الدراسية</th>
              <th rowSpan={2} className="px-4 py-3 text-center">إجمالي المادة</th>
            </tr>
            <tr className="bg-gray-50">
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">محاضرة</th>
              <th className="px-2 py-2 border-l border-t border-gray-200 text-center">درس</th>
            </tr>
          </thead>
          <tbody>
            {coursesPlan.map((course, cIndex) => {
              const rowSpan = course.staff.length;
              const totalCourseHours = course.staff.reduce((acc: number, curr: any) => acc + curr.theory + curr.exercise, 0);
              
              return course.staff.map((staff: any, sIndex: number) => (
                <tr key={`${cIndex}-${sIndex}`} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                  {sIndex === 0 && (
                    <>
                      <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200 font-bold text-gray-900">{course.name}</td>
                      <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200 text-center font-medium bg-gray-50/50">{course.lectures}</td>
                      <td rowSpan={rowSpan} className="px-4 py-3 border-l border-gray-200 text-center font-medium bg-gray-50/50">{course.exercises}</td>
                    </>
                  )}
                  
                  <td className="px-4 py-3 border-l border-gray-200">{staff.name}</td>
                  <td className="px-4 py-3 border-l border-gray-200 text-gray-600">{staff.degree}</td>
                  
                  <td className="px-2 py-3 border-l border-gray-200 text-center">{staff.theory || '-'}</td>
                  <td className="px-2 py-3 border-l border-gray-200 text-center">{staff.exercise || '-'}</td>
                  
                  {sIndex === 0 && (
                    <td rowSpan={rowSpan} className="px-4 py-3 text-center font-bold text-blue-700 bg-yellow-50">
                      {totalCourseHours}
                    </td>
                  )}
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
