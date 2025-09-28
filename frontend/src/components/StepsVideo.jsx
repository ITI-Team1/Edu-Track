import React, { useMemo, useRef, useState, useEffect } from "react";
import "../styles/steps-video.css";
import logVid from "../assets/Videos/loginVid.webm";
import courseVid from "../assets/Videos/courseVid.webm"
import schedualeVid from "../assets/Videos/schedualevid.webm"
import examVid from "../assets/Videos/examschedualeVid.webm"
import helpVid from "../assets/Videos/helpVid.webm"
import poster1 from "../assets/poster1.png"
import poster2 from "../assets/poster2.png"
import poster3 from "../assets/poster3.png"
import poster4 from "../assets/poster4.png"
import poster5 from "../assets/poster5.png"
/**
 * StepsVideo
 * A dark, glossy steps component paired with a preview video.
 * - Click steps to switch the video clip.
 * - Tailwind-first styling with a tiny CSS glow layer.
 *
 * Usage:
 * <StepsVideo />
 * or
 * <StepsVideo steps={[{title:'Deploy',desc:'...'}]} videos={[{src:'...', poster:'...'}]} />
 */
export default function StepsVideo({
  title = "How it works",
  subtitle = "A quick demo of the flow.",
  steps,
  videos,
}) {
  // Default demo content if none is provided
  const demo = useMemo(
    () => ({
       steps: [
        {
          title: "تسجيل الدخول",
          desc: "سجّل دخولك إلى حسابك بسهولة وأمان.",
        },
        {
          title: "المقررات والاستبيانات",
          desc: "اطلع على مقرراتك الدراسية وقم بتعبئة الاستبيانات المطلوبة.",
        },
        {
          title: "الجدول الدراسي",
          desc: "تصفح جدولك الأسبوعي المتغير مع تحديثات فورية لأي تغييرات.",
        },
        {
          title: "الامتحانات والدرجات",
          desc: "تابع مواعيد امتحاناتك واطلع على درجاتك فور ظهورها.",
        },
        {
          title: "المساعدة والدعم",
          desc: "استخدم المساعد الذكي أو تصفح الأسئلة الشائعة للحصول على المساعدة الفورية.",
        },
      ],
      videos: [
        {
          // Short, public domain test video
          src:
            logVid,
          poster:
            poster1,
        },
        {
          src:
            courseVid,
          poster:
          poster2,
        },
        {
          src:
            schedualeVid,
          poster:
          poster3,
        },
        {
          src:
          examVid ,
          poster:
          poster4,
        },
        {
          src:
            helpVid, 
          poster:
          poster5,
        },
      ],
    }),
    []
  );

  const dataSteps = steps?.length ? steps : demo.steps;
  const dataVideos = videos?.length ? videos : demo.videos;

  const [active, setActive] = useState(0);
  const videoRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0 -> 1 for current video
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const rafRef = useRef(0);
  const progressUpdateRef = useRef(0);

  // Optimized progress update with throttling
  const updateProgress = () => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    const ratio = v.currentTime / v.duration;
    const newProgress = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;
    setProgress(newProgress);
    
    // Use requestAnimationFrame for smooth updates
    progressUpdateRef.current = requestAnimationFrame(updateProgress);
  };

  const handleVideoLoadStart = () => {
    setIsVideoLoading(true);
    setIsVideoReady(false);
  };

  const handleVideoCanPlay = () => {
    setIsVideoLoading(false);
    setIsVideoReady(true);
  };

  const handleVideoError = () => {
    setIsVideoLoading(false);
    setIsVideoReady(false);
  };

  useEffect(() => {
    // When active changes, reset progress and attempt autoplay muted
    setProgress(0);
    setIsVideoLoading(true);
    setIsVideoReady(false);
    
    const v = videoRef.current;
    if (!v) return;
    
    v.pause();
    v.load();
    
    const play = async () => {
      try {
        await v.play();
      } catch (_) {
        // Autoplay might fail on some browsers; it's fine.
      }
    };
    play();
  }, [active]);

  const handlePlay = () => {
    cancelAnimationFrame(progressUpdateRef.current);
    progressUpdateRef.current = requestAnimationFrame(updateProgress);
  };

  const handlePause = () => {
    cancelAnimationFrame(progressUpdateRef.current);
  };

  const handleTimeUpdate = () => {
    // Fallback for browsers with throttled RAF in background tabs
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    const ratio = v.currentTime / v.duration;
    const newProgress = ratio > 1 ? 1 : ratio < 0 ? 0 : ratio;
    setProgress(newProgress);
  };

  const handleEnded = () => {
    setProgress(1);
    setTimeout(() => {
      setActive((prev) => (prev + 1) % dataSteps.length);
    }, 150); // subtle delay for UX
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(rafRef.current);
      cancelAnimationFrame(progressUpdateRef.current);
    };
  }, []);

  return (
    <section
      dir="rtl"
      className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 md:px-8 py-12 md:py-16"
      aria-label="steps demo"
    >
      {/* Background grid & glow */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_60%)]" />

      <div className="mb-6 md:mb-8 text-center ">
        <h1 className="text-5xl  md:text-6xl font-extrabold !text-blue-900 drop-shadow-sm ">
          {title}
        </h1>
        <p className="text-xl mt-2 text-blue-800/80 font-semibold">{subtitle}</p>
      </div>

     
      {/* Steps cards - full bleed, 5 columns, with gaps between cards */}
      <div className="-mx-4 sm:-mx-10 md:-mx-16 lg:-mx-24 xl:-mx-40 mb-5">
        <div className="rounded-2xl shadow-[0_18px_60px_rgba(0,0,0,.12)] bg-white/70 backdrop-blur-sm">
          <div className="relative rounded-[18px] overflow-hidden">
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 p-1.5 sm:p-2 md:p-3">
              {dataSteps.map((s, i) => {
                const isActive = i === active;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setActive(i)}
                    className={[
                      "group relative text-right px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300 rounded-xl bg-white border-2 border-transparent shadow-[0_10px_24px_rgba(59,130,246,0.14)]",
                      isActive ? "ring-1 ring-[#3b82f6]/40 scale-[1.02]" : "hover:border-[#3b82f6] hover:scale-[1.01]",
                    ].join(" ")}
                  >
                    {/* Top gradient bar like About cards */}
                    <span className="pointer-events-none absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#06b6d4]" />

                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div
                        className={[
                          "mt-0.5 grid h-7 w-7 place-items-center rounded-lg text-xs font-black transition-all duration-300",
                          isActive
                            ? "bg-gradient-to-br from-[#3b82f6] to-[#1e3a8a] text-white scale-110"
                            : "bg-gradient-to-br from-gray-200 to-gray-300 text-[#1e3a8a] group-hover:scale-105",
                        ].join(" ")}
                      >
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className={[
                          "text-base sm:text-lg font-extrabold transition-all duration-300 leading-tight",
                          isActive ? "!text-[#1e3a8a] text-lg sm:text-xl" : "text-[#1e3a8a] group-hover:text-[#3b82f6]"
                        ].join(" ")}>
                          {s.title}
                        </h3>
                        {s.desc && (
                          <p className="mt-1 text-sm sm:text-base text-[#6b7280] leading-relaxed line-clamp-2 transition-colors duration-300 group-hover:text-[#4b5563]">
                            {s.desc}
                          </p>
                        )}
                      </div>
                    </div>
                    {/* Per-card progress bar */}
                    <div className="mt-3 h-1.5 rounded-full bg-gray-200 overflow-hidden">
                      <div
                        className="h-full transition-all duration-100 ease-out bg-gradient-to-r from-[#1e3a8a] via-[#3b82f6] to-[#06b6d4]"
                        style={{ 
                          width: `${i === active ? Math.round(progress * 100) : 0}%`,
                          transform: i === active ? 'scaleY(1.1)' : 'scaleY(1)',
                          transition: 'width 0.1s ease-out, transform 0.2s ease-out'
                        }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Video panel */}
      <div className="relative rounded-xl md:rounded-2xl overflow-hidden border border-white/5 bg-black/60 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,.55)] -mx-4 sm:-mx-10 md:-mx-16 lg:-mx-24 xl:-mx-40">
        <div className="absolute -inset-6 -z-10 opacity-40 blur-3xl bg-[conic-gradient(from_120deg_at_50%_50%,#6366f1_0%,#22d3ee_30%,transparent_60%)]" />

        {/* Subtle overlay only (spinner removed for smoother feel) */}
        {isVideoLoading && (
          <div className="absolute inset-0 z-10 bg-black/20 transition-opacity duration-300" />
        )}

        {/* Video transition overlay */}
        <div className={`absolute inset-0 z-10 bg-gradient-to-r from-transparent via-white/5 to-transparent transition-opacity duration-500 ${isVideoReady ? 'opacity-0' : 'opacity-100'}`} />

        <div className="w-full aspect-video md:aspect-[21/9]">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover object-top transition-all duration-500 ${isVideoReady ? 'opacity-100 scale-100' : 'opacity-90 scale-105'}`}
            playsInline
            muted
            autoPlay
            preload="auto"
            poster={dataVideos[active % dataVideos.length]?.poster}
            src={dataVideos[active % dataVideos.length]?.src}
            onLoadStart={handleVideoLoadStart}
            onCanPlay={handleVideoCanPlay}
            onError={handleVideoError}
            onPlay={handlePlay}
            onPause={handlePause}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          >
            Your browser does not support the video tag.
          </video>
        </div>
      </div>

      {/* Hidden preloader videos to warm up cache for smooth switching */}
      <div aria-hidden="true" className="hidden">
        {dataVideos.map((v, idx) => (
          <video key={idx} src={v.src} preload="auto" muted playsInline />
        ))}
      </div>
    </section>
  );
}
