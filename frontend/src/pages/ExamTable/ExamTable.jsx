import React, { useEffect, useState } from 'react'
import { createPortal } from 'react-dom';
import Spinner from '../../components/Spinner';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { 
  createExamTable, 
  fetchExamTableList, 
  updateExamTable, 
  deleteExamTable,
  fetchExamTable 
} from '../../services/examApi';
import { fetchFaculties } from '../../services/facultyApi';
import { fetchPrograms } from '../../services/programApi';
import toast from '../../utils/toast';

export default function ExamTable() {
  const { user } = useAuth();
  const [examTables, setExamTables] = useState([]);
  const [_universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [examToDelete, setExamToDelete] = useState(null);

  const [formData, setFormData] = useState({
    university: "",
    faculty: "",
    program: "",
    level: "",
    image: null,
  });

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [examTablesData, facultiesData, programsData] = await Promise.all([
          fetchExamTableList(),
          fetchFaculties(),
          fetchPrograms()
        ]);
        
        setExamTables(examTablesData);
        setFaculties(facultiesData);
        setPrograms(programsData);
        
        // Load universities from faculty data
        if (facultiesData.length > 0) {
          const uniqueUniversities = [...new Map(facultiesData.map(f => [f.university?.id, f.university]).filter(([id, uni]) => id && uni)).values()];
          setUniversities(uniqueUniversities);
        }
      } catch (err) {
        toast.error('فشل في تحميل البيانات: ' + (err.message || 'حدث خطأ غير متوقع'));
      } finally {
        setLoading(false);
      }
    };
    
    if (user) {
      loadData();
    }
  }, [user]);

  const handleChange = (e) => {
    if (e.target.name === "image") {
      setFormData({ ...formData, image: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const resetForm = () => {
    setFormData({
      university: "1",
      faculty: "",
      program: "",
      level: "",
      image: null,
    });
    setEditingExam(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("university", formData.university);
    data.append("faculty", formData.faculty);
    data.append("program", formData.program);
    data.append("level", formData.level);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      setLoading(true);
      if (editingExam) {
        await updateExamTable(editingExam.id, data);
        toast.success('تم تحديث جدول الامتحانات بنجاح');
      } else {
        await createExamTable(data);
        toast.success('تم إنشاء جدول الامتحانات بنجاح');
      }
      
      // Refresh the list
      const updatedList = await fetchExamTableList();
      setExamTables(updatedList);
      resetForm();
      setShowModal(false);
    } catch (err) {
      toast.error('فشل في العملية: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setLoading(false);
    }
  };
    // Helper function to check if user has a specific group
    const hasGroup = (groupId) => {
      if (!user?.groups) return false;
      return user.groups.some(group => {
        const id = typeof group === 'object' ? group.id : group;
        return id === groupId;
      });
    };


  // Helper function to check if user has any of the specified groups
  const hasAnyGroup = (groupIds) => {
    return groupIds.some(groupId => hasGroup(groupId));
  };

  const handleEdit = async (examId) => {
    try {
      setLoading(true);
      const exam = await fetchExamTable(examId);
      setFormData({
        university: exam.university || exam.university_data?.id,
        faculty: exam.faculty || exam.faculty_data?.id,
        program: exam.program || exam.program_data?.id,
        level: exam.level || "",
        image: null,
      });
      setEditingExam(exam);
      setShowModal(true);
    } catch (err) {
      toast.error('فشل في تحميل بيانات الجدول: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    try {
      setLoading(true);
      await deleteExamTable(examId);
      toast.success('تم حذف جدول الامتحانات بنجاح');
      
      // Refresh the list
      const updatedList = await fetchExamTableList();
      setExamTables(updatedList);
      setShowDeleteModal(false);
      setExamToDelete(null);
    } catch (err) {
      toast.error('فشل في حذف الجدول: ' + (err.message || 'حدث خطأ غير متوقع'));
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };
  
  const openDeleteModal = (exam) => {
    setExamToDelete(exam);
    setShowDeleteModal(true);
  };
  return (
    <div>
      <div className='flex justify-between  items-center !my-5'>

    <h2 className='!text-2xl md:!text-[30px] font-bold  text-center !text-gray-700'>جدول الامتحانات</h2>
    {hasAnyGroup([6, 5, 4, 1]) && (
          <div className='flex gap-2 justify-end mb-4'>
          <button
            onClick={openCreateModal}
            className='btn-main !px-2 !py-1 md:!px-4 md:!py-3 !text-meduim'
            disabled={loading}
          >
            {loading ? 'جاري التحميل...' : 'اضافة جدول الامتحانات'}
          </button>
        </div>
        )}
      </div>
    <div className="h-[80vh] overflow-y-auto">
      {loading && createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm z-[999999]" aria-live="polite" aria-label="يتم معالجة الطلب، الرجاء الانتظار">
          <div className="flex flex-col items-center gap-3">
            <Spinner size="lg" color="primary" />
            <div className="text-white font-semibold">جارٍ التحميل...</div>
          </div>
        </div>,
        document.body
      )}
      

      <div className="exam-table-chart  flex flex-col gap-3 !p-0">
        
        {/* Loading State */}
        {loading && examTables.length === 0 && (
          <div className="text-center py-8">
            <p>جاري تحميل جداول الامتحانات...</p>
          </div>
        )}

        {/* Exam Tables List */}
        
          {examTables.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-800 text-3xl">
              <p>لا توجد جداول امتحانات متاحة</p>
            </div>
          ) : (
            examTables.map((examTable) => (
              <div key={examTable.id} className='flex flex-col gap-3 border border-gray-200 rounded-xl !p-4  text-gray-800 shadow-sm transition-all'>

                  <div className='text-center'>
                    
                    
                    <p className='text-lg opacity-90'><span className='font-semibold'>الكلية:</span> {examTable.faculty_data?.name || examTable.faculty?.name}</p>
                    <p className='text-lg opacity-90'><span className='font-semibold'>القسم:</span> {examTable.program_data?.name || examTable.program?.name}</p>
                    {examTable.level && (
                      <p className='text-lg opacity-90'><span className='font-semibold'>المستوى:</span> {examTable.level}</p>
                    )}
                  </div>
               <div className="flex  justify-center">
                  
                <img 
                  className='!w-[700px] max-h-[400px] md:max-h-[600px] mx-auto rounded-lg' 
                  src={examTable.image} 
                  alt={`جدول امتحانات ${examTable.faculty_data?.name || examTable.faculty?.name}`} 
                />
                </div>
                <div className='flex justify-center'>

                {hasAnyGroup([6, 5, 4, 1]) && ( 
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(examTable.id)}
                        className="btn btn edit !px-5 !py-4 text-sm"
                        disabled={loading}
                      >
                        تعديل
                      </button>
                      <button
                        onClick={() => openDeleteModal(examTable)}
                        className=" btn delete text-white !px-5 !py-3 text-sm rounded-lg"
                        disabled={loading}
                      >
                        حذف
                      </button>
                    </div>
                  )}
                </div>


              </div>
            ))
          )}
        
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingExam ? "تعديل جدول الامتحانات" : "اضافة جدول الامتحانات"}
        containerStyle={{ minWidth: '400px', minHeight: '500px' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-md mx-auto p-6 rounded bg-white">
          {/* University Dropdown */}
          {/* <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الجامعة</label>
            <select
              name="university"
              value={formData.university}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">اختر الجامعة</option>
              {universities.map((university) => (
                <option key={university.id} value={university.id}>
                  {university.name}
                </option>
              ))}
            </select>
          </div> */}

          {/* Faculty Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">الكلية</label>
            <select
              name="faculty"
              value={formData.faculty}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">اختر الكلية</option>
              {(() => {
              
                return faculties.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Program Dropdown */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">القسم</label>
            <select
              name="program"
              value={formData.program}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">اختر القسم</option>
              {(() => {
                
                return programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ));
              })()}
            </select>
          </div>

          {/* Level Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">المستوى الدراسي</label>
            <select
              name="level"
              value={formData.level}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">اختر المستوى</option>
              <option value="المستوى الأول">المستوى الأول</option>
              <option value="المستوى الثاني">المستوى الثاني</option>
              <option value="المستوى الثالث">المستوى الثالث</option>
              <option value="المستوى الرابع">المستوى الرابع</option>
              <option value="المستوى الخامس">المستوى الخامس</option>
              <option value="المستوى السادس">المستوى السادس</option>
              <option value="المستوى السابع">المستوى السابع</option>
            </select>
          </div>

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">صورة جدول الامتحانات</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required={!editingExam}
            />
            {editingExam && (
              <p className="text-sm text-gray-500 mt-1">
                اتركه فارغاً للحفاظ على الصورة الحالية
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn-main text-white !p-2 rounded"
            disabled={loading}
          >
            {loading ? 'جاري الحفظ...' : (editingExam ? 'تحديث' : 'اضافة')}
          </button>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && examToDelete && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setExamToDelete(null);
          }}
          title={"تأكيد حذف جدول الامتحانات"}
        >
          <div className="px-1">
            <div className="h-[2px] w-full bg-slate-200/50 mb-3" />
            <p className="text-center text-slate-700 mb-6">هل أنت متأكد من حذف هذا الجدول؟ لا يمكن التراجع عن هذا الإجراء.</p>
            <div className="flex items-center justify-center gap-3 !mt-5">
              <button
                className="!px-5 !py-2 rounded-md bg-gray-200 text-gray-800 border border-gray-300 hover:bg-gray-300"
                onClick={() => {
                  setShowDeleteModal(false);
                  setExamToDelete(null);
                }}
                disabled={loading}
              >
                إلغاء
              </button>
              <button
                className="!px-4 !py-2 rounded-md bg-red-600 hover:bg-red-700 text-white flex items-center gap-2"
                onClick={() => handleDelete(examToDelete.id)}
                disabled={loading}
              >
                نعم، حذف
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M3 6h18v2H3V6zm2 3h14v13a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V9zm5 2v7h2v-7h-2zm-4 0v7h2v-7H6zm8 0v7h2v-7h-2z"/></svg>
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
    </div>
  )
}
