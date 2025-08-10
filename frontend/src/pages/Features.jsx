import React from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import "../styles/features.css";
import { useEffect } from "react";

function Features() {
	useEffect(() => {
		// Select all feature sections (namespaced class to avoid global conflicts)
		const sections = document.querySelectorAll(".ft-section");

		const reveal = () => {
			const windowHeight = window.innerHeight;
			sections.forEach((section) => {
				const top = section.getBoundingClientRect().top;
				if (top < windowHeight - 100) {
					section.style.animationPlayState = "running";
				}
			});
		};

		window.addEventListener("scroll", reveal);
		reveal();

		return () => window.removeEventListener("scroll", reveal);
	}, []);

	return (
		<div className="ft-page" dir="rtl">
			<h1 className="ft-title"> المميزات</h1>

			<p className="ft-intro">
				مرحبًا بك في منصة <strong>جامعة بورسعيد</strong> – حيث نمنحك السيطرة
				الكاملة على تنظيم الجدول الدراسي ومتابعة الأداء الأكاديمي بكل سهولة!
			</p>

			<div className="ft-grid">
				<section className="ft-section">
					<h2>🧠 المميزات الأساسية للمنصة</h2>
					<ul>
						<li>
							تسجيل وإدارة بيانات الجامعات، الكليات، البرامج الدراسية والأقسام.
						</li>
						<li>
							إضافة وتعديل اللوائح الدراسية مثل وصف المواد وساعات الاعتماد.
						</li>
						<li>ربط المقررات بمواعيد المحاضرات والمعامل والاختبارات.</li>
					</ul>
				</section>

				<section className="ft-section">
					<h2>🕒 تنظيم الجداول الدراسية الذكي</h2>
					<ul>
						<li>واجهة مخصصة لإنشاء الجداول الدراسية حسب التخصص والمستوى.</li>
						<li>نظام ذكي للكشف عن التعارضات الزمنية تلقائيًا.</li>
						<li>تصدير الجداول إلى PDF أو Excel.</li>
					</ul>
				</section>

				<section className="ft-section">
					<h2>📚 إدارة المقررات الدراسية</h2>
					<ul>
						<li>إضافة المحاضرات، المعامل، والاختبارات لكل مادة.</li>
						<li>إدارة القاعات الدراسية وتحديد مواعيد التوفر الأسبوعي.</li>
					</ul>
				</section>

				<section className="ft-section">
					<h2>👨‍🏫 إدارة المستخدمين والأدوار</h2>
					<p>دعم لأنواع مستخدمين مختلفة:</p>
					<ul>
						<li>طالب</li>
						<li>دكتور / معيد</li>
						<li>منسق برنامج</li>
						<li>منسق كلية</li>
						<li>رئيس الجامعة</li>
					</ul>
				</section>

				<section className="ft-section">
					<h2>🧩 الميزات الأساسية الإضافية</h2>
					<ul>
						<li>إدخال بيانات البرامج والمقررات.</li>
						<li>إدارة بيانات أعضاء هيئة التدريس والمعيدين.</li>
						<li>تسجيل بيانات الطلاب والمقررات الخاصة بهم.</li>
						<li>إنشاء جداول دراسية مرنة باستخدام محرّك ذكي للمساعدة.</li>
						<li>تحسين توزيع الموارد ومعالجة التعارضات تلقائيًا.</li>
						<li>توليد رموز QR لتسجيل حضور الطلاب.</li>
						<li>ربط سجلات الحضور تلقائيًا بملف الطالب والمادة.</li>
						<li>متابعة وعرض تقارير الحضور باستخدام واجهات سهلة.</li>
					</ul>
				</section>

				<section className="ft-section">
					<h2>🔧 ميزات إدارة النظام</h2>
					<ul>
						<li>إدخال وإدارة بيانات الجامعات والكليات والبرامج الدراسية.</li>
						<li>إدارة المواد واللوائح الدراسية.</li>
						<li>إدارة أنواع القاعات الدراسية وتحديد مدى توفرها.</li>
						<li>إدارة بيانات الطلاب وأعضاء هيئة التدريس.</li>
						<li>عرض وتتبع حضور المحاضرات باستخدام رموز QR أو الواجهة.</li>
					</ul>
				</section>
			</div>

			<section className="ft-section ft-section--full">
				<h2 style={{ textAlign: "center" }}>👥 مميزات مخصصة لكل فئة مستخدم</h2>

				<div className="ft-user-grid">
					<div className="ft-user-group">
						<h3>👨‍🎓 للطلاب:</h3>
						<ul>
							<li>عرض الجدول الدراسي الخاص.</li>
							<li>عرض المقررات المسجل بها.</li>
							<li>مسح QR لتسجيل الحضور.</li>
							<li>متابعة سجل الحضور والغياب.</li>
							<li>تعديل البيانات الشخصية.</li>
						</ul>
					</div>

					<div className="ft-user-group">
						<h3>👨‍🏫 لأعضاء هيئة التدريس:</h3>
						<ul>
							<li>عرض الجدول الأكاديمي.</li>
							<li>إدارة المحاضرات والأنشطة.</li>
							<li>توليد QR Code خاص بالحضور.</li>
							<li>تسجيل حضور وغياب الطلاب.</li>
							<li>مزامنة الجداول مع تقويم Google أو Outlook.</li>
						</ul>
					</div>

					<div className="ft-user-group">
						<h3>🎯 لمنسقي البرامج والكليات:</h3>
						<ul>
							<li>إدارة بيانات البرامج الدراسية.</li>
							<li>إنشاء ومراجعة الجداول الدراسية.</li>
							<li>كشف التداخلات والموافقة على الجدول النهائي.</li>
							<li>توزيع القاعات ومتابعة سجلات الطلاب.</li>
						</ul>
					</div>

					<div className="ft-user-group">
						<h3>🏛️ لرئيس الجامعة:</h3>
						<ul>
							<li>الإشراف الكامل على بيانات الجامعات والبرامج.</li>
							<li>إدارة حسابات المستخدمين.</li>
							<li>تخصيص الصلاحيات والتحكم بالنظام.</li>
						</ul>
					</div>
				</div>
			</section>

			<section className="ft-section ft-section--full">
				<h2>🔐 مميزات غير وظيفية</h2>
				<ul>
					<li>واجهة سهلة الاستخدام ومتجاوبة مع جميع الأجهزة.</li>
					<li>دعم تعدد المستخدمين والصلاحيات.</li>
					<li>أمان عالي للبيانات وكلمات المرور.</li>
					<li>دعم عدد كبير من المستخدمين المتزامنين.</li>
				</ul>
			</section>
		</div>
	);
}

export default Features;