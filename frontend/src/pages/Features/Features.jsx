import React from "react";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import psu2 from "../../assets/psu2.jpg";
import aboutImg from "../../assets/login.jpeg";

// Minimal cn util (no Tailwind required here, kept for parity)
const cn = (...classes) => classes.filter(Boolean).join(" ");

function StepsBar({ steps }) {
  return (
    <div className="relative mx-auto my- flex items-center justify-center gap-4 sm:gap-8 max-w-4xl flex-wrap" aria-label="feature steps">
      <div className="absolute inset-x-16 top-1/2 h-0.5 bg-gradient-to-r from-blue-600 to-blue-800 transform -translate-y-[12px] opacity-35 hidden sm:block" />
      {steps.map((s, i) => (
        <div key={i} className="relative z-10 text-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 rounded-full bg-gradient-to-r from-blue-600 via-blue-800 to-blue-700 border-2 border-white/20 flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200 hover:-translate-y-1">
            <span className="text-2xl sm:text-3xl lg:text-4xl" role="img" aria-label="icon">{s.icon}</span>
          </div>
          <div className=" text-blue-900 font-bold text-sm sm:text-base">{s.title}</div>
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
    <div className="fixed inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <motion.div
        className="w-full max-w-4xl max-h-[86vh] bg-white border border-gray-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-800 to-blue-700"></div>
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-200">
          <h3 className="text-lg sm:text-xl font-bold text-blue-900 m-0">{data.header}</h3>
          <button 
            className="text-blue-900 text-2xl hover:bg-blue-50 rounded-lg p-2 transition-colors duration-200" 
            onClick={onClose} 
            aria-label="إغلاق"
          >
            ×
          </button>
        </div>
        <div className="p-4 sm:p-6 overflow-auto flex-1">
          <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6 shadow-lg">
            <h4 className="text-lg font-bold text-blue-900 mb-3">تفاصيل الميزة</h4>
            <div className="text-blue-900 text-base sm:text-lg leading-relaxed">
              {data.lines.map((line, i) => (
                <div key={i} className="mb-2">{line}</div>
              ))}
            </div>
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
  
  const variantGradients = {
    charts: "from-blue-500/20 via-blue-600/30 to-blue-800/40",
    cards: "from-gray-800/60 to-slate-700/60", 
    table: "from-slate-900/65 to-slate-800/65",
    grid: "from-blue-500/25 via-slate-900/60 to-blue-800/40"
  };

  return (
    <section className="my-8"> 
      <motion.div
        className={cn(
          "grid gap-4 sm:gap-6 bg-white border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative",
          dirFlip ? "  lg:grid-cols-[1fr_1.1fr]" : "lg:grid-cols-[1.1fr_1fr]",
          "lg:grid-cols-2 grid-cols-1"
        )}
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        whileHover={{ y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 22 }}
      >
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-blue-800 to-blue-700 absolute top-0 left-0 right-0"></div>
        
        <div className={cn(
          "p-4 sm:p-6 lg:p-8 text-blue-900 order-2 lg:order-1",
          dirFlip && "lg:order-2"
        )}>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black !text-blue-900 mb-4 sm:mb-6 leading-tight">
            {title}
          </h2>
          <motion.ul
            className="list-none m-0 p-0 mb-5"
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
                className="relative py-2 px-3 mb-2 text-sm sm:text-base lg:text-lg text-blue-900 font-semibold rounded-lg transition-all duration-200 hover:bg-white/10 hover:-translate-x-1 whitespace-normal overflow-visible text-clip"
                variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                whileHover={{ x: -2 }}
                transition={{ type: "spring", stiffness: 240, damping: 18 }}
              >
                {p}
              </motion.li>
            ))}
          </motion.ul>
          <button 
            type="button" 
            className="btn-main w-full md:w-auto md:px-8 md:text-lg " 
            onClick={() => onLearnMore?.(variant)}
          >
            تعرّف أكثر
          </button>
        </div>
        
        <div className={cn(
          "!p-4 hidden md:block   lg:order-2",
          dirFlip && "lg:order-1"
        )}>
          <div className={cn(
            "h-full min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]  rounded-xl bg-gradient-to-br border border-dashed border-white/20 relative overflow-hidden",
            variantGradients[variant]
          )}>
            {imageSrc && (
              <img 
                className="absolute inset-0 w-full h-full object-cover brightness-75 saturate-90 opacity-55" 
                src={imageSrc} 
                alt={imageAlt || "feature"} 
              />
            )}
            <div className="absolute inset-0 bg-black/35 pointer-events-none"></div>
            <div className="relative  grid grid-rows-3 grid-cols-4 gap-2.5 p-2.5 h-full z-10">
              {items.map((label, i) => (
                <motion.div
                  key={i}
                  className={cn(
                    "rounded-xl bg-white/8 border border-white/12 backdrop-blur-sm min-h-[60px] sm:min-h-[70px] shadow-lg overflow-hidden transition-all duration-200 hover:shadow-xl hover:bg-white/12 relative",
                    i === 0 && "col-span-4 row-span-1", // First item spans full width
                    i >= 1 && i <= 2 && "col-span-2 row-span-1", // Items 2-3 span half width each
                    i >= 3 && "col-span-2 row-span-1" // Items 4-5 span half width each
                  )}
                  initial={{ opacity: 0, scale: 0.98 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{ y: -3 }}
                  transition={{ type: "spring", stiffness: 280, damping: 22 }}
                >
                  <span className="absolute inset-1 flex items-center justify-center text-center text-white font-bold text-xs sm:text-sm lg:text-xl leading-tight shadow-lg">
                    {label}
                  </span>
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

  const steps = [
    { icon: "🏛️", title: "المنصة" },
    { icon: "✍️", title: "المحتوى" },
    { icon: "📈", title: "المراقبة" },
  ];

  return (
    <div className="!text-gray-800 font-sans p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto min-h-screen" dir="rtl">
      {/* Header */}
      <motion.h1 
        className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl !text-blue-900 font-black text-center mb-6 relative"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
      >
        المميزات
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 lg:translate-y-[12px] w-24 h-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"></div>
      </motion.h1>
      
      <motion.p 
        className="text-center text-base sm:text-lg lg:text-xl mb-8 sm:mb-12 text-gray-700 max-w-4xl mx-auto leading-relaxed"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
      >
        مرحبًا بك في منصة <strong className="text-blue-900">جامعة بورسعيد</strong> – حيث نمنحك السيطرة الكاملة على تنظيم الجدول الدراسي ومتابعة الأداء الأكاديمي بكل سهولة!
      </motion.p>

      <StepsBar steps={steps} />

      {/* Media banner */}
      <motion.div 
        className="relative w-full h-48 sm:h-64 lg:h-80 rounded-2xl overflow-hidden my-8 sm:my-12 shadow-2xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <img className="w-full h-full object-cover brightness-75 saturate-95" src={psu2} alt="منصة جامعة بورسعيد" />
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 to-blue-900/65"></div>
        <div className="absolute inset-0 flex flex-col justify-center p-6 sm:p-8 text-white text-right">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-black mb-2 text-shadow-lg">
            تعليم ذكي مدعوم بالبيانات
          </h2>
          <p className="text-sm sm:text-base lg:text-lg opacity-95">
            واجهات تفاعلية، تحليلات لحظية، وإدارة متكاملة للبرامج والموارد.
          </p>
        </div>
      </motion.div>

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

      <FeatureDetailsModal open={modalOpen} onClose={() => setModalOpen(false)} variant={activeVariant} />
    </div>
  );
}

export default Features;
