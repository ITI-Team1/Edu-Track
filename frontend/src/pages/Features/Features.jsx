import React from "react";
import "./features.css";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import psu2 from "../../assets/psu2.jpg";
import aboutImg from "../../assets/login.jpeg";

// Minimal cn util (no Tailwind required here, kept for parity)
const cn = (...classes) => classes.filter(Boolean).join(" ");

function StepsBar({ steps }) {
  return (
    <div className="steps" aria-label="feature steps">
      <div className="steps-line" />
      {steps.map((s, i) => (
        <div key={i} className="step">
          <div className="step-icon" aria-hidden>
            <span className="step-emoji" role="img" aria-label="icon">{s.icon}</span>
          </div>
          <div className="step-title">{s.title}</div>
        </div>
      ))}
    </div>
  );
}

function FeatureDetailsModal({ open, onClose, variant }) {
  if (!open) return null;
  const detailsByVariant = {
    charts: {
      header: "منصة إدارة الجامعة — التفاصيل",
      lines: [
        "يعرض لوحات مؤشرات لحظية تغطي الحضور والدرجات والتحميل الأكاديمي.",
        "يدعم التصفيّة حسب الكلية، البرنامج، المقرر، عضو هيئة التدريس والفصل الدراسي.",
        "مقارنات زمنية بين الفصول والسنوات مع إبراز خطوط الاتجاه.",
        "مؤشرات أداء رئيسية KPI مصممة لقياس الالتزام والتحسّن.",
        "تنبيهات عند تجاوز الحدود الحرجة للمؤشرات أو انخفاض الأداء المفاجئ.",
        "إمكانية تنزيل التقارير بصيغ PDF/CSV ومشاركتها مع الإدارات.",
        "صلاحيات عرض دقيقة تضمن وصول البيانات الصحيحة للأشخاص المناسبين.",
        "تكامل مع مصادر البيانات الداخلية لتحديث المؤشرات تلقائياً.",
      ],
    },
    cards: {
      header: "إنشاء المحتوى والمتابعة — التفاصيل",
      lines: [
        "قوالب جاهزة لبناء خطط المقررات مع أهداف تعلم ونتائج قابلة للقياس.",
        "محرر غني يدعم النصوص، الصور، الجداول والروابط داخل المحتوى.",
        "إسناد مهام للطلاب بمواعيد نهائية وتنبيهات تلقائية.",
        "تعليقات وملاحظات للأساتذة مع تتبع تاريخ التعديلات.",
        "رفع موارد تعليمية وربطها بالمخرجات والمعايير.",
        "متابعة تقدم الطلاب على مستوى المهمة والمقرر والبرنامج.",
        "تقارير نشاط تفصيلية مع فلترة حسب الشُعب وأعضاء هيئة التدريس.",
        "مزامنة الحالات مع الجداول لتجنّب التعارض وضمان الاتساق.",
      ],
    },
    table: {
      header: "المتابعة والتحليلات — التفاصيل",
      lines: [
        "عرض تفصيلي للحضور والدرجات مع مؤشرات مبكّرة للتعثّر.",
        "نماذج تنبؤية تعتمد على أنماط السلوك للحالات المعرضة للخطر.",
        "فلاتر متقدمة حسب الأسبوع، الوحدة التعليمية ونوع التقييم.",
        "مقارنة أداء الفصول والأقسام لاكتشاف فرص التحسين.",
        "لوحات قياس جودة التدريس والتفاعل الصفي.",
        "مسارات تصحيحية مقترحة وإشعارات للإرشاد الأكاديمي.",
        "تكامل مع أنظمة الاختبارات لقراءة النتائج تلقائياً.",
        "إمكانية تصدير الجداول والرسوم البيانية للمشاركة.",
      ],
    },
    grid: {
      header: "العمليات والأتمتة — التفاصيل",
      lines: [
        "قواعد أتمتة مرنة لإرسال إشعارات بريدية ورسائل داخل المنصة.",
        "محرّك سير عمل لضبط موافقات، وتنفيذ مهام دورية تلقائياً.",
        "تكامل عبر واجهات APIs مع أنظمة الهوية، المالية والبوابات.",
        "مستويات صلاحيات متعددة مع سجلات تدقيق كاملة للتغييرات.",
        "قوالب جاهزة لسير عمل التسجيل، الجداول، وتخصيص القاعات.",
        "أساليب جدولة ذكية لتوزيع الموارد وتقليل التعارضات.",
        "قياس أداء العمليات بالزمن والتكلفة ونسب الإنجاز.",
        "خطط طوارئ واسترجاع تعتمد على نسخ احتياطية مجدولة.",
      ],
    },
  };
  const data = detailsByVariant[variant] || detailsByVariant.charts;
  return (
    <div className="ft-modal-overlay" onClick={onClose}>
      <motion.div
        className="ft-modal"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="ft-modal-header">
          <h3>{data.header}</h3>
          <button className="ft-modal-close" onClick={onClose} aria-label="إغلاق">×</button>
        </div>
        <div className="ft-modal-body">
          <div className="ft-modal-card">
            <h4 className="ft-modal-title">تفاصيل الميزة</h4>
            <p className="ft-modal-paragraph">
              {data.lines.map((line, i) => (
                <span key={i} className="ft-line">{line}<br/></span>
              ))}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function SplitCard({ dirFlip = false, title, points, variant = "charts", imageSrc, imageAlt, onLearnMore }) {
  const textsByVariant = {
    charts: ["لوحة مؤشرات", "تحليلات سريعة", "مقارنة فترات", "اتجاهات", "مؤشرات رئيسية"],
    cards: ["بطاقات محتوى", "ملخصات ذكية", "تنبيهات", "مهام", "إشعارات"],
    table: ["جدول بيانات", "فرز وتصفية", "صفوف مميزة", "ملخص", "تصدير"],
    grid: ["شبكة عناصر", "تجميع مرن", "سحب وإفلات", "أداء", "تنظيم"]
  };
  const items = (textsByVariant[variant] || ["عنصر 1", "عنصر 2", "عنصر 3", "عنصر 4", "عنصر 5"]).slice(0, 5);
  return (
    <section className={cn("split-section", dirFlip && "split-section--flip", `split-section--${variant}`)}> 
      <motion.div
        className={cn("split-card", `split-card--${variant}`)}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <div className="split-text">
          <h2 className="split-title">{title}</h2>
          <motion.ul
            className="split-list"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.3 }}
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.15, delayChildren: 0.1 },
              },
            }}
          >
            {points.map((p, idx) => (
              <motion.li
                key={idx}
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ x: -2 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
              >
                {p}
              </motion.li>
            ))}
          </motion.ul>
          <button type="button" className="split-cta" onClick={() => onLearnMore?.(variant)}>
            تعرّف أكثر
          </button>
        </div>
        <div className="split-media">
          <div className={cn("demo-surface", `demo-surface--${variant}`)}>
            {imageSrc && (
              <img className="demo-img" src={imageSrc} alt={imageAlt || "feature"} />
            )}
            <div className={cn("media-rows", `media-rows--${variant}`)}>
              {items.map((label, i) => (
                <motion.div
                  key={i}
                  className="tile"
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  <span className="tile-label">{label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
}

// Timeline removed

function Features() {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeVariant, setActiveVariant] = useState("charts");
  const handleLearnMore = (variant) => {
    setActiveVariant(variant);
    setModalOpen(true);
  };

  useEffect(() => {
    const sections = document.querySelectorAll(".ft-section");
    
    const reveal = () => {
      const windowHeight = window.innerHeight;
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        const revealPoint = 150; // Adjust this value to change when the animation triggers
        
        if (rect.top < windowHeight - revealPoint) {
          section.style.animationPlayState = "running";
          section.classList.add("animated");
        }
      });
    };

    // Initial check
    setTimeout(reveal, 100);

    // Add scroll listener
    window.addEventListener("scroll", reveal);
    
    // Cleanup
    return () => window.removeEventListener("scroll", reveal);
  }, []);

  const steps = [
    { icon: "🏛️", title: "المنصة" },
    { icon: "✍️", title: "المحتوى" },
    { icon: "📈", title: "المراقبة" },
  ];

  // Timeline data removed

  return (
    <div className="ft-page" dir="rtl">
      <h1 className="ft-title">المميزات</h1>
      <p className="ft-intro">
        مرحبًا بك في منصة <strong>جامعة بورسعيد</strong> – حيث نمنحك السيطرة الكاملة على تنظيم الجدول الدراسي ومتابعة الأداء الأكاديمي بكل سهولة!
      </p>
      <StepsBar steps={steps} />

      {/* Media banner */}
      <div className="ft-banner">
        <img className="ft-banner-img" src={psu2} alt="منصة جامعة بورسعيد" />
        <div className="ft-banner-shade" />
        <div className="ft-banner-text">
          <h2>تعليم ذكي مدعوم بالبيانات</h2>
          <p>واجهات تفاعلية، تحليلات لحظية، وإدارة متكاملة للبرامج والموارد.</p>
        </div>
      </div>


      <SplitCard
        title="منصة إدارة الجامعة"
        points={[
          "إدارة شاملة للجامعات والكليات والبرامج مع هيكل تنظيمي مُوحد وسهل التصفح.",
          "جداول ذكية تُنشأ تلقائياً مع معالجة تعارض القاعات وأعضاء هيئة التدريس.",
          "صلاحيات دقيقة للمسؤولين ولوحات معلومات لحظية لاتخاذ القرار بسرعة.",
          "تكامل مع أنظمة الهوية والبوابات والتقارير لتدفق بيانات موثوق.",
          "تنبيهات وإشعارات عند تجاوز عتبات الأداء أو اكتشاف التعثر مبكراً.",
        ]}
        onLearnMore={handleLearnMore}
        variant="charts"
        imageSrc={psu2}
      />

      <SplitCard
        dirFlip
        title="إنشاء المحتوى والمتابعة"
        points={[
          "إنشاء خطط مقررات وأنشطة عملية بقوالب جاهزة وإرفاق وسائط بسهولة.",
          "إسناد مهام وتذكيرات مؤتمتة مع تتبع الإنجاز والتنبيهات داخل المنصة.",
          "متابعة الأداء والحضور بنماذج محدثة وتقارير لحظية للطلاب والأساتذة.",
          "محرر غني يدعم النصوص والصور والجداول والروابط داخل المحتوى.",
          "تعليقات ومراجعات مع سجل تاريخي للتعديلات وتعزيز الجودة.",
        ]}
        onLearnMore={handleLearnMore}
        variant="cards"
        imageSrc="https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop"
      />

      <SplitCard
        title="المتابعة والتحليلات"
        points={[
          "لوحات تحكم تفاعلية للحضور والدرجات مع تصفية ومقارنات بين الفصول.",
          "كشف مبكر للتعثر الأكاديمي عبر مؤشرات تنبؤية وتنبيهات فورية.",
          "تقارير قابلة للتنزيل ومشاركة ميسّرة لأصحاب المصلحة داخل الجامعة.",
          "مقارنات زمنية واتجاهات لقياس التحسّن على مستوى البرامج والفصول.",
          "صلاحيات عرض دقيقة لضمان الخصوصية والتحكم في الوصول للبيانات.",
        ]}
        onLearnMore={handleLearnMore}
        variant="table"
        imageSrc="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop"
      />

      <SplitCard
        dirFlip
        title="العمليات والأتمتة"
        points={[
          "أتمتة سير العمل والإشعارات البريدية ورسائل المنصة وفق قواعد قابلة للتخصيص.",
          "تكاملات جاهزة عبر واجهات APIs مع أنظمة الهوية والأنظمة المالية والبوابات.",
          "إدارة أدوار وصلاحيات مرنة بمستويات متعددة ومراجعة سجلات التدقيق.",
          "جدولة ذكية للموارد والقاعات لتقليل التعارضات وتحسين الاستخدام.",
          "تتبع مهام دوري وتحكم في حالات الموافقات بضغطة واحدة.",
        ]}
        onLearnMore={handleLearnMore}
        variant="grid"
        imageSrc={aboutImg}
      />

      {/* Timeline removed */}

      <FeatureDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} variant={activeVariant} />
    </div>
  );
}

export default Features;
