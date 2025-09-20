import React, { useEffect, useState } from 'react'
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/ui/Modal';
import { fetchExamTable, fetchExamTableList } from '../../services/examApi';
export default function ExamTable() {
  
  const [showModal, setShowModal] = useState(false);


  const [formData, setFormData] = useState({
    university: "",
    faculty: "",
    program: "",
    image: null,
  });

  const handleChange = (e) => {
    if (e.target.name === "image") {
      setFormData({ ...formData, image: e.target.files[0] });
    } else {
      setFormData({ ...formData, [e.target.name]: e.target.value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = new FormData();
    data.append("university", formData.university);
    data.append("faculty", formData.faculty);
    data.append("program", formData.program);
    data.append("image", formData.image);
// usethis here 
// export const fetchExamTable = async (data) => {
//   const res = await fetch(`${api.baseURL}/exam/create`,data, {
//     method: 'POST',
//     headers: api.getAuthHeaders(),
//     body: data,
//   });
//   if (!res.ok) throw new Error('فشل في جلب جدول الامتحانات');
//   return res.json();
// };
    try {
      const res = await fetchExamTable(data);
      //   headers: { "Content-Type": "multipart/form-data" },
      // });
      console.log("Upload success:", res.data);
    } catch (err) {
      console.error("Upload failed:", err);
    }
  };




    const { user } = useAuth();
    const [examTables, setExamTables] = useState([]);
    useEffect(() => {
        const fetchExamTable = async () => {
            const response = await fetchExamTableList();
            
            setExamTables( response );
            console.log(examTables);
        };
        fetchExamTable();
    }, [user]);
  return (
    <div  className="!min-h-[600px] content-card exam-table-section-applying">
    <h2>جدول الامتحانات</h2>
    <div className="exam-table-chart">
      <div className='flex gap-2 justify-end'>

      <button
      onClick={() => setShowModal(true)}
      className='btn-main !px-4 !py-3 text-lg'>اضافة جدول الامتحانات</button>
      <button className='btn-main !px-4 !py-3 text-lg'>تعديل جدول الامتحانات</button>
      <button className='btn-main !px-4 !py-3 text-lg'>حذف جدول الامتحانات</button>
      </div>
      <div className="chart-placeholder">
        {examTables.map((examTable) => (
          <div key={examTable.id} className='flex flex-col gap-4 justify-center'>
            <div>

            <p>سيتم عرض جدول الامتحانات هنا</p>
            <p>{examTable.id}</p>
            <p>{examTable.university.name}</p>
            <p>{examTable.faculty.name}</p>
            <p>{examTable.program.name}</p>
            </div>
            <div className='flex justify-center'>

            <img className=' !h-[200px] !w-[200px] !object-cover' src={examTable.image} alt={examTable.name} />
            </div>
          </div>
        ))}
      </div>
    </div>
    <Modal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      title="اضافة جدول الامتحانات"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-80 mx-auto p-4  rounded">
      <input
        type="text"
        name="university"
        placeholder="University ID"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="faculty"
        placeholder="Faculty ID"
        onChange={handleChange}
        required
      />
      <input
        type="text"
        name="program"
        placeholder="Program ID"
        onChange={handleChange}
        required
      />
      <input
        type="file"
        name="image"
        accept="image/*"
        onChange={handleChange}
        required
      />
      <button type="submit" className="btn-main text-white !p-2 rounded">
اضافة      </button>
    </form>
    </Modal>
  </div>

  )
}
