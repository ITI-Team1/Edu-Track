import React, { useState, useEffect, useMemo, useRef } from 'react';
import { FiUsers, FiUser, FiEdit, FiPlus, FiTrash2, FiBarChart2, FiGrid, FiActivity, FiAlertCircle, FiArrowUp, FiArrowDown, FiClock } from 'react-icons/fi';
import CountUp from 'react-countup';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from "../../services/api";
import "./Logs.css";
import { useAuth } from "../../context/AuthContext";
import LogsHero from '../../components/LogsHero';
import Spinner from '../../components/Spinner';

// Helper Functions
const getActionFlagLabel = (flag) => {
  switch (flag) {
    case 1: return "إضافة";
    case 2: return "تعديل";
    case 3: return "حذف";
    default: return "غير معروف";
  }
};

const timeAgo = (iso) => {
  if (!iso) return 'غير متوفر';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return 'تاريخ غير صالح';
  const diff = Math.max(0, Date.now() - d.getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `${mins} د`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} س`;
  const days = Math.floor(hrs / 24);
  return `${days} يوم`;
};

const getInitials = (name) => (name || '?').slice(0, 2).toUpperCase();
const safeDay = (v) => {
  if (!v) return '';
  const d = new Date(v);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
};

// Build human readable details message from a log entry
const parseChangeMessage = (msg) => {
  if (!msg) return null;
  try {
    const trimmed = typeof msg === 'string' ? msg.trim() : msg;
    if (typeof trimmed === 'string' && trimmed.startsWith('[')) {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length > 0) {
        const part = arr[0];
        if (part && typeof part === 'object') {
          if ('added' in part) return 'تمت الإضافة';
          if ('deleted' in part) return 'تم الحذف';
          if ('changed' in part && part.changed && Array.isArray(part.changed.fields)) {
            return `غيّر الحقول: ${part.changed.fields.join(', ')}`;
          }
        }
      }
    }
  } catch (_) {
    // no-op, fall back to raw
  }
  return typeof msg === 'string' ? msg : null;
};

const formatActionDetails = (log) => {
  const username = log?.user?.username || 'مستخدم';
  const modelLabel = log?.content_type ? `${log.content_type.app_label}.${log.content_type.model}` : 'عنصر';
  const objectRepr = log?.object_repr || '';
  const changeSummary = parseChangeMessage(log?.change_message);

  switch (log?.action_flag) {
    case 1:
      return `قام ${username} بإضافة ${modelLabel} '${objectRepr}'`;
    case 2: {
      const details = changeSummary ? ` - ${changeSummary}` : '';
      return `قام ${username} بتعديل ${modelLabel} '${objectRepr}'${details}`;
    }
    case 3:
      return `قام ${username} بحذف ${modelLabel} '${objectRepr}'`;
    default:
      return `قام ${username} بإجراء على ${modelLabel} '${objectRepr}'`;
  }
};

// Reusable Components
const StatCard = ({ icon, title, value, children, className = '' }) => (
  <div className={`stat-card light ${className}`}>
    <div className="stat-header">
      {icon && <div className="logs-stat-icon">{icon}</div>}
      <div className="stat-title">{title}</div>
    </div>
    {value !== null && <div className="stat-value"><CountUp end={value} /></div>}
    {children}
  </div>
);

const _ProgressRing = ({ percent, color = '#0284C7', strokeWidth = 4 }) => {
  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" className="progress-ring">
      <circle stroke="#E2E8F0" fill="transparent" strokeWidth={strokeWidth} r={radius} cx="24" cy="24" />
      <circle stroke={color} fill="transparent" strokeWidth={strokeWidth} strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" r={radius} cx="24" cy="24" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      <text x="50%" y="50%" textAnchor="middle" dy=".3em" className="progress-text">{`${percent}%`}</text>
    </svg>
  );
};

// Page-Specific Components
const _AnimatedHeader = () => (
  <div className="logs-header minimal">
    <h1>لوحة تحكم السجلات</h1>
  </div>
);



const ActionDistributionCard = ({ logs }) => {
    const actionData = useMemo(() => {
        const adds = logs.filter(l => l.action_flag === 1).length;
        const edits = logs.filter(l => l.action_flag === 2).length;
        const deletes = logs.filter(l => l.action_flag === 3).length;
        return [
            { key: 'add', name: 'إضافة', value: adds, color: '#10B981' },
            { key: 'edit', name: 'تعديل', value: edits, color: '#3B82F6' },
            { key: 'delete', name: 'حذف', value: deletes, color: '#EF4444' },
        ];
    }, [logs]);

    const total = actionData.reduce((s, a) => s + a.value, 0) || 0;

    return (
        <StatCard icon={<FiPlus />} title="توزيع الإجراءات" value={null} className="donut-chart-card donut-two-col">
            <div className="donut-left">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={actionData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={36} outerRadius={64} fill="#8884d8" paddingAngle={6}>
                    {actionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="donut-right">
              <ul className="donut-stats-list">
                {actionData.map(item => (
                  <li key={item.key} className="donut-stat-item">
                    <span className="dot" style={{background: item.color}} />
                    <div className="stat-meta">
                      <div className="stat-name">{item.name}</div>
                      <div className="stat-sub">{item.value} ({total === 0 ? '0%' : Math.round((item.value/total)*100) + '%'})</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
        </StatCard>
    );
};

const TopUsersCard = ({ logs }) => {
  const topUsers = useMemo(() => {
    const userCounts = logs.reduce((acc, log) => {
      const username = log.user?.username || 'غير معروف';
      acc[username] = (acc[username] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(userCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [logs]);

  return (
    <StatCard icon={<FiUsers />} title="أكثر المستخدمين نشاطًا" value={null} className="list-card">
      <ul className="stat-list">
        {topUsers.map(([name, count]) => (
          <li key={name} className="top-user-item">
            <div className="left">
              <div className="user-icon"><FiUser /></div>
              <span className="user-name">{name}</span>
            </div>
            <b className="user-count"><CountUp end={count} /></b>
          </li>
        ))}
      </ul>
    </StatCard>
  );
};

const TrendChart = ({ logs }) => {
  const trendData = useMemo(() => {
    const last14Days = Array.from({ length: 14 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return { date: d.toISOString().slice(0, 10), count: 0 };
    }).reverse();

    logs.forEach(log => {
      const logDate = safeDay(log.action_time);
      const dayData = last14Days.find(d => d.date === logDate);
      if (dayData) dayData.count += 1;
    });
    return last14Days.map(d => ({ name: d.date.slice(5), activity: d.count }));
  }, [logs]);

  return (
    <StatCard icon={<FiBarChart2 />} title="النشاط خلال آخر 14 يومًا" value={null} className="trend-chart-card">
        <ResponsiveContainer width="100%" height={250}>
            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(15,23,42,0.1)"/>
                <XAxis dataKey="name" tick={{fill: '#475569'}} />
                <YAxis tick={{fill: '#475569'}}/>
                <Tooltip />
                <Line type="monotone" dataKey="activity" stroke="#0284C7" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 8 }}/>
            </LineChart>
        </ResponsiveContainer>
    </StatCard>
  );
};

const LogsTable = ({ logs, loadMore, hasMore, loadingMore }) => {
  const getActionIcon = (flag) => {
    switch (flag) {
        case 1: return <FiPlus className="icon-add" />;
        case 2: return <FiEdit className="icon-edit" />;
        case 3: return <FiTrash2 className="icon-delete" />;
        default: return <FiAlertCircle />;
    }
  };

  const wrapperRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    const rootEl = wrapperRef.current;
    if (!sentinel || !rootEl) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          if (hasMore && !loadingMore && typeof loadMore === 'function') loadMore();
        }
      });
    }, { root: rootEl, rootMargin: '120px' });

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loadMore]);

  return (
    <div className="stat-card light table-card">
      <div className="stat-title">السجلات</div>
      <div className="table-wrapper" ref={wrapperRef}>
        <table className="logs-table light modern">
          <thead><tr><th>المستخدم</th><th>النموذج</th><th>الإجراء</th><th>التفاصيل</th><th>آخر نشاط</th></tr></thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td><div className="user-cell"><div className="avatar">{getInitials(log.user?.username)}</div><div className="user-meta"><div className="name">{log.user?.username || 'N/A'}</div><div className="sub" title={log.object_repr}>{log.object_repr}</div></div></div></td>
                <td><span className="mono">{log.content_type ? `${log.content_type.app_label}.${log.content_type.model}`: 'N/A'}</span></td>
                <td><div className="action-cell">{getActionIcon(log.action_flag)}<span className={`logs-badge ${log.action_flag === 1 ? 'add' : log.action_flag === 2 ? 'edit' : 'delete'}`}>{getActionFlagLabel(log.action_flag)}</span></div></td>
                <td><div className="details-cell">{formatActionDetails(log)}</div></td>
                <td>{timeAgo(log.action_time)}</td>
              </tr>
            ))}
          </tbody>
        </table>
  <div ref={sentinelRef} className="table-sentinel" />
  {loadingMore && <div className="loading-more">تحميل المزيد...</div>}
      </div>
    </div>
  );
};
 
// Main Logs Component
const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user, loading: authLoading } = useAuth();

  const PAGE_SIZE = 10;

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLoading(false);
      setError("Please log in to view logs.");
      return;
    }

    const fetchPage = async (offset = 0) => {
      try {
        const resp = await fetch(`${api.baseURL}/logs/?limit=${PAGE_SIZE}&offset=${offset}`, {
          method: 'GET',
          headers: api.getAuthHeaders(),
          cache: 'no-store',
        });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (Array.isArray(data)) {
          setLogs(data);
          setHasMore(false);
        } else if (data.results) {
          setLogs(data.results);
          setHasMore(Boolean(data.next));
        } else {
          const list = data.results || data.data || [];
          setLogs(list);
          setHasMore(list.length === PAGE_SIZE);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch logs.");
      } finally {
        setLoading(false);
      }
    };

    fetchPage(0);
  }, [user, authLoading]);

  const stats = useMemo(() => {
    const totalLogs = logs.length;
    const uniqueUsers = new Set(logs.map(l => l?.user?.id).filter(Boolean)).size;
    const todayStr = new Date().toISOString().slice(0, 10);
    const actionsToday = logs.filter(l => safeDay(l?.action_time) === todayStr).length;
    return { totalLogs, uniqueUsers, actionsToday };
  }, [logs]);

  // extra derived metrics for the richer stat cards
  const extra = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    const yesterdayCount = logs.filter(l => safeDay(l?.action_time) === yesterdayStr).length;
    const actionsToday = stats.actionsToday || 0;
    const pctChange = yesterdayCount === 0 ? (actionsToday > 0 ? 100 : 0) : Math.round(((actionsToday - yesterdayCount) / Math.max(1, yesterdayCount)) * 100);

    const avgPerUser = Math.round(stats.totalLogs / Math.max(1, stats.uniqueUsers));
    const uniqueUsersToday = new Set(logs.filter(l => safeDay(l?.action_time) === todayStr).map(l => l.user?.id).filter(Boolean)).size;

    const lastAction = logs.reduce((acc, l) => {
      if (!l?.action_time) return acc;
      return (!acc || new Date(l.action_time) > new Date(acc.action_time)) ? l : acc;
    }, null);

    return { yesterdayCount, pctChange, avgPerUser, uniqueUsersToday, lastAction };
  }, [logs, stats.actionsToday, stats.totalLogs, stats.uniqueUsers]);

  const loadMore = async () => {
    if (!hasMore || loadingMore) return;
    setLoadingMore(true);
    try {
      const offset = logs.length;
      const resp = await fetch(`${api.baseURL}/logs/?limit=${PAGE_SIZE}&offset=${offset}`, {
        method: 'GET',
        headers: api.getAuthHeaders(),
        cache: 'no-store',
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const data = await resp.json();
      if (Array.isArray(data)) {
        setLogs(prev => [...prev, ...data]);
        setHasMore(false);
      } else if (data.results) {
        setLogs(prev => [...prev, ...data.results]);
        setHasMore(Boolean(data.next));
      } else {
        const list = data.results || data.data || [];
        setLogs(prev => [...prev, ...list]);
        setHasMore(list.length === PAGE_SIZE);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to load more logs.");
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) return <div className="loading-container">
<span className='text-blue-800'>اخميل المزيد</span>
    <Spinner size='lg' color='primary' />
  </div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="logs-container">
      <LogsHero stats={stats} />
      
      <div className="logs-content">
        <div className="stats-grid">
          <StatCard icon={<FiGrid />} title="إجمالي السجلات" value={stats.totalLogs} className="large">
            <div className="stat-foot">
              <div className="foot-item">
                <span className={`logs-trend ${extra.pctChange >= 0 ? 'up' : 'down'}`}>
                  {extra.pctChange >= 0 ? <FiArrowUp className="up" /> : <FiArrowDown className="down" />}
                </span>
                <span>{Math.abs(extra.pctChange)}% مقارنة بالأمس</span>
              </div>
              <div className="foot-item">
                <FiClock /><span>آخر نشاط: {timeAgo(extra.lastAction?.action_time)}</span>
              </div>
            </div>
          </StatCard>

          <StatCard icon={<FiUsers />} title="المستخدمون النشطون" value={stats.uniqueUsers} className="large">
            <div className="stat-foot">
              <div className="foot-item"><FiUsers /><span>{extra.uniqueUsersToday} نشط اليوم</span></div>
              <div className="foot-item"><span className="muted">متوسط لكل مستخدم:</span><b style={{ marginLeft: 6 }}>{extra.avgPerUser}</b></div>
            </div>
          </StatCard>

          <StatCard icon={<FiActivity />} title="نشاط اليوم" value={stats.actionsToday} className="large">
            <div className="stat-foot">
              <div className="foot-item">
                <span className={`logs-trend ${extra.pctChange >= 0 ? 'up' : 'down'}`}>
                  {extra.pctChange >= 0 ? <FiArrowUp className="up" /> : <FiArrowDown className="down" />}
                </span>
                <span>{Math.abs(extra.pctChange)}% مقارنة بالأمس</span>
              </div>
              <div className="foot-item"><FiClock /><span>آخر إجراء: {timeAgo(extra.lastAction?.action_time)}</span></div>
            </div>
          </StatCard>

          <div className="action-dist-wrapper">
            <ActionDistributionCard logs={logs} />
          </div>
          <div className="top-users-wrapper">
            <TopUsersCard logs={logs} />
          </div>
          <div className="chart-wrapper">
            <TrendChart logs={logs} />
          </div>
        </div>

  <LogsTable logs={logs} loadMore={loadMore} hasMore={hasMore} loadingMore={loadingMore} />
      </div>
    </div>
  );
};

export default Logs;
