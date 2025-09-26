import React from "react";
import { Link, useLocation } from "react-router-dom";
import psuLogo from "../assets/psu-logo.svg";

function Footer() {
  const location = useLocation();
  const isDashboard = location.pathname === '/dashboard' || location.pathname.startsWith('/dashboard');

  return (
    <footer className={`!bg-gradient-to-r !from-slate-800 !via-slate-700 !to-slate-600 !border-t-2 !border-blue-500/20 !shadow-lg !py-8 !px-0 !transition-all !duration-300 ${isDashboard ? ' hidden' : ''} max-sm:!py-6`}>
      <div className={`!max-w-6xl !mx-auto !px-8 !grid !grid-cols-1 lg:!grid-cols-2 !gap-12 !items-stretch !min-h-80 !transition-all !duration-300 ${isDashboard ? '!ml-0' : ''} !max-sm:px-4 !max-sm:gap-8 !max-sm:min-h-0`}>
        <div className="!flex !flex-col !h-full">
          <div className="!rounded-xl !overflow-hidden !shadow-lg !flex-1 !h-full hover:-translate-x-1 duration-200">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d54566.947425925944!2d32.279756755357496!3d31.264082394404376!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14f99dc961ff1487%3A0xd647f6053ce7da2!2sPort%20Said%20University!5e0!3m2!1sen!2seg!4v1754331964851!5m2!1sen!2seg"
              width="600"
              height="450"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="!rounded-xl !w-full !h-full !min-h-56 !max-sm:min-h-48"
            ></iframe>
          </div>
          <div className="!flex !justify-center !gap-4 !mt-4">
            {['facebook-f','twitter','instagram','linkedin-in','youtube'].map((icon, i) => (
              <a key={i} href="#" className="!flex !items-center !justify-center !w-9 !h-9 !rounded-full !bg-gradient-to-br !from-blue-500/20 !to-indigo-500/20 !border !border-blue-500/30 !text-white/90 !no-underline !transition-all !duration-300 !text-lg hover:!bg-gradient-to-br hover:!from-blue-500/30 hover:!to-indigo-500/30 hover:!-translate-y-0.5 hover:!shadow-lg hover:!text-white" title={icon}>
                <i className={`fa-brands fa-${icon}`}></i>
              </a>
            ))}
          </div>
        </div>

        <div className="!flex !flex-col !gap-6 !p-4 !bg-gradient-to-br !from-white/5 !to-white/2 !rounded-2xl !border-2 !border-blue-500/20 hover:translate-x-1 duration-200 !backdrop-blur-md !shadow-2xl !h-full !justify-between">
          <div className="!text-center !p-4 !bg-gradient-to-br !from-blue-500/10 !to-indigo-500/10 !rounded-xl !border !border-blue-500/20 ">
            <div className="!flex !items-center !justify-center !gap-0 !mb-1 !max-sm:flex-col !max-sm:gap-1">
              <img 
                src={psuLogo} 
                alt="جامعة بورسعيد" 
                className="!w-12 !h-12 !max-sm:w-10 !max-sm:h-10 !filter !brightness-120 !contrast-120 !drop-shadow-md !transition-all !duration-300 hover:!scale-110 hover:!brightness-130 hover:!contrast-130 hover:!drop-shadow-lg"
              />
              <h3 className="!text-white/95 !text-2xl !max-sm:text-xl !font-bold !m-0 !text-shadow-md">جامعة بورسعيد</h3>
            </div>
            <p className="!text-white/80 !m-0 !text-base !font-medium">منصة تتبع تعليمي شاملة</p>
            <p className="!text-white/80 !m-0 !text-base !font-medium">Port Said University</p>
          </div>

          <div className="!grid !grid-cols-1 sm:!grid-cols-2 !gap-6 !p-2">
            {[
              {title:"روابط سريعة", links:[
                {to:"/about", text:"حول الجامعة"},
                {to:"/contact", text:"اتصل بنا"},
                {to:"/help", text:"مركز المساعدة"}
              ]},
              {title:"الخدمات", links:[
                {to:"/dashboard", text:"لوحة التحكم"},
                {to:"/features", text:"المميزات"},
                // {to:"/register", text:"التسجيل"}
              ]}
            ].map((sec, si)=>(
              <div key={si} className="!bg-gradient-to-br !from-white/3 !to-white/1 !rounded-xl !p-4 !border !border-white/10 !transition-all !duration-300 hover:!bg-gradient-to-br hover:!from-white/5 hover:!to-white/2 hover:!border-blue-500/30 hover:!-translate-y-0.5 hover:!shadow-lg">
                <h4 className="!text-white/95 !mb-3 !text-lg !font-semibold !text-center !border-b-2 !border-blue-500/30 !pb-1">{sec.title}</h4>
                <ul className="!list-none !p-0 !m-0">
                  {sec.links.map((l,li)=>(
                    <li key={li} className="!mb-2 !text-center">
                      <Link to={l.to} className="!text-white/80 !no-underline !transition-all !duration-300 !text-sm !font-medium !py-1 !px-3 !rounded-lg !block hover:!text-white/95 hover:!bg-blue-500/10 hover:!translate-x-1 hover:!shadow-md">{l.text}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="!text-center !mt-6 !pt-4 !border-t !border-white/10">
        <p className="!text-white/70 !m-0 !text-sm">&copy; 2025 جامعة بورسعيد. جميع الحقوق محفوظة.</p>
      </div>
    </footer>
  );
}

export default Footer;
