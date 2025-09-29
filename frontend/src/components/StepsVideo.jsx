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
import { Iphone } from "@/registry/magicui/iphone";
import mopPoster1 from "../assets/mopPoster1.png"
import mopPoster2 from "../assets/mopPoster2.png"
import mopPoster3 from "../assets/mopPoster3.png"
import mopPoster4 from "../assets/mopPoster4.png"
import mopPoster5 from "../assets/mopPoster5.png"
import mopVid1 from "../assets/Videos/mopVid1.webm"
import mopVid2 from "../assets/Videos/mopVid2.webm"
import mopVid3 from "../assets/Videos/mopVid3.webm"
import mopVid4 from "../assets/Videos/mopVid4.webm"
import mopVid5 from "../assets/Videos/mopVid5.webm"
import { FaDesktop, FaMobileAlt } from "react-icons/fa";

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
          title: "الملف الشخصي والمساعدة",
          desc: "قم بتحديث صورتك الشخصية، إعادة تعيين كلمة المرور، تصفح مركز المساعدة، أو استخدم المساعد الذكي للحصول على دعم فوري.",
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

  // Web vs Mobile preview mode
  const [mode, setMode] = useState("web"); // 'web' | 'mobile'

  // Simple test videos for mobile view (portrait-friendly). Replace with real ones later.
  const mobileVideos = useMemo(
    () => [
      {
        src: mopVid1,
        poster: mopPoster1,
      },
      {
        src: mopVid2,
        poster: mopPoster2,
      },
      {
        src: mopVid3,
        poster: mopPoster3,
      },
      {
        src: mopVid4,  // Using mopVid5 as a fallback for the 4th video
        poster: mopPoster4,
      },
      {
        src: mopVid5,  // Using mopVid5 as a fallback for the 5th video
        poster: mopPoster5,  // Using mopPoster4 as a fallback for the 5th poster
      },
    ],
    []
  );

  const selectedVideos = mode === "web" ? dataVideos : mobileVideos;

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
  }, [active, mode]);

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
    // Ensure progress shows complete, stop RAF, and switch immediately
    setProgress(1);
    cancelAnimationFrame(progressUpdateRef.current);
    setIsVideoReady(false);
    setActive((prev) => (prev + 1) % dataSteps.length);
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
        <h1 className="text-5xl  md:text-6xl font-extrabold !text-[#3271b1] drop-shadow-sm ">
          {title}
        </h1>
        <p className="text-xl !mt-8 text-[#3271b1] font-semibold">{subtitle}</p>
      </div>

      {/* View mode toggle */}
      <div className="mb-4 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setMode("web")}
          className={[
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-all cursor-pointer",
            mode === "web"
              ? "bg-blue-600 text-white border-blue-700 shadow"
              : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50",
          ].join(" ")}
        >
          <FaDesktop />
          حاسب
        </button>
        <button
          type="button"
          onClick={() => setMode("mobile")}
          className={[
            "inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-bold transition-all cursor-pointer",
            mode === "mobile"
              ? "bg-blue-600 text-white border-blue-700 shadow"
              : "bg-white text-blue-900 border-blue-200 hover:bg-blue-50",
          ].join(" ")}
        >
          <FaMobileAlt />
         محمول
        </button>
      </div>

     {/* Steps cards - full bleed, 5 columns, with gaps between cards */}
     <div className="-mx-4 sm:-mx-10 md:-mx-16 lg:-mx-24 xl:-mx-40 mb-5">
       <div className="rounded-2xl shadow-[0_18px_60px_RGBA(0,0,0,.12)] bg-white/70 backdrop-blur-sm">
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
                      // Show only the active card on small screens; show all on >= sm
                      isActive ? "block" : "hidden",
                      "sm:block",
                      "group relative text-right px-3 py-3 sm:px-4 sm:py-4 transition-all duration-300 rounded-xl bg-white border-2 border-transparent shadow-[0_10px_24px_RGBA(59,130,246,0.14)]",
                      isActive ? "ring-1 ring-[#3b82f6]/40 scale-[1.02]" : "hover:border-[#3b82f6] hover:scale-[1.01]",
                    ].join(" ")}
                  >
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

      {/* Video panel (Web or Mobile) */}
      {mode === "web" ? (
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
              poster={selectedVideos[active % selectedVideos.length]?.poster}
              src={selectedVideos[active % selectedVideos.length]?.src}
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
      ) : (
        <div className="relative flex justify-center">
          <Iphone>
            <video
              ref={videoRef}
              className={`h-full w-full object-cover object-top transition-all duration-500 ${isVideoReady ? 'opacity-100 scale-100' : 'opacity-90 scale-105'}`}
              playsInline
              muted
              autoPlay
              preload="auto"
              poster={selectedVideos[active % selectedVideos.length]?.poster}
              src={selectedVideos[active % selectedVideos.length]?.src}
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
          </Iphone>
        </div>
      )}

      {/* Hidden preloader videos to warm up cache for smooth switching */}
      <div aria-hidden="true" className="hidden">
        {dataVideos.map((v, idx) => (
          <video key={idx} src={v.src} preload="auto" muted playsInline />
        ))}
      </div>
      <div aria-hidden="true" className="hidden">
        {mobileVideos.map((v, idx) => (
          <video key={idx} src={v.src} preload="auto" muted playsInline />
        ))}
      </div>
    </section>
  );
}
