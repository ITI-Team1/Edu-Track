import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import psuLogo from "../assets/psu-logo.svg";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  // Determine if the current user has permission to view admin log entries
  const hasLogPermission = Boolean(
    user?.groups?.some(
      (g) => Array.isArray(g?.permissions) && g.permissions.some(
        (p) => p?.codename === "view_logentry" || (typeof p?.name === "string" && p.name.toLowerCase().includes("log entry"))
      )
    )
  );

  useEffect(() => {
    const SHOW_AT = 60;
    const HIDE_AT = 20;
    let ticking = false;

    const onScroll = () => {
      const y = window.scrollY || 0;
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        setScrolled(prev => {
          if (!prev && y > SHOW_AT) return true;
          if (prev && y < HIDE_AT) return false;
          return prev;
        });
        ticking = false;
      });
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <nav
      className={`!sticky !top-0 !z-50 !flex !items-center !justify-between !transition-all !duration-200 
        ${scrolled
          ? "!py-2 !px-6 !shadow-lg !bg-gradient-to-r !from-slate-900/75 !via-slate-800/85 !to-gray-800/95"
          : "!py-1 md:py-6 !px-4 !shadow-md !bg-gradient-to-r !from-slate-900 !via-slate-800/95 !to-gray-800"
        }`}
    >
            {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="!flex !flex-col md:!hidden !p-2 !rounded hover:!bg-indigo-500/10 !transition"
        aria-label="Toggle navigation menu"
      >
        <span
          className={`!h-[3px] !w-6 !rounded !bg-white/90 !mb-1 !transition-transform !duration-300 
            ${isMenuOpen ? "!rotate-45 !translate-y-[6px]" : ""}`}
        />
        <span
          className={`!h-[3px] !w-6 !rounded !bg-white/90 !mb-1 !transition-opacity !duration-300 
            ${isMenuOpen ? "!opacity-0" : ""}`}
        />
        <span
          className={`!h-[3px] !w-6 !rounded !bg-white/90 !transition-transform !duration-300 
            ${isMenuOpen ? "!-rotate-45 !-translate-y-[6px]" : ""}`}
        />
      </button>

      {/* Brand */}
      <div className="!flex !items-center">
        <Link
          to="/"
          onClick={closeMenu}
          className="!flex !items-center !p-0 !rounded-md !transition-all !duration-200  hover:!-translate-y-0.5"
        >
          <img
            src={psuLogo}
            alt="جامعة بورسعيد"
            className={`!transition-all !duration-200 !drop-shadow-md
              ${scrolled ? "!h-10" : "h-10 !md:h-14"} !w-auto !brightness-110 !contrast-110`}
          />
          <h4
            className={` !font-cairo !font-semibold !text-white/90 !transition-all !duration-200
              ${scrolled ? "text-[1.35rem] md:text-2xl" : " text-2xl md:text-[1.7rem] "}`}
          >
            جامعة بورسعيد
          </h4>
        </Link>
      </div>


      {/* Center Menu */}
      <div
        className={`!flex !my-1 !flex-col !p-1.5 md:!flex-row md:!items-center md:!gap-8 !text-white/90 !font-cairo 
        !bg-gradient-to-r !from-slate-800/90 !to-slate-900/80 md:!bg-transparent 
        !rounded-2xl  md:!static !absolute !top-full !left-0 !right-0
        md:!opacity-100 md:!visible !transition-all !duration-300 !backdrop-blur-lg
        ${isMenuOpen ? "!opacity-100 !visible !translate-y-0" : "!opacity-0 !invisible !-translate-y-4"}
        md:!translate-y-0 md:!flex`}
      >
        {(
          isAuthenticated
            ? [
                { to: "/", label: "الصفحة الرئيسية" },
                { to: "/dashboard", label: "لوحة التحكم" },
                { to: "/about", label: "حول" },
                { to: "/help", label: "مركز المساعدة" },
                { to: "/contact", label: "اتصل بنا" },
                ...(hasLogPermission ? [{ to: "/logs", label: "السجلات" }] : []),
              ]
            : [
                { to: "/", label: "الرئيسية" },
                { to: "/features", label: "المميزات" },
                { to: "/about", label: "حول" },
                { to: "/help", label: "مركز المساعدة" },
                { to: "/contact", label: "اتصل بنا" },
              ]
        ).map(link => (
          // make active link with text-blue-500 and bg-blue-500/10
          <Link
            key={link.to}
            to={link.to}
            onClick={() => {
              closeMenu();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className={`!px-4 !py-3 md:!py-2 md:!px-3 !text-center !text-lg md:!text-base 
              !font-semibold !rounded-md !relative !transition-all !duration-200 
                hover:!bg-indigo-500/10 hover:!text-white hover:!-translate-y-0.5 
                ${(link.to === "/" ? location.pathname === "/" : location.pathname.startsWith(link.to)) ? "!text-blue-500 !bg-blue-500/10" : ""}`}

          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* Auth section */}
      <div className="!flex !items-center !gap-4">
        {!isAuthenticated ? (
          <Link
            to="/login"
            onClick={closeMenu}
            className="!px-3 !py-1 md:!px-5 md:!py-2 !rounded-md !bg-slate-600 !text-white  !shadow-md 
              !transition-all !duration-200 hover:!bg-slate-500 hover:!-translate-y-0.5 !text-sm md:!text-base"
          >
            تسجيل الدخول
          </Link>
        ) : (
          <div className="!flex !items-center !gap-3">
            <Link
              to="/profile"
              onClick={closeMenu}
              className="!flex !items-center !justify-center w-9 h-9 md:!w-10 md:!h-10 !rounded-full 
                !bg-gradient-to-br !from-indigo-400/20 !to-indigo-500/20 !shadow-md 
                hover:!scale-110 hover:!-translate-y-0.5 hover:!shadow-lg !transition-all !duration-200 "
            >
              {user?.picture ? (
                <img
                  className="!w-full !h-full !rounded-full !object-cover"
                  src={user.picture}
                  alt="صورة الحساب"
                />
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M12 12C14.21 12 16 10.21 16 8C16 5.79 14.21 4 12 4C9.79 4 8 5.79 8 8C8 10.21 9.79 12 12 12ZM12 14C9.33 14 4 15.34 4 18V20H20V18C20 15.34 14.67 14 12 14Z"
                    fill="currentColor"
                  />
                </svg>
              )}
            </Link>
            <button
              onClick={() => {
                logout();
                closeMenu();
              }}
              className="!flex cursor-pointer !items-center !justify-center w-8 h-8 md:!w-10 md:!h-10 !rounded-full !bg-white/10 !text-white 
                !shadow-md hover:!bg-red-600/25 hover:!scale-110 hover:!-translate-y-0.5 hover:!shadow-lg !transition-all !duration-200"
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M15 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 17l5-5-5-5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 12H3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
