import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './home.css';
import Slider from '../../components/Slider/Slider.jsx';
import uniLogo from '../../assets/psu-logo.svg';
import heroImg from '../../assets/psu2.jpg';
import mtisLogo from '../../assets/facuilites/MTIS.png';
import medLogo from '../../assets/facuilites/med.png';
import phaLogo from '../../assets/facuilites/pha.jpg';
import sciLogo from '../../assets/facuilites/sci.png';
import nurLogo from '../../assets/facuilites/nur.jpg';
import artsLogo from '../../assets/facuilites/arts.jpg';
import eduLogo from '../../assets/facuilites/edu.jpg';
import lawLogo from '../../assets/facuilites/law.jpg';
import comLogo from '../../assets/facuilites/com.JPG';
import phyeduLogo from '../../assets/facuilites/phyedu.jpg';
import engLogo from '../../assets/facuilites/eng.jpg';
import edunaw3Logo from '../../assets/facuilites/edunaw3.jpg';
import edukidsLogo from '../../assets/facuilites/edukids.jpg';
import phytherLogo from '../../assets/facuilites/phytherapy.jpg';
import StepsVideo from '../../components/StepsVideo.jsx';

function Home() {
  const { isAuthenticated, user } = useAuth();
  
  // Determine best display name: full name > first name > username > email local-part
  const displayName = (() => {
    if (!user) return '';
    const first = (user.first_name || '').trim();
    const last = (user.last_name || '').trim();
    if (first && last) return `${first} ${last}`; // full name
    if (first) return first;                      // first name only
    if (user.username) return user.username;      // username
    if (user.email) return user.email.split('@')[0]; // email local-part
    return '';
  })();

  // Typewriter for the hero title
  const titleText = 'جامعة بورسعيد';
  const [typedTitle, setTypedTitle] = useState('');
  useEffect(() => {
    setTypedTitle('');
    let i = 0;
    const speed = 60;
    const id = window.setInterval(() => {
      i += 1;
      setTypedTitle(titleText.slice(0, i));
      if (i >= titleText.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, []);

  // Typewriter for the hero subtitle
  const subTitle = 'منصة تعليمية متكاملة لطلاب الجامعات';
  const [typedSubTitle, setTypedSubTitle] = useState('');
  useEffect(() => {
    setTypedSubTitle('');
    let i = 0;
    const speed = 60;
    const id = window.setInterval(() => {
      i += 1;
      setTypedSubTitle(subTitle.slice(0, i));
      if (i >= subTitle.length) window.clearInterval(id);
    }, speed);
    return () => window.clearInterval(id);
  }, []);

  // Animated counters for stats (start when visible)
  const [stats, setStats] = useState({ programs: 0, staff: 0, halls: 0, realtime: 0 });
  const statsRef = useRef(null);
  const [statsStarted, setStatsStarted] = useState(false);

  useEffect(() => {
    if (statsStarted) return;
    const el = statsRef.current;
    if (!el) return;

  const animate = (key, to, duration = 4400) => {
      const start = performance.now();
      const from = 0;
      const step = (t) => {
        const elapsed = t - start;
        const p = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        const val = Math.round(from + (to - from) * eased);
        setStats((s) => ({ ...s, [key]: val }));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsStarted(true);
          animate('programs', 20, 4000);
          animate('staff', 150, 5000);
          animate('halls', 30, 3400);
          animate('realtime', 100, 3600);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [statsStarted]);
  
  // Faculties side badges (7 + 7). Fill the rest later.
  const faculties = [
    { name: 'تكنولوجيا الادراة ونظم المعلومات', logo: mtisLogo },
    { name: 'كلية الهندسة', logo: engLogo },
    { name: 'كلية الطب', logo: medLogo },
    { name: 'كلية التجارة', logo: comLogo },
    { name: 'كلية التربية', logo: eduLogo },
    { name: 'كلية الآداب', logo: artsLogo },
    { name: 'كلية العلوم', logo: sciLogo },
    { name: 'كلية التربية الرياضية', logo: phyeduLogo },
    { name: 'كلية الحقوق', logo: lawLogo },
    { name: 'كلية الصيدلة', logo: phaLogo },
    { name: 'كلية العلاج الطبيعي', logo: phytherLogo },
    { name: 'كلية التمريض', logo: nurLogo },
    { name: 'كلية التربية للطفولة المبكرة', logo: edukidsLogo },
    { name: 'كلية التربية النوعية', logo: edunaw3Logo },

  ];

  return (
    <div className="home" dir="rtl">
      <section
        className="hero-section "
        aria-label="قسم المقدمة"
        style={{ backgroundImage: `url(${heroImg})` }}
      >
        {/* Faculty side badges (hover to append logo + name) */}
        <div className="hero-faculties" aria-hidden="false" aria-label="كليات">
          <div className="stack-left">
            {faculties.slice(0, 7).map((f, idx) => (
              <div className="faculty-card" data-side="left" key={`left-${idx}`}>
                <div className="badge" aria-hidden={!f.name}>
                  {f.logo ? (
                    <img className="badge-logo" src={f.logo} alt="شعار الكلية" />
                  ) : (
                    <div className="badge-logo placeholder" />
                  )}
                </div>
                <div className="info-panel">
                  {f.logo ? (
                    <img className="info-logo" src={f.logo} alt="" />
                  ) : null}
                  <span className="info-name">{f.name}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="stack-right">
            {faculties.slice(7, 14).map((f, idx) => (
              <div className="faculty-card" data-side="right" key={`right-${idx}`}>
                <div className="badge" aria-hidden={!f.name}>
                  {f.logo ? (
                    <img className="badge-logo" src={f.logo} alt="شعار الكلية" />
                  ) : (
                    <div className="badge-logo placeholder" />
                  )}
                </div>
                <div className="info-panel">
                  {f.logo ? (
                    <img className="info-logo" src={f.logo} alt="" />
                  ) : null}
                  <span className="info-name">{f.name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="px-4 pt-16 pb-12 max-w-[960px] mx-auto relative z-[1]">
          <img src={uniLogo} alt="شعار الجامعة" className="!block !mx-auto !mb-4 !h-auto md:w-[260px] sm:w-[130px] w-[110px]" />
          <h1 className="font-cairo !text-white !font-semibold !direction-rtl 
           !mt-1 !mb-3 !text-[2.2rem] sm:!text-[3rem] lg:!text-[4rem]
           ![text-shadow:0_2px_16px_rgba(0,0,0,0.35)]  whitespace-pre-wrap">
            {typedTitle}
            {/* <span className="cursor" aria-hidden="true">|</span> */}
          </h1>
          <p className="hero-subtitle !text-white whitespace-pre-wrap">{typedSubTitle}</p>
          <div className="btn-main !py-2 !px-10 !w-fit !text-center !block !mx-auto">
            {!isAuthenticated ? (
              <Link to="/dashboard" className="">ابدأ التعلّم</Link>
            ) : (
              <Link to="/dashboard" className="">لوحة التحكم</Link>
            )}
          </div>
          <p className="hero-note">
            {isAuthenticated ? (
              <>
                أنت مسجّل الدخول كـ <strong>{displayName || 'مستخدم'}</strong>.
              </>
            ) : (
              <>
                <Link to="/login">سجّل الدخول</Link> لحفظ تقدّمك في التعلّم.
              </>
            )}
          </p>
        </div>
      </section>

      {/* Feature tiles */}
      <StepsVideo
  title="خطواتك للعمل"
   subtitle="ابدأ رحلتك التعليمية بخطوات بسيطة"
/>
      {/* Slider for featured partners */}
      <section className="featured-partners">
        <Slider />
      </section>
    </div>
  );
}

export default Home;