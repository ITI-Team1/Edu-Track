import { motion } from "framer-motion";
import React, { useEffect, useState } from "react";
import { FiUsers, FiActivity, FiClock, FiAlertCircle, FiBarChart2 } from "react-icons/fi";
import statsImg from "../assets/stats.jpg";

// Simple error boundary for the hero section
class HeroErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(_error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Hero section error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI when there's an error
      return (
        <div className="logs-hero fallback">
          <h1>System Activity Dashboard</h1>
          <p>An error occurred while loading the dashboard header.</p>
        </div>
      );
    }

    return this.props.children;
  }
}

function TypeWriter({ texts = [], speed = 80 }) {
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [blink, setBlink] = useState(true);
  const [reverse, setReverse] = useState(false);

  useEffect(() => {
    if (index >= texts.length) return;
    if (subIndex === texts[index].length + 1 && !reverse) {
      const t = setTimeout(() => setReverse(true), 900);
      return () => clearTimeout(t);
    }

    if (reverse && subIndex === 0) {
      const t = setTimeout(() => {
        setIndex((prev) => (prev + 1) % texts.length);
        setReverse(false);
      }, 300);
      return () => clearTimeout(t);
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, speed);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse, texts, speed]);

  useEffect(() => {
    const iv = setInterval(() => setBlink((b) => !b), 500);
    return () => clearInterval(iv);
  }, []);

  return (
    <span className="typewriter-logs">
      {texts[index].slice(0, subIndex)}<span className={`cursor ${blink ? 'blink' : ''}`}>&nbsp;</span>
    </span>
  );
}

function LogsHero({ stats = {} }) {
  return (
    <HeroErrorBoundary>
      <section className="logs-hero" style={{ backgroundImage: `url(${statsImg})` }}>
        <div className="hero-overlay" />
        <div className="hero-header">
          <div className="header-content">
            <FiBarChart2 className="header-icon" />
            <h2>لوحة تحليل النشاط</h2>
          </div>
          <div className="header-actions">
            <button className="action-btn">
              <FiAlertCircle />
              <span>تنبيهات</span>
            </button>
          </div>
        </div>
        <div className="hero-inner">
          <div className="hero-text">
            <div className="hero-badge">سجلات النشاط</div>
            <h1 className="hero-headline">
              <TypeWriter texts={["مراقبة فورية للنشاطات.", "رؤى تفصيلية عن المستخدمين.", "سجلات تدقيق قابلة للتتبع."]} />
            </h1>
            <p className="hero-sub">تتبع جميع الإجراءات والعمليات. تصفح، ابحث، وادفع بتقارير الامتثال والتحليل إلى الأمام.</p>
          </div>

          <div className="hero-stats-cards">
            <motion.div className="hero-stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="stat-icon"><FiUsers /></div>
              <div className="stat-number">{stats.uniqueUsers ?? 0}</div>
              <div className="stat-label">مستخدم نشط</div>
            </motion.div>

            <motion.div className="hero-stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <div className="stat-icon"><FiActivity /></div>
              <div className="stat-number">{stats.totalLogs ?? 0}</div>
              <div className="stat-label">إجمالي الإجراءات</div>
            </motion.div>

            <motion.div className="hero-stat-card" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <div className="stat-icon"><FiClock /></div>
              <div className="stat-number">{stats.actionsToday ?? 0}</div>
              <div className="stat-label">إجراء اليوم</div>
            </motion.div>
          </div>
        </div>
      </section>
    </HeroErrorBoundary>
  );
}

export default LogsHero;
