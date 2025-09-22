import React, { useEffect, useState } from 'react'
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

export default function ExamTable() {
  const { user } = useAuth();
  const [examTables, setExamTables] = useState([]);
  const [universities, setUniversities] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingExam, setEditingExam] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    university: "",
    faculty: "",
    program: "",
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
          console.log('Universities loaded:', uniqueUniversities);
        }
        
        console.log('Faculties loaded:', facultiesData);
        console.log('Programs loaded:', programsData);
        console.log('First faculty university:', facultiesData[0]?.university);
      } catch (err) {
        setError('فشل في تحميل البيانات: ' + err.message);
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
      image: null,
    });
    setEditingExam(null);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const data = new FormData();
    data.append("university", formData.university);
    data.append("faculty", formData.faculty);
    data.append("program", formData.program);
    if (formData.image) {
      data.append("image", formData.image);
    }

    try {
      setLoading(true);
      if (editingExam) {
        await updateExamTable(editingExam.id, data);
        setSuccess('تم تحديث جدول الامتحانات بنجاح');
      } else {
        await createExamTable(data);
        setSuccess('تم إنشاء جدول الامتحانات بنجاح');
      }
      
      // Refresh the list
      const updatedList = await fetchExamTableList();
      setExamTables(updatedList);
      resetForm();
      setShowModal(false);
    } catch (err) {
      setError('فشل في العملية: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (examId) => {
    try {
      setLoading(true);
      const exam = await fetchExamTable(examId);
      setFormData({
        university: exam.university || exam.university_data?.id,
        faculty: exam.faculty || exam.faculty_data?.id,
        program: exam.program || exam.program_data?.id,
        image: null,
      });
      setEditingExam(exam);
      setShowModal(true);
    } catch (err) {
      setError('فشل في تحميل بيانات الجدول: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('هل أنت متأكد من حذف جدول الامتحانات؟')) {
      return;
    }

    try {
      setLoading(true);
      await deleteExamTable(examId);
      setSuccess('تم حذف جدول الامتحانات بنجاح');
      
      // Refresh the list
      const updatedList = await fetchExamTableList();
      setExamTables(updatedList);
    } catch (err) {
      setError('فشل في حذف الجدول: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    resetForm();
    setShowModal(true);
  };
  return (
    <div className="!min-h-[600px] content-card exam-table-section-applying">
      <h2>جدول الامتحانات</h2>
      
      {/* Error and Success Messages */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      <div className="exam-table-chart">
        <div className='flex gap-2 justify-end mb-4'>
          <button
            onClick={openCreateModal}
            className='btn-main !px-4 !py-3 text-lg'
            disabled={loading}
          >
            {loading ? 'جاري التحميل...' : 'اضافة جدول الامتحانات'}
          </button>
        </div>

        {/* Loading State */}
        {loading && examTables.length === 0 && (
          <div className="text-center py-8">
            <p>جاري تحميل جداول الامتحانات...</p>
          </div>
        )}

        {/* Exam Tables List */}
        <div className="chart-placeholder">
          {examTables.length === 0 && !loading ? (
            <div className="text-center py-8 text-gray-500">
              <p>لا توجد جداول امتحانات متاحة</p>
            </div>
          ) : (
            examTables.map((examTable) => (
              <div key={examTable.id} className='flex flex-col gap-4 justify-center border border-gray-200 rounded-lg p-4 mb-4'>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">جدول الامتحانات</h3>
                    <p><strong>الجامعة:</strong> {examTable.university_data?.name || examTable.university?.name}</p>
                    <p><strong>الكلية:</strong> {examTable.faculty_data?.name || examTable.faculty?.name}</p>
                    <p><strong>القسم:</strong> {examTable.program_data?.name || examTable.program?.name}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(examTable.id)}
                      className="btn-main !px-3 !py-2 text-sm"
                      disabled={loading}
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => handleDelete(examTable.id)}
                      className="bg-red-500 hover:bg-red-600 text-white !px-3 !py-2 text-sm rounded"
                      disabled={loading}
                    >
                      حذف
                    </button>
                  </div>
                </div>
                <div className='flex justify-center'>
                  <img 
                    className='!h-[200px] !w-[200px] !object-cover rounded' 
                    src={examTable.image} 
                    alt={`جدول امتحانات ${examTable.faculty_data?.name || examTable.faculty?.name}`} 
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          resetForm();
        }}
        title={editingExam ? "تعديل جدول الامتحانات" : "اضافة جدول الامتحانات"}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto p-4 rounded">
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
                const filteredPrograms = programs.filter(program => program.faculty?.id == formData.faculty);
                console.log('Filtering programs for faculty:', formData.faculty);
                console.log('Filtered programs:', filteredPrograms);
                return filteredPrograms.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ));
              })()}
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
    </div>
  )
}
