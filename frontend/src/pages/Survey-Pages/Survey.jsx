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
        setError('فشل تحميل بيانات الاستبانة');
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
        toast.info('لقد قمت بالإجابة على هذه الاستبانة مسبقاً. لم يتم حفظ إجابات جديدة.');
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
      <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !to-indigo-100 !p-5">
        <div className="!max-w-6xl p-4 !mx-auto !bg-white !rounded-lg !shadow-lg">
          <div className="!text-center !py-20">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">جارٍ تحميل الاستبانة...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !to-indigo-100 !p-5">
        <div className="!max-w-6xl p-4 !mx-auto !bg-white !rounded-lg !shadow-lg">
          <div className="!text-center !py-20">
            <div className="text-red-600 text-xl mb-4">⚠️</div>
            <p className="text-red-600 text-lg">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!eligible) {
    return (
      <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !to-indigo-100 !p-5">
        <div className="!max-w-6xl p-6 !mx-auto !bg-white !rounded-lg !shadow-lg text-center">
          <div className="text-red-600 text-2xl mb-3">⚠️</div>
          <h2 className="text-xl font-bold mb-2">غير مؤهل لإجراء هذا الاستبيان</h2>
          <p className="text-gray-600 mb-4">لا توجد درجات مسجلة لك لهذه المحاضرة/المقرر حتى الآن. سيتم تفعيل الاستبيان بعد تسجيل درجاتك.</p>
          <button className="btn btn-primary" onClick={() => window.history.back()}>رجوع</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !to-indigo-100  !p-5">
      <div className="!max-w-6xl p-4 !mx-auto !bg-white !rounded-lg !shadow-lg">
        {/* Header */}
        <div className="!text-center !py-5 ">
          {/* Top info strip (before the title) */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-3">
            <span className="px-3 py-1 rounded-full bg-white text-gray-800 border border-gray-200 text-sm shadow-sm hover:shadow transition-colors duration-150 hover:bg-gray-50" title="اسم الدكتور">
              <span className="font-semibold">الدكتور:</span>
              <span className="mr-1">{lecture ? getInstructorNames(lecture) : 'غير محدد'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white text-gray-800 border border-gray-200 text-sm shadow-sm hover:shadow transition-colors duration-150 hover:bg-gray-50" title="اسم المقرر">
              <span className="font-semibold">المقرر:</span>
              <span className="mr-1">{course?.title || course?.name || lecture?.course?.title || lecture?.course?.name || 'غير محدد'}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white text-gray-800 border border-gray-200 text-sm hidden md:inline shadow-sm hover:shadow transition-colors duration-150 hover:bg-gray-50" title="الكلية">
              <span className="font-semibold">الكلية:</span>
              <span className="mr-1">{getFacultyName(user?.faculty?.id || user?.faculty_id || user?.faculty)}</span>
            </span>
            <span className="px-3 py-1 rounded-full bg-white text-gray-800 border border-gray-200 text-sm hidden md:inline shadow-sm hover:shadow transition-colors duration-150 hover:bg-gray-50" title="البرنامج">
              <span className="font-semibold">البرنامج:</span>
              <span className="mr-1">{getProgramName(user?.program?.id || user?.program_id || user?.program)}</span>
            </span>
          </div>
          <h1 className="!text-2xl !font-bold !text-gray-800 mb-4">
            استمارة استطلاع رأي حول مقرر دراسي
          </h1>
          <div className="!w-24 !h-1 !my-5 !bg-blue-900/80 !mx-auto !rounded"></div>
        </div>
        
        {/* Toastify handles status messages globally */}

        <Formik 
          enableReinitialize
          initialValues={initialValues}
          validationSchema={buildValidationSchema((questions || []).length)}
          onSubmit={handleSubmit}
        >
          {({ errors, values }) => (
            <Form className="space-y-8">
              {/* Course Information Card */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-lg p-6 border border-blue-200">
                <h2 className="!text-xl !font-bold !text-gray-800 !mb-6 text-center">
                  معلومات المقرر الدراسي
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {/* Course Name */}
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                    <h3 className="font-semibold !text-blue-900 mb-2">اسم المقرر:</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {course?.title || course?.name || lecture?.course?.title || lecture?.course?.name || 'غير محدد'}
                    </p>
                  </div>
                  
                  {/* Instructor */}
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                    <h3 className="font-semibold !text-blue-900 mb-2">المحاضر:</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {lecture ? getInstructorNames(lecture) : 'غير محدد'}
                    </p>
                  </div>
                  
                  {/* Student Faculty */}
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                    <h3 className="font-semibold !text-blue-900 mb-2">كلية الطالب:</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {getFacultyName(user?.faculty?.id || user?.faculty_id || user?.faculty)}
                    </p>
                  </div>
                  
                  {/* Student Program */}
                  <div className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-150">
                    <h3 className="font-semibold !text-blue-900 mb-2">برنامج الطالب:</h3>
                    <p className="text-lg font-bold text-gray-900">
                      {getProgramName(user?.program?.id || user?.program_id || user?.program)}
                    </p>
                  </div>
                  
                  {/* Lecture day/time removed as requested */}
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border-l-4  border-blue-400 !p-4 ">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="mr-3">
                    <p className="text-sm text-blue-700">
                      <strong>يرجى الإجابة على الاستبانة بالطريقة الصحيحة</strong>
                    </p>
                    <p className="text-sm text-blue-600 mt-1">
                      مفتاح التقييم: 5 = ممتاز، 4 = جيد جداً، 3 = جيد، 2 = مقبول، 1 = ضعيف
                    </p>
                  </div>
                </div>
              </div>

              {/* Survey Questions Table */}
              <div className="bg-white rounded-xl rounded-t-none !p-4 !rounded-b-lg shadow-lg overflow-hidden">
                <div className="overflow-x-auto">
                  {/* Progress */}
                  <div className="flex justify-between items-center mb-3 px-1 text-sm text-gray-600">
                    <span>تمت الإجابة على {((values?.questions || []).filter(q => q.score)?.length) || 0} من {(questions || []).length}</span>
                  </div>
                  <table className="w-full text-right  ">
                    <thead className="bg-gray-200 text-gray-600 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-4 text-center font-semibold">م</th>
                        <th className="px-4 py-4 font-semibold">عناصر الاستبانة</th>
                        <th className="px-2 py-4 text-center font-semibold">5<br/><span className="text-xs">ممتاز</span></th>
                        <th className="px-2 py-4 text-center font-semibold">4<br/><span className="text-xs">جيد جداً</span></th>
                        <th className="px-2 py-4 text-center font-semibold">3<br/><span className="text-xs">جيد</span></th>
                        <th className="px-2 py-4 text-center font-semibold">2<br/><span className="text-xs">مقبول</span></th>
                        <th className="px-2 py-4 text-center font-semibold">1<br/><span className="text-xs">ضعيف</span></th>
                        <th className="px-4 py-4 font-semibold">ملاحظات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y  divide-gray-200">
                      {(questions || []).map((q, index) => (
                        <tr key={q.id} className="hover:bg-gray-50 transition-colors duration-200">
                          <td className="px-4 py-4 text-center font-medium text-gray-600">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 text-gray-800 leading-relaxed">
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
                              className="w-full !px-3 !py-0 !my-1 text-right  h-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
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
                  <div className="!px-4 !py-2 bg-red-50 border-t border-red-200">
                    {errors.questions.map((questionError, index) => (
                      questionError?.score && (
                        <p key={index} className="text-red-600 text-sm">
                          السؤال {index + 1}: {questionError.score}
                        </p>
                      )
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Questions */}
              <div className="flex flex-col ">
                <div className="bg-white  shadow-lg !px-6">
                  <h3 className="!text-xl font-semibold !text-gray-800 !mb-2">
                    اقتراحات التحسين والتطوير
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      في رأيك كيف يمكن تحسين أو تطوير هذا المقرر؟ <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="improvement"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                      placeholder="اكتب اقتراحاتك لتحسين المقرر..."
                    />
                    <ErrorMessage name="improvement" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>

                <div className="bg-white   !px-6">
                  <h3 className="!text-xl font-semibold !text-gray-800 !mb-2">
                    اقتراحات أخرى
                  </h3>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اقتراحات أخرى <span className="text-red-500">*</span>
                    </label>
                    <Field
                      as="textarea"
                      name="otherSuggestions"
                      rows="4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200"
                      placeholder="اكتب أي اقتراحات أخرى لديك..."
                    />
                    <ErrorMessage name="otherSuggestions" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-center pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-main flex items-center !my-5 !gap-2 !py-2 !px-5"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      
                      إرسال الاستمارة
                    </>
                  )}
                </button>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
}
