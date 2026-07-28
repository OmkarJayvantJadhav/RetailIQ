/*
 * RetailIQ Frontend Application
 * File: Landing.jsx
 * Purpose: React component providing UI layout, state management, or data visualization.
 */
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, ArrowRight, BarChart3, ShoppingCart, Users, Package,
  Bell, Brain, MapPin, Store, TrendingUp, Shield, Eye, Settings,
  ChevronRight, Activity, Globe, Database
} from 'lucide-react';
import '../Landing.css';
import Logo from '../components/Logo';

const STATS = [
  { label: 'Orders Processed', value: '1M+', icon: ShoppingCart },
  { label: 'Cities Covered', value: '50+', icon: MapPin },
  { label: 'Active SKUs', value: '15,000+', icon: Package },
  { label: 'Daily Analytics', value: '500K+', icon: Activity },
];

const CAPABILITIES = [
  {
    icon: BarChart3,
    title: 'Sales Analytics',
    desc: 'Transform raw data into vivid, interactive visualizations that reveal hidden revenue opportunities.',
    color: '#3b82f6',
  },
  {
    icon: Brain,
    title: 'AI Forecasting',
    desc: 'Leverage advanced machine learning to accurately predict demand spikes and optimize procurement.',
    color: '#8b5cf6',
  },
  {
    icon: Database,
    title: 'Real-time Inventory',
    desc: 'Maintain perfect stock levels with live tracking and intelligent, automated reorder triggers.',
    color: '#10b981',
  },
  {
    icon: Users,
    title: 'Customer Insights',
    desc: 'Understand your shoppers better with deep behavioral segmentation and lifetime value metrics.',
    color: '#f59e0b',
  },
];

const ROLES = [
  {
    icon: Shield,
    title: 'Admin',
    desc: 'Complete platform control. Manage system configurations, assign user roles, and oversee operations.',
    color: '#3b82f6',
  },
  {
    icon: Settings,
    title: 'Manager',
    desc: 'The operational powerhouse. Analyze trends, adjust inventory, and generate forecasting reports.',
    color: '#8b5cf6',
  },
  {
    icon: Eye,
    title: 'Viewer',
    desc: 'Data transparency. Secure, read-only access to critical business dashboards and performance metrics.',
    color: '#10b981',
  },
];

function useInView(threshold = 0.15) {
  const [ref, setRef] = useState(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, threshold]);
  return [setRef, inView];
}

const Landing = () => {
  const navigate = useNavigate();
  const [heroRef, heroInView] = useInView(0.1);
  const [capRef, capInView] = useInView(0.1);
  const [roleRef, roleInView] = useInView(0.1);

  // Mouse parallax for hero image
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const handleMouseMove = (e) => {
    const { innerWidth, innerHeight } = window;
    const x = (e.clientX / innerWidth - 0.5) * 15; 
    const y = (e.clientY / innerHeight - 0.5) * 15;
    setMousePos({ x, y });
  };

  return (
    <div className="landing-page" onMouseMove={handleMouseMove}>
      {/* Dynamic Background Effects */}
      <div className="bg-orbs">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
      </div>

      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <div className="landing-logo">
            <Logo size={36} />
            <span className="landing-logo-text">
              <span style={{ color: 'var(--accent-blue)' }}>Retail</span>
              <span style={{ color: 'white' }}>IQ</span>
            </span>
          </div>
          <div className="nav-actions">
            <button className="btn-ghost" onClick={() => navigate('/login')}>Sign In</button>
            <button className="btn-primary" onClick={() => navigate('/login')}>
              Get Started <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </nav>

      <section className="hero-section" ref={heroRef}>
        <div className="hero-grid">
          <div className={`hero-content ${heroInView ? 'animate-in' : ''}`}>
            <h1 className="hero-title">
              Intelligence that <br />
              <span className="text-gradient">Accelerates</span> Growth.
            </h1>
            <p className="hero-desc">
              Transform complex data into actionable strategies. RetailIQ unifies your sales, inventory, and forecasting to give you total command over your retail ecosystem.
            </p>
            <div className="hero-actions">
              <button className="btn-primary btn-large" onClick={() => navigate('/login')}>
                Launch Platform <ArrowRight size={20} />
              </button>
            </div>
            
            <div className="hero-stats">
              {STATS.map((s, i) => (
                <div key={i} className="hero-stat-item">
                  <s.icon size={22} style={{ color: 'var(--accent-blue)', marginBottom: '0.75rem' }} />
                  <div className="stat-val">{s.value}</div>
                  <div className="stat-lbl">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          
          <div className={`hero-visual ${heroInView ? 'animate-in' : ''}`}>
            <div 
              className="hero-image-wrapper"
              style={{
                transform: `perspective(1000px) rotateY(${mousePos.x}deg) rotateX(${-mousePos.y}deg)`,
              }}
            >
              <div className="hero-image-glow"></div>
              <img src="/hero-mockup.png" alt="RetailIQ Dashboard" className="hero-image" />
              
              {/* Floating UI elements */}
              <div className="floating-card float-1">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <TrendingUp size={16} color="#10b981" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>Revenue Up</span>
                </div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#10b981' }}>+24.8%</div>
              </div>
              
              <div className="floating-card float-2">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <Brain size={16} color="#8b5cf6" />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>AI Forecast</span>
                </div>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Demand spike expected</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section" ref={capRef}>
        <div className="section-header">
          <h2 className="section-title">Powerful Capabilities. Limitless Scale.</h2>
          <p className="section-subtitle">Equip your organization with the tools needed to analyze trends, predict demand, and streamline operations.</p>
        </div>
        <div className="features-grid">
          {CAPABILITIES.map((c, i) => (
            <div 
              key={c.title} 
              className={`feature-card ${capInView ? 'animate-in' : ''}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              <div className="feature-icon-wrapper" style={{ 
                background: `${c.color}15`, 
                border: `1px solid ${c.color}30`,
                boxShadow: `0 0 20px 2px ${c.color}15` 
              }}>
                <c.icon size={26} color={c.color} />
              </div>
              <h3>{c.title}</h3>
              <p>{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="roles-section" ref={roleRef}>
        <div className="roles-container">
          <div className="roles-header">
            <h2 className="section-title">Secure access for every stakeholder</h2>
            <p className="section-subtitle">Enterprise-grade role-based access control (RBAC) ensures your data remains secure while empowering your team.</p>
          </div>
          <div className="roles-grid">
            {ROLES.map((r, i) => (
              <div 
                key={r.title} 
                className={`role-card ${roleInView ? 'animate-in' : ''}`}
                style={{ transitionDelay: `${i * 100}ms` }}
                onClick={() => navigate('/login')}
              >
                <div className="role-icon" style={{ background: r.color, boxShadow: `0 4px 15px ${r.color}40` }}>
                  <r.icon size={24} color="white" />
                </div>
                <div className="role-info">
                  <h3>{r.title}</h3>
                  <p>{r.desc}</p>
                </div>
                <div className="role-arrow">
                  <ChevronRight size={20} color="var(--text-muted)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-logo">
          <Logo size={36} />
          <span className="landing-logo-text" style={{ fontSize: '1.2rem' }}>
            <span style={{ color: 'var(--accent-blue)' }}>Retail</span>
            <span style={{ color: 'white' }}>IQ</span>
          </span>
        </div>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          © {new Date().getFullYear()} RetailIQ Enterprise. Internal use only.
        </p>
      </footer>
    </div>
  );
};

export default Landing;
