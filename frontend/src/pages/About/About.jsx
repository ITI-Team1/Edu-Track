import React, { useEffect, useRef } from 'react';
import './about.css';

function About() {
  const visionRef = useRef(null);
  const missionRef = useRef(null);
  const historyRef = useRef(null);
  const timelineRef = useRef(null);

  useEffect(() => {
    const observerOptions = {
      threshold: 0.12,
      // start the reveal a bit earlier so work happens off-screen
      rootMargin: '0px 0px -20% 0px',
    };

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          // reveal once then stop observing to avoid repeated work
          obs.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const elements = [visionRef.current, missionRef.current, historyRef.current, timelineRef.current];
    elements.forEach(el => {
      if (el) observer.observe(el);
    });

    // Also observe timeline items for individual animations
    const timelineItems = document.querySelectorAll('.about-edu-timeline-item');
    timelineItems.forEach((item, index) => {
      if (!item) return;
      observer.observe(item);
      // light stagger using transitionDelay, cheaper than keyframes
      item.style.transitionDelay = `${index * 60}ms`;
    });

    return () => observer.disconnect();
  }, []);

  return (
    <div className="about-edu-page ">
      {/* Hero Section */}
      <section className="about-edu-hero  ">
        <div className="about-edu-hero-content ">
          <h1 className="about-edu-title">عن جامعة بورسعيد</h1>
          <p className="about-edu-subtitle">
            منارة العلم والمعرفة ونموذج ترسيخ القيم المجتمعية
          </p>
          <div className="about-edu-hero-decoration">
            <div className="about-edu-lighthouse"></div>
          </div>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="about-edu-vision-mission !p-1 md:!p-5 md:!mt-10 ">
        <div className="about-edu-container">
          <div className="about-edu-section-header !py-0 !mb-0 md:!my-5  md:!py-5 ">
            <h2>الرؤية، الرسالة، والأهداف</h2>
          </div>
          
          <div className="about-edu-cards-grid  grid !grid-cols-2  !gap-4 !mb-4 md:!mb-10 ">
            {/* Vision Card */}
            <div className="about-edu-card about-edu-vision-card" ref={visionRef}>
              
              <h3 className="!text-right !text-lg !leading-relaxed md:!text-2xl">الرؤية</h3>
              <p className="!text-right !text-sm !leading-relaxed md:!text-lg">
                ترغب جامعة بورسعيد أن تكون منارةً للعلم والمعرفة، ونموذجًا لترسيخ القيم المجتمعية، 
                رائدةً فى مواكبة التغيرات العالمية ذات تصنيف دولي متقدم
              </p>
            </div>

            {/* Mission Card */}
            <div className="about-edu-card about-edu-mission-card" ref={missionRef}>
              
              <h3 className="!text-right !text-lg !leading-relaxed md:!text-2xl">الرسالة</h3>
              <p className="!text-right !text-sm !leading-relaxed md:!text-lg">
                تسعى جامعة بورسعيد إلى تحقيق التنمية المستدامة والتميز في الأداء المؤسسي، 
                عبر تقديم أطر تعليمية متطورة، وفقا لمعايير الجودة، ومتطلبات سوق العمل، 
                وأبحاث علمية تسهم في بناء الاقتصاد المعرفي بشراكة مجتمعية وعالمية
              </p>
            </div>
          </div>

          {/* Goals Section */}
          <div className="about-edu-goals !p-2 !mt-2" ref={historyRef}>
            <h3 className="!text-lg !leading-relaxed md:!text-2xl mt-2 !mb-2">الأهداف</h3>
            <div className="about-edu-goals-grid grid !grid-cols-2 md:!grid-cols-3 md:!p-2  !gap-4">
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number">01</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg">التطوير المستمر لبرامج التعليم والدراسات العليا لضمان جودة الخريجين</p>
              </div>
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number">02</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg">تطوير برامج متعددة التخصصات تلبي متطلبات سوق العمل المحلي والإقليمي</p>
              </div>
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number">03</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg">زيادة التصنيف العالمي للجامعة</p>
              </div>
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number">04</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg">تطوير الخدمات الإلكترونية لتصبح جامعة ذكية</p>
              </div>
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number">05</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg">تطوير وزيادة الخدمات المجتمعية من خلال الاستخدام الفعال للإمكانيات المتوفرة</p>
              </div>
              <div className="about-edu-goal-item !flex flex-col !items-center !gap-2">
                <span className="about-edu-goal-number !text-center !text-sm !leading-relaxed md:!text-lg">06</span>
                <p className="!text-center !text-sm !leading-relaxed md:!text-lg ">دعم ريادة الأعمال والابتكار والأنشطة الطلابية التي تحقق التميز للجامعة</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* History Section */}
      <section className="about-edu-history !p-1 md:!p-5 md:!mt-0 ">
        <div className="about-edu-container">
          <div className="about-edu-section-header md:!my-5  md:!py-5 !mb-0">
            <h2>تاريخ الجامعة</h2>
          </div>
          
          <div className="about-edu-history-content">
            <div className="about-edu-history-text !w-full !p-0 md:!p-5 md:flex md:flex-col !items-center md:!gap-5">
              <p className="!text-center !text-sm !leading-relaxed md:!text-2xl ">
                أنشأت جامعة بورسعيد عام ۲۰۱۰ بعد ان كانت فرع من جامعة قناة السويس بمدينة بورسعيد 
                وتم انفصال الفرع بكلياته القائمة حينذاك ليصبح جامعة بورسعيد. وتاريخياً تم إنشاء أول 
                مؤسسات تعليمية عليا بالمدينة تمنح درجة البكالوريوس في عام ١٩٦١.
              </p>
              <p className="!text-center !text-sm !leading-relaxed md:!text-2xl ">
                في عام ١٩٧٦ عندما صدر القرار الجمهوري بإنشاء جامعة قناة السويس انضم المعهدين 
                لجامعة قناة السويس، وتغير أسم كل منهم ليصبح كلية، وهم كلية الهندسة ببورسعيد 
                وكلية التجارة ببورسعيد.
              </p>
              <p className="!text-center !text-sm !leading-relaxed md:!text-2xl ">
                وفي ٢٤ فبراير ۲۰۱۰م صدر قرار جمهوري بتحويل فرع جامعة قناة السويس ببورسعيد 
                إلى جامعة مستقلة، جامعة بورسعيد، وتزامن مع ميلاد الجامعة ميلاد كلية جديدة هي 
                كلية الآداب، حيث أنشئت في يوليو ۲۰۱۱م.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="about-edu-timeline !p-1 md:!p-5 !mb-0 md:!mt-0 " ref={timelineRef}>
        <div className="about-edu-container !p-1 md:!p-5 md:!mt-0 !mb-0 ">
          <div className="about-edu-section-header md:!my-0  md:!py-5 !mb-5">
            <h2>الخط الزمني للجامعة</h2>
          </div>
          
          <div className="about-edu-timeline-container">
            <div className="about-edu-timeline-item">
              <div className="about-edu-timeline-year">1975</div>
              <div className="about-edu-timeline-content">
                <h4>كلية واحدة</h4>
                <p>كلية الهندسة - انشئت عام 1961 تحت مسمى المعهد العالى الصناعى لتصبح كلية الهندسة عام 1975 وتتبع جامعة حلوان</p>
              </div>
            </div>

            <div className="about-edu-timeline-item">
              <div className="about-edu-timeline-year">1976</div>
              <div className="about-edu-timeline-content">
                <h4>كلية واحدة</h4>
                <p>كلية الهندسة - عام 1976 أصبحت الكلية تتبع جامعة قناة السويس</p>
              </div>
            </div>

            <div className="about-edu-timeline-item">
              <div className="about-edu-timeline-year">1998</div>
              <div className="about-edu-timeline-content">
                <h4>4 كليات</h4>
                <p>ارتفع عدد الكليات الى أربع كليات</p>
              </div>
            </div>

            <div className="about-edu-timeline-item">
              <div className="about-edu-timeline-year">2010</div>
              <div className="about-edu-timeline-content">
                <h4>9 كليات</h4>
                <p>انشئت جامعة بورسعيد عام 2010 بعد وصل عدد كلياتها الى 9 كليات</p>
              </div>
            </div>

            <div className="about-edu-timeline-item">
              <div className="about-edu-timeline-year">2022</div>
              <div className="about-edu-timeline-content">
                <h4>14 كلية</h4>
                <p>والآن، عدد كليات جامعة بورسعيد وصل الى 14 كلية</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Centers Section */}
      <section className="about-edu-centers !p-1 md:!p-5 md:!mb-5 md:!mt-0 ">
        <div className="about-edu-container  md:!mt-0 !mb-0 ">
          <div className="about-edu-section-header md:!my-0  md:!py-5 !mb-5">
            <h2>المراكز والوحدات</h2>
          </div>
          
          <div className="about-edu-centers-grid !grid !grid-cols-2 !gap-4 md:!grid-cols-3 !md:gap-6 !p-1">
            <div className="about-edu-center-item">
              <h4>مركز نظم وتكنولوجيا المعلومات</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>مركز تنمية قدرات أعضاء هيئة التدريس والقيادات</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>مركز توكيد الجودة والاعتماد</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>مركز التخطيط الاستراتيجى</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>مركز القياس والتقويم</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>مركز ريادة الأعمال والابتكار</h4>
            </div>
            <div className="about-edu-center-item ">
              <h4>مركز محو الأمية وتعليم الكبار</h4>
            </div>
            <div className="about-edu-center-item">
              <h4>نادى ريادة الأعمال</h4>
            </div>
            <div className="about-edu-center-item col-span-2 md:col-span-1">
              <h4>مكتب دعم الابتكار ونقل وتسويق التكنولوجيا</h4>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
