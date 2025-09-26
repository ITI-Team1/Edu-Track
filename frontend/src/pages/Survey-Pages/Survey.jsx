import React, { useEffect, useMemo, useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { surveyApi } from "./surveyApi";
import { getLecture } from "../../services/lectureApi";
import { fetchCourses } from "../../services/courseApi";
import { fetchFaculties } from "../../services/facultyApi";
import { fetchPrograms } from "../../services/programApi";
import { useAuth } from "../../context/AuthContext";
import toast from "../../utils/toast";
import { AttendanceAPI } from "../../services/attendanceApi";

// Questions are loaded from backend using surveyApi.listQuestions()

// Rating mapping to backend Arabic choices
const RATING_MAP = { 5: "ممتاز", 4: "جيد جدا", 3: "جيد", 2: "مقبول", 1: "ضعيف" };

// Dynamic validation schema built from fetched questions
const buildValidationSchema = (len) =>
  Yup.object({
    questions: Yup.array()
      .of(Yup.object({ id: Yup.number().required(), score: Yup.string().required("يرجى اختيار تقييم") }))
      .min(len),
    improvement: Yup.string().nullable(),
    otherSuggestions: Yup.string().nullable(),
  });

export default function SurveyForm() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [lecture, setLecture] = useState(null);
  const [course, setCourse] = useState(null);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [eligible, setEligible] = useState(true);

  const lectureId = useMemo(() => {
    const sp = new URLSearchParams(window.location.search);
    const id = sp.get('lectureId');
    return id ? Number(id) : null;
  }, []);

  // Helper functions for names
  const getFacultyName = (facultyId) => {
    if (!facultyId) return 'غير محدد';
    const faculty = faculties.find(f => f.id === facultyId);
    return faculty ? faculty.name : `ID: ${facultyId}`;
  };

  const getProgramName = (programId) => {
    if (!programId) return 'غير محدد';
    const program = programs.find(p => p.id === programId);
    return program ? program.name : `ID: ${programId}`;
  };

  const getInstructorNames = (lecture) => {
    if (!lecture) return 'غير محدد';
    // Prefer server-provided instructor_details (from LectureSerializer)
    const details = Array.isArray(lecture.instructor_details) ? lecture.instructor_details : [];
    let names = details
      .map(d => `${d.first_name || ''} ${d.last_name || ''}`.trim())
      .filter(Boolean);
    if (names.length === 0) {
      // Fallback to instructor IDs
      const ids = Array.isArray(lecture.instructor)
        ? lecture.instructor.map(ins => (typeof ins === 'object' ? ins.id : ins))
        : (lecture.instructor ? [ (typeof lecture.instructor === 'object' ? lecture.instructor.id : lecture.instructor) ] : []);
      names = ids.map(id => `المحاضر ${id}`).filter(Boolean);
    }
    return names.join('، ') || 'غير محدد';
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Load all required data in parallel
        const [qs, lec, coursesData, facultiesData, programsData] = await Promise.all([
          surveyApi.listQuestions().catch((e) => {
            console.error('Error loading questions:', e);
            return [];
          }),
          lectureId ? getLecture(lectureId).catch((e) => {
            console.error('Error loading lecture:', e);
            return null;
          }) : Promise.resolve(null),
          fetchCourses().catch((e) => {
            console.error('Error loading courses:', e);
            return [];
          }),
          fetchFaculties().catch((e) => {
            console.error('Error loading faculties:', e);
            return [];
          }),
          fetchPrograms().catch((e) => {
            console.error('Error loading programs:', e);
            return [];
          })
        ]);
        const normalizedQs = Array.isArray(qs) ? qs : [];
        setQuestions(normalizedQs);
        setLecture(lec);
        setFaculties(Array.isArray(facultiesData) ? facultiesData : (facultiesData?.results || []));
        setPrograms(Array.isArray(programsData) ? programsData : (programsData?.results || []));
        
        // Find the course for this lecture
        if (lec && lec.course) {
          const courseId = typeof lec.course === 'object' ? lec.course.id : lec.course;
          const foundCourse = (Array.isArray(coursesData) ? coursesData : (coursesData?.results || []))
            .find(c => c.id === courseId);
          setCourse(foundCourse);
        }
        
      } catch (e) {
        console.error('Error loading survey data:', e);
        setError('فشل تحميل بيانات الاستبيان');
      } finally {
        setLoading(false);
      }
    };
    
    if (lectureId) {
      load();
    } else {
      setError('معرف المحاضرة غير صحيح');
      setLoading(false);
    }
  }, [lectureId, user]);

  // Eligibility guard: require positive marks for the current student on this lecture's course
  useEffect(() => {
    const verifyEligibility = async () => {
      try {
        if (!user?.id || !lectureId) return;
        const marks = await AttendanceAPI.getStudentMarksByStudent(user.id);
        const normalized = Array.isArray(marks) ? marks : [];
        const hasPositiveForLecture = normalized.some(m => {
          const lecIdRaw = (m && typeof m.lecture === 'object') ? m.lecture?.id : m?.lecture;
          const lecId = Number(lecIdRaw);
          const attendance = Number(m?.attendance_mark || 0);
          const instructor = Number(m?.instructor_mark || 0);
          return Number.isFinite(lecId) && lecId === Number(lectureId) && (attendance > 0 || instructor > 0);
        });
        if (!hasPositiveForLecture) {
          setEligible(false);
        } else {
          setEligible(true);
        }
      } catch (_) {
        // On error, be conservative: disallow to avoid unintended access
        setEligible(false);
      }
    };
    verifyEligibility();
  }, [user?.id, lectureId]);

  const initialValues = {
    questions: (Array.isArray(questions) ? questions : []).map(q => ({ id: q.id, score: "", comment: "" })),
    improvement: "",
    otherSuggestions: ""
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    
    try {
      if (!lectureId || !user?.id) {
        throw new Error('بيانات المستخدم أو المحاضرة غير متوفرة');
      }

      // Submit each answer separately to backend
      const payloads = (values.questions || [])
        .filter(q => q.score)
        .map(q => ({
          lecture: lectureId,
          question: q.id,
          student: user.id,
          rating: RATING_MAP[q.score],
        }));

      // Submit all answers; tolerate duplicates (unique_together) as non-fatal
      const results = await Promise.allSettled(payloads.map(p => surveyApi.createAnswer(p)));
      const successes = results.filter(r => r.status === 'fulfilled').length;
      const failures = results.filter(r => r.status === 'rejected');
      const duplicates = failures.filter(r => {
        const data = r.reason?.response?.data;
        const msg = (data?.non_field_errors?.[0]) || data?.detail || r.reason?.message || '';
        return /unique|already exists|unique set|موجود بالفعل/i.test(String(msg));
      });
      const realFailures = failures.filter(r => !duplicates.includes(r));

      if (successes > 0 && realFailures.length === 0) {
        toast.success(`تم إرسال ${successes} إجابة${duplicates.length ? ` (تم تجاهل ${duplicates.length} مكررة)` : ''}. شكراً لمشاركتك.`);
      } else if (successes > 0 && realFailures.length > 0) {
        const firstErr = realFailures[0]?.reason;
        toast.apiError(firstErr, `تم حفظ ${successes} وإخفاق ${realFailures.length}.`);
      } else if (successes === 0 && duplicates.length > 0 && realFailures.length === 0) {
        toast.info('لقد قمت بالإجابة على هذه الاستبيان مسبقاً. لم يتم حفظ إجابات جديدة.');
      } else {
        // All failed for other reasons
        const firstErr = realFailures[0]?.reason || failures[0]?.reason;
        throw firstErr || new Error('فشل إرسال الإجابات');
      }

      // Mark survey as submitted (simple client-side gate)
      try {
        localStorage.setItem('surveySubmitted', 'true');
        localStorage.setItem('surveySubmittedAt', new Date().toISOString());
      } catch (_) { /* ignore storage errors */ }

      resetForm();
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      toast.apiError(error, 'حدث خطأ في إرسال الاستمارة. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-5">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="text-center py-16 sm:py-20 px-4">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-4 border-blue-200 border-t-blue-600 mb-6"></div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">جارٍ تحميل الاستبيان</h2>
            <p className="text-sm sm:text-base text-gray-600">يرجى الانتظار بينما نقوم بتحميل البيانات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-5">
        <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="text-center py-16 sm:py-20 px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">حدث خطأ</h2>
            <p className="text-sm sm:text-base text-red-600 mb-6">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              إعادة المحاولة
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="!min-h-screen flex !items-center !justify-center !mx-auto bg-gradient-to-br from-blue-50 to-indigo-100 !p-2 sm:!p-4 lg:!p-5">
        <div className="!max-w-7xl !mx-auto bg-white rounded-xl !shadow-xl !overflow-hidden">
          <div className="text-center !py-16 sm:!py-20 !px-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 mb-3">غير مؤهل لإجراء هذا الاستبيان</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 leading-relaxed">
              لا توجد درجات مسجلة لك لهذه المحاضرة/المقرر حتى الآن. سيتم تفعيل الاستبيان بعد تسجيل درجاتك.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.history.back()}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                رجوع
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
              >
                <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                إعادة التحميل
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className=" min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-2 sm:p-4 lg:p-5 pb-24 md:pb-5">
      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="text-center py-4 sm:py-6 lg:py-8 px-4 sm:px-6">
          {/* Top info strip - Mobile optimized */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 sm:mb-6">
            <span className="px-2 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 text-gray-800 border border-blue-200 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:from-blue-100 hover:to-indigo-100" title="اسم الدكتور">
              <span className="font-semibold text-blue-700">الدكتور:</span>
              <span className="mr-1 text-gray-700 font-bold">{lecture ? getInstructorNames(lecture) : 'غير محدد'}</span>
            </span>
            <span className="px-2 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-green-50 to-emerald-50 text-gray-800 border border-green-200 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:from-green-100 hover:to-emerald-100" title="اسم المقرر">
              <span className="font-semibold text-green-700">المقرر:</span>
              <span className="mr-1 text-gray-700 font-bold">{course?.title || course?.name || lecture?.course?.title || lecture?.course?.name || 'غير محدد'}</span>
            </span> 
            <span className="px-2 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-50 to-violet-50 text-gray-800 border border-purple-200 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:from-purple-100 hover:to-violet-100 sm:hidden lg:inline" title="الكلية">
              <span className="font-semibold text-purple-700">الكلية:</span>
              <span className="mr-1 text-gray-700 font-bold">{getFacultyName(user?.faculty?.id || user?.faculty_id || user?.faculty)}</span>
            </span>
            <span className="px-2 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-orange-50 to-amber-50 text-gray-800 border border-orange-200 text-xs sm:text-sm shadow-sm hover:shadow-md transition-all duration-200 hover:from-orange-100 hover:to-amber-100 sm:hidden lg:inline" title="البرنامج">
              <span className="font-semibold text-orange-700">البرنامج:</span>
              <span className="mr-1 text-gray-700 font-bold">{getProgramName(user?.program?.id || user?.program_id || user?.program)}</span>
            </span>
          </div>
          
          {/* Title with better mobile typography */}
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold !text-gray-800 mb-4 sm:mb-6 leading-tight">
            استمارة استطلاع رأي حول مقرر دراسي
          </h1>
          
          {/* Decorative line with responsive width */}
          <div className="w-16 sm:w-24 lg:w-32 h-1 my-4 sm:my-6 bg-gradient-to-r from-blue-600 to-indigo-600 mx-auto rounded-full"></div>
        </div>
        
        {/* Toastify handles status messages globally */}

        <Formik 
          enableReinitialize
          initialValues={initialValues}
          validationSchema={buildValidationSchema((questions || []).length)}
          onSubmit={handleSubmit}
        >
          {({ errors, values }) => (
            <Form id="survey-form" className="space-y-8">
              {/* Course Information Card - Mobile Enhanced */}
              
              {/* Instructions - Mobile Enhanced */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 p-4 sm:p-6 mx-2 sm:mx-4 rounded-r-lg shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 sm:w-6 sm:h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="h-4 w-4 sm:h-5 sm:w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1 w-full">
                    <p className="text-sm sm:text-base text-blue-800 font-semibold mb-2">
                      يرجى الإجابة على الاستبيان بالطريقة الصحيحة
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1 sm:gap-2 text-xs sm:text-sm">
                      <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-center">5 = ممتاز</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-center">4 = جيد جداً</span>
                      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-center">3 = جيد</span>
                      <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-center">2 = مقبول</span>
                      <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-center sm:col-span-1 col-span-2">1 = ضعيف</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Survey Questions Table - Mobile Responsive */}
              <div className="bg-white rounded-xl shadow-lg overflow-hidden mx-2 sm:mx-4">
                {/* Progress Bar */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b border-gray-200">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-700">
                      تمت الإجابة على {((values?.questions || []).filter(q => q.score)?.length) || 0} من {(questions || []).length} أسئلة
                    </span>
                    <div className="w-full sm:w-48 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${((values?.questions || []).filter(q => q.score)?.length || 0) / (questions || []).length * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Mobile View - Cards */}
                <div className="block md:hidden p-4 space-y-6">
                  {(questions || []).map((q, index) => (
                    <div key={q.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      {/* Question Header */}
                      <div className="flex items-start gap-4 mb-5">
                        <span className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
                          {index + 1}
                        </span>
                        <p className="text-gray-800 leading-relaxed text-sm flex-1 font-medium">{q.text}</p>
                      </div>
                      
                      {/* Rating buttons - Enhanced for touch */}
                      <div className="mb-5">
                        <p className="text-xs text-gray-600 mb-3 font-medium">اختر التقييم المناسب:</p>
                        <div className="grid grid-cols-5 gap-2">
                          {[5, 4, 3, 2, 1].map(num => (
                            <label key={num} className="cursor-pointer touch-manipulation">
                              <Field
                                type="radio"
                                name={`questions[${index}].score`}
                                value={num.toString()}
                                className="sr-only"
                              />
                              <div className={`!p-3 rounded-xl text-center text-xs font-medium border-2 transition-all duration-200 transform active:scale-95 !h-[85px] flex flex-col justify-between ${
                                values?.questions?.[index]?.score === num.toString() 
                                  ? (num === 5 ? 'bg-blue-500 text-white  border-blue-500 shadow-lg' : 
                                     num === 4 ? 'bg-green-500 text-white border-green-500 shadow-lg' : 
                                     num === 3 ? 'bg-yellow-500 text-white border-yellow-500 shadow-lg' :
                                     num === 2 ? 'bg-orange-500 text-white border-orange-500 shadow-lg' :
                                     'bg-red-500 text-white border-red-500 shadow-lg')
                                  : 'bg-gray-50 text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-100 '
                              }`}>
                                <div className="font-bold text-lg mb-2">{num}</div>
                                <div className="text-xs leading-tight text-center">
                                  {num === 5 ? 'ممتاز' : 
                                   num === 4 ? 'جيد جداً' : 
                                   num === 3 ? 'جيد' : 
                                   num === 2 ? 'مقبول' : 'ضعيف'}
                                </div>
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Comments */}
                      <div>
                        <label className="block text-xs text-gray-600 mb-2 font-medium">ملاحظات إضافية (اختياري):</label>
                        <Field
                          as="textarea"
                          name={`questions[${index}].comment`}
                          rows="3"
                          className="w-full px-4 py-3 text-right text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-gray-50 focus:bg-white transition-colors duration-200"
                          placeholder="اكتب أي ملاحظات إضافية هنا..."
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop View - Table */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right">
                    <thead className="bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 sticky top-0 z-10">
                      <tr>
                        <th className="px-3 py-4 text-center font-semibold text-sm">م</th>
                        <th className="px-4 py-4 font-semibold text-sm">عناصر الاستبيان</th>
                        <th className="px-2 py-4 text-center font-semibold text-xs">5<br/><span className="text-xs text-blue-600">ممتاز</span></th>
                        <th className="px-2 py-4 text-center font-semibold text-xs">4<br/><span className="text-xs text-green-600">جيد جداً</span></th>
                        <th className="px-2 py-4 text-center font-semibold text-xs">3<br/><span className="text-xs text-yellow-600">جيد</span></th>
                        <th className="px-2 py-4 text-center font-semibold text-xs">2<br/><span className="text-xs text-orange-600">مقبول</span></th>
                        <th className="px-2 py-4 text-center font-semibold text-xs">1<br/><span className="text-xs text-red-600">ضعيف</span></th>
                        <th className="px-4 py-4 font-semibold text-sm">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {(questions || []).map((q, index) => (
                        <tr key={q.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-3 py-4 text-center font-medium text-gray-600">
                            <span className="bg-blue-100 text-blue-800 text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center mx-auto">
                              {index + 1}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-gray-800 leading-relaxed text-sm">
                            {q.text}
                          </td>
                          {[5, 4, 3, 2, 1].map(num => (
                            <td key={num} className="px-2 py-4 text-center">
                              <label className="flex items-center justify-center cursor-pointer group">
                                <Field
                                  type="radio"
                                  name={`questions[${index}].score`}
                                  value={num.toString()}
                                  className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 focus:ring-2 group-hover:bg-blue-50 transition-colors duration-200"
                                />
                              </label>
                            </td>
                          ))}
                          <td className="px-4 py-4">
                            <Field
                              as="textarea"
                              name={`questions[${index}].comment`}
                              rows="2"
                              className="w-full px-3 py-2 text-right text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                              placeholder="ملاحظات (اختياري)"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Validation errors for questions */}
                {errors.questions && (
                  <div className="px-4 py-3 bg-red-50 border-t border-red-200">
                    {errors.questions.map((questionError, index) => (
                      questionError?.score && (
                        <div key={index} className="flex items-center gap-2 text-red-600 text-sm mb-1">
                          <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          السؤال {index + 1}: {questionError.score}
                        </div>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Questions - Mobile Enhanced */}
              <div className="space-y-6 mx-2 sm:mx-4">
                {/* Improvement Suggestions */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-3 border-b border-green-200">
                    <h3 className="text-lg sm:text-xl font-semibold !text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                      </div>
                      اقتراحات التحسين والتطوير
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      في رأيك كيف يمكن تحسين أو تطوير هذا المقرر؟ 
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="improvement"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none transition-all duration-200 text-right text-sm"
                      placeholder="اكتب اقتراحاتك لتحسين المقرر..."
                    />
                    <ErrorMessage name="improvement" component="div" className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </ErrorMessage>
                  </div>
                </div>

                {/* Other Suggestions */}
                <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
                  <div className="bg-gradient-to-r from-purple-50 to-violet-50 px-4 sm:px-6 py-3 border-b border-purple-200">
                    <h3 className="text-lg sm:text-xl font-semibold !text-gray-800 flex items-center gap-2">
                      <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 flex-shrink-0 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      اقتراحات أخرى
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      اقتراحات أخرى 
                      <span className="text-red-500 font-bold">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="otherSuggestions"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all duration-200 text-right text-sm"
                      placeholder="اكتب أي اقتراحات أخرى لديك..."
                    />
                    <ErrorMessage name="otherSuggestions" component="div" className="text-red-500 text-sm mt-2 flex items-center gap-1">
                      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </ErrorMessage>
                  </div>
                </div>
              </div>

              {/* Submit Button - Mobile Enhanced */}
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 mx-2 sm:mx-4 md:relative md:border-t-0 md:p-0 md:pt-6 md:pb-8">
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="btn-main flex items-center justify-center gap-2 !py-4 !px-6"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-base">جاري الإرسال...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className=" text-base font-bold">إرسال الاستمارة</span>
                      </div>
                    )}
                  </button>
                  
                  {/* Back button for mobile */}
                  <button
                    type="button"
                    onClick={() => window.history.back()}
                    className="inline-flex items-center justify-center px-6 py-4 text-base font-medium text-gray-700 bg-white border border-gray-300 rounded-xl shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95 touch-manipulation"
                  >
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                    </svg>
                    <span className="text-base">رجوع</span>
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
