import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { surveyApi } from "./surveyApi";

const surveyQuestions = [
  { id: 1, text: "المقرر الدراسي شامل وواقعي ويتم عرضه بطريقة شيقة وغير مملة" },
  { id: 2, text: "المقرر يحتوي على أهداف واضحة ويكتسب المتعلم المعرفة النظرية والمهارات العملية" },
  { id: 3, text: "ينفذ أعضاء هيئة التدريس المواعيد المحددة بدقة" },
  { id: 4, text: "يتمكن المحاضر من توصيل المعلومة بوضوح" },
  { id: 5, text: "المقرر الدراسي شامل وواقعي ويتم عرضه بطريقة شيقة وغير مملة" },
  { id: 6, text: "المقرر يحتوي على أهداف واضحة ويكتسب المتعلم المعرفة النظرية والمهارات العملية" },
  { id: 7, text: "ينفذ أعضاء هيئة التدريس المواعيد المحددة بدقة" },
  { id: 8, text: "يتمكن المحاضر من توصيل المعلومة بوضوح" },
  { id: 9, text: "المقرر الدراسي شامل وواقعي ويتم عرضه بطريقة شيقة وغير مملة" },
  { id: 10, text: "المقرر يحتوي على أهداف واضحة ويكتسب المتعلم المعرفة النظرية والمهارات العملية" },
  { id: 11, text: "ينفذ أعضاء هيئة التدريس المواعيد المحددة بدقة" },
  { id: 12, text: "يتمكن المحاضر من توصيل المعلومة بوضوح" },
];

// Validation schema
const validationSchema = Yup.object({
  academicYear: Yup.string().required("العام الدراسي مطلوب"),
  semester: Yup.string().required("الفصل الدراسي مطلوب"),
  courseName: Yup.string().required("اسم المقرر مطلوب"),
  courseCode: Yup.string().required("كود المقرر مطلوب"),
  instructor: Yup.string().required("القائم على التدريس مطلوب"),
  teachingAssistant: Yup.string().required("الهيئة المعاونة مطلوبة"),
  questions: Yup.array().of(
    Yup.object({
      score: Yup.string().required("يرجى اختيار تقييم"),
      comment: Yup.string()
    })
  ),
  improvement: Yup.string().required("يرجى كتابة اقتراحات التحسين"),
  otherSuggestions: Yup.string().required("يرجى كتابة اقتراحات أخرى")
});

export default function SurveyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const initialValues = {
    academicYear: "",
    semester: "",
    courseName: "",
    courseCode: "",
    instructor: "",
    teachingAssistant: "",
    questions: surveyQuestions.map(q => ({ id: q.id, score: "", comment: "" })),
    improvement: "",
    otherSuggestions: ""
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    setIsSubmitting(true);
    setSubmitStatus(null);
    
    try {
      // Prepare data for backend
      const surveyData = {
        course_info: {
          academic_year: values.academicYear,
          semester: values.semester,
          course_name: values.courseName,
          course_code: values.courseCode,
          instructor: values.instructor,
          teaching_assistant: values.teachingAssistant
        },
        responses: values.questions.map(q => ({
          question_id: q.id,
          score: parseInt(q.score),
          comment: q.comment
        })),
        improvement_suggestions: values.improvement,
        other_suggestions: values.otherSuggestions,
        submitted_at: new Date().toISOString()
      };

      // Submit survey data to backend
  await surveyApi.submitSurvey(surveyData);
      
      setSubmitStatus('success');
      resetForm();
      
    } catch (error) {
      console.error('Error submitting survey:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen !bg-gradient-to-br !from-blue-50 !to-indigo-100  !p-5">
      <div className="!max-w-6xl p-4 !mx-auto !bg-white !rounded-lg !shadow-lg">
        {/* Header */}
        <div className="!text-center !py-5 ">
          <h1 className="!text-2xl !font-bold !text-gray-800 mb-4">
            استمارة استطلاع رأي حول مقرر دراسي
          </h1>
          <div className="!w-24 !h-1 !my-5 !bg-blue-900/80 !mx-auto !rounded"></div>
        </div>
        {/* Status Messages */}
        {submitStatus === 'success' && (
          <div className="mb-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            تم إرسال الاستمارة بنجاح! شكراً لك على وقتك.
          </div>
        )}
        {submitStatus === 'error' && (
          <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            حدث خطأ في إرسال الاستمارة. يرجى المحاولة مرة أخرى.
          </div>
        )}

        <Formik 
          initialValues={initialValues} 
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors }) => (
            <Form className="space-y-8">
              {/* Course Information Card */}
              <div className="bg-white rounded-xl rounded-b-none shadow-lg p-6">
                <h2 className="!text-lg !font-bold !text-gray-800 !mb-6 text-center">
                  معلومات المقرر الدراسي
                </h2>
                <div className="grid !p-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      العام الدراسي <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="academicYear"
                      as="select"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent !transition-all !duration-200"
                    >
                      <option value="">اختر العام الدراسي</option>
                      <option value="2024-2025">2024-2025</option>
                      <option value="2023-2024">2023-2024</option>
                      <option value="2022-2023">2022-2023</option>
                    </Field>
                    <ErrorMessage name="academicYear" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الفصل الدراسي <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="semester"
                      as="select"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="">اختر الفصل الدراسي</option>
                      <option value="الأول">الأول</option>
                      <option value="الثاني">الثاني</option>
                      <option value="الصيفي">الصيفي</option>
                    </Field>
                    <ErrorMessage name="semester" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      اسم المقرر <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="courseName"
                      type="text"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="أدخل اسم المقرر"
                    />
                    <ErrorMessage name="courseName" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      كود المقرر <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="courseCode"
                      type="text"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="أدخل كود المقرر"
                    />
                    <ErrorMessage name="courseCode" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      القائم على التدريس <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="instructor"
                      type="text"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="أدخل اسم المحاضر"
                    />
                    <ErrorMessage name="instructor" component="div" className="text-red-500 text-sm mt-1" />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      الهيئة المعاونة <span className="text-red-500">*</span>
                    </label>
                    <Field
                      name="teachingAssistant"
                      type="text"
                      className="w-full !px-4 !py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      placeholder="أدخل اسم الهيئة المعاونة"
                    />
                    <ErrorMessage name="teachingAssistant" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
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
                  <table className="w-full text-right  ">
                    <thead className="bg-gray-200 text-gray-600">
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
                      {surveyQuestions.map((q, index) => (
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
