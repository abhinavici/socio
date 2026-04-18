import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";

const PHONE_SCENES = [
  { label: "Your Feed", color: "#e8f5f0", accent: "#1a7a6e", screen: "feed" },
  { label: "Real-time Chat", color: "#fdf0e6", accent: "#e8843a", screen: "chat" },
  { label: "Your Profile", color: "#f0eefa", accent: "#7c5cbf", screen: "profile" },
  { label: "Notifications", color: "#fff3f3", accent: "#c43d3d", screen: "notif" },
];

const MARQUEE_ITEMS = [
  "Follow Friends","Share Moments","Live Chat","Like Posts",
  "Explore Feed","Comment","Your Profile","Real-time",
  "Connect","Share Stories","Notifications","Build Community",
];

const STATS = [
  { value: 100, suffix: "%", label: "Start Exploring" },
  { value: 4, suffix: " features", label: "Core experiences" },
  { value: 60, suffix: "fps", label: "Smooth & fast" },
  { value: 1, suffix: " space", label: "For everything social" },
];

const ACTIVITY_FEED = [
  { avatar: "linear-gradient(135deg,#c8ece2,#1a7a6e)", name: "alex.m", action: "liked your photo", time: "2s ago", icon: "❤️" },
  { avatar: "linear-gradient(135deg,#f5e6cc,#e8843a)", name: "sara_k", action: "started following you", time: "14s ago", icon: "👤" },
  { avatar: "linear-gradient(135deg,#d4c8f0,#7c5cbf)", name: "jay.doe", action: "commented: \"amazing!\"", time: "1m ago", icon: "💬" },
  { avatar: "linear-gradient(135deg,#ffc8c8,#c43d3d)", name: "nina.w", action: "liked your post", time: "2m ago", icon: "❤️" },
  { avatar: "linear-gradient(135deg,#c8ece2,#1a7a6e)", name: "tom_s", action: "shared your story", time: "5m ago", icon: "🔁" },
  { avatar: "linear-gradient(135deg,#f5e6cc,#e8843a)", name: "priya.r", action: "replied to your comment", time: "8m ago", icon: "💬" },
];

// ── Particle engine ──────────────────────────────────────────
function useParticles(canvasRef) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let raf;
    let particles = [];
    const mouse = { x: -1000, y: -1000 };

    const resize = () => {
      canvas.width = canvas.offsetWidth * devicePixelRatio;
      canvas.height = canvas.offsetHeight * devicePixelRatio;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(devicePixelRatio, devicePixelRatio);
    };

    const spawnParticles = () => {
      const count = Math.floor((canvas.offsetWidth * canvas.offsetHeight) / 8000);
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        r: Math.random() * 1.8 + 0.4,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        alpha: Math.random() * 0.45 + 0.12,
        color: Math.random() > 0.5 ? "26,122,110" : "232,132,58",
      }));
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      particles.forEach((p, i) => {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) { p.vx += (dx / dist) * 0.28; p.vy += (dy / dist) * 0.28; }
        p.vx *= 0.97; p.vy *= 0.97;
        p.x = (p.x + p.vx + w) % w;
        p.y = (p.y + p.vy + h) % h;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${p.alpha})`;
        ctx.fill();
        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const ddx = p.x - q.x; const ddy = p.y - q.y;
          const d = Math.sqrt(ddx * ddx + ddy * ddy);
          if (d < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(26,122,110,${0.1 * (1 - d / 110)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y); ctx.stroke();
          }
        }
      });
      raf = requestAnimationFrame(draw);
    };

    const onMouse = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onResize = () => { resize(); spawnParticles(); };
    resize(); spawnParticles(); draw();
    window.addEventListener("resize", onResize);
    window.addEventListener("mousemove", onMouse);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("mousemove", onMouse);
    };
  }, [canvasRef]);
}

// ── Animated counter ─────────────────────────────────────────
function Counter({ value, suffix }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef();
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      let start = 0;
      const step = value / 50;
      const timer = setInterval(() => {
        start += step;
        if (start >= value) { setDisplay(value); clearInterval(timer); }
        else setDisplay(Math.floor(start));
      }, 28);
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [value]);
  return <span ref={ref}>{display}{suffix}</span>;
}

// ── Scroll reveal ────────────────────────────────────────────
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll("[data-reveal]");
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add("revealed"); obs.unobserve(e.target); }
      });
    }, { threshold: 0.1 });
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, []);
}

// ── Phone Screen SVGs ────────────────────────────────────────
function FeedScreen() {
  return (
    <g>
      <rect x="10" y="10" width="160" height="28" rx="6" fill="#e8f5f0" />
      <circle cx="26" cy="24" r="8" fill="#c8ece2" />
      <rect x="40" y="18" width="60" height="6" rx="3" fill="#1a7a6e" opacity="0.6" />
      <rect x="40" y="28" width="40" height="4" rx="2" fill="#1a7a6e" opacity="0.3" />
      <circle cx="160" cy="24" r="8" fill="#1a7a6e" opacity="0.2" />
      <rect x="10" y="46" width="160" height="95" rx="10" fill="white" />
      <circle cx="26" cy="60" r="8" fill="#c8ece2" />
      <rect x="40" y="55" width="50" height="6" rx="3" fill="#1a1410" opacity="0.5" />
      <rect x="40" y="65" width="35" height="4" rx="2" fill="#7a6e66" opacity="0.4" />
      <defs>
        <linearGradient id="fg1" x1="0" y1="0" x2="160" y2="50" gradientUnits="userSpaceOnUse">
          <stop stopColor="#c8ece2" /><stop offset="1" stopColor="#f5e6cc" />
        </linearGradient>
      </defs>
      <rect x="10" y="76" width="160" height="50" rx="6" fill="url(#fg1)" />
      <rect x="10" y="132" width="60" height="6" rx="3" fill="#1a1410" opacity="0.3" />
      <circle cx="152" cy="135" r="6" fill="#e8843a" opacity="0.8" />
      <rect x="10" y="148" width="160" height="50" rx="10" fill="white" opacity="0.5" />
      <circle cx="26" cy="162" r="8" fill="#f5e6cc" />
      <rect x="40" y="157" width="70" height="6" rx="3" fill="#1a1410" opacity="0.3" />
    </g>
  );
}

function ChatScreen() {
  return (
    <g>
      <rect x="10" y="10" width="160" height="28" rx="6" fill="#fdf0e6" />
      <circle cx="26" cy="24" r="8" fill="#f5e6cc" />
      <rect x="40" y="18" width="55" height="6" rx="3" fill="#e8843a" opacity="0.7" />
      <rect x="80" y="48" width="90" height="24" rx="10" fill="#e8843a" opacity="0.85" />
      <rect x="85" y="55" width="75" height="6" rx="3" fill="white" opacity="0.8" />
      <rect x="10" y="80" width="85" height="24" rx="10" fill="#f3f0eb" />
      <rect x="16" y="87" width="68" height="6" rx="3" fill="#3d3530" opacity="0.5" />
      <rect x="70" y="112" width="100" height="24" rx="10" fill="#e8843a" opacity="0.85" />
      <rect x="75" y="119" width="85" height="6" rx="3" fill="white" opacity="0.8" />
      <rect x="10" y="144" width="70" height="24" rx="10" fill="#f3f0eb" />
      <rect x="16" y="151" width="55" height="6" rx="3" fill="#3d3530" opacity="0.5" />
      <rect x="10" y="175" width="50" height="18" rx="9" fill="#f3f0eb" />
      <circle cx="22" cy="184" r="3" fill="#7a6e66" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0s" />
      </circle>
      <circle cx="33" cy="184" r="3" fill="#7a6e66" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.3s" />
      </circle>
      <circle cx="44" cy="184" r="3" fill="#7a6e66" opacity="0.5">
        <animate attributeName="opacity" values="0.5;1;0.5" dur="1s" repeatCount="indefinite" begin="0.6s" />
      </circle>
      <rect x="10" y="198" width="140" height="22" rx="11" fill="white" />
      <rect x="154" y="198" width="16" height="22" rx="11" fill="#e8843a" />
    </g>
  );
}

function ProfileScreen() {
  return (
    <g>
      <rect x="10" y="10" width="160" height="60" rx="10" fill="#f0eefa" />
      <circle cx="90" cy="30" r="14" fill="#d4c8f0" />
      <rect x="55" y="49" width="70" height="7" rx="3" fill="#7c5cbf" opacity="0.6" />
      <rect x="10" y="78" width="46" height="28" rx="8" fill="white" />
      <rect x="62" y="78" width="46" height="28" rx="8" fill="white" />
      <rect x="114" y="78" width="56" height="28" rx="8" fill="white" />
      <rect x="16" y="83" width="34" height="8" rx="4" fill="#7c5cbf" opacity="0.5" />
      <rect x="68" y="83" width="34" height="8" rx="4" fill="#7c5cbf" opacity="0.5" />
      <rect x="120" y="83" width="44" height="8" rx="4" fill="#7c5cbf" opacity="0.5" />
      <rect x="18" y="94" width="28" height="5" rx="2" fill="#7a6e66" opacity="0.3" />
      <rect x="70" y="94" width="28" height="5" rx="2" fill="#7a6e66" opacity="0.3" />
      <rect x="122" y="94" width="38" height="5" rx="2" fill="#7a6e66" opacity="0.3" />
      <rect x="10" y="114" width="48" height="48" rx="6" fill="#d4c8f0" />
      <rect x="66" y="114" width="48" height="48" rx="6" fill="#c8ece2" />
      <rect x="122" y="114" width="48" height="48" rx="6" fill="#f5e6cc" />
      <rect x="10" y="168" width="48" height="30" rx="6" fill="#f5e6cc" opacity="0.7" />
      <rect x="66" y="168" width="48" height="30" rx="6" fill="#d4c8f0" opacity="0.7" />
      <rect x="122" y="168" width="48" height="30" rx="6" fill="#c8ece2" opacity="0.7" />
    </g>
  );
}

function NotifScreen() {
  return (
    <g>
      <rect x="10" y="10" width="160" height="22" rx="6" fill="#fff3f3" />
      <rect x="16" y="17" width="80" height="8" rx="4" fill="#c43d3d" opacity="0.5" />
      {[0,1,2,3,4].map(i => (
        <g key={i} transform={`translate(0,${38 + i * 34})`}>
          <rect x="10" y="0" width="160" height="28" rx="8" fill="white" />
          <circle cx="26" cy="14" r="8" fill={["#c43d3d","#1a7a6e","#7c5cbf","#c43d3d","#1a7a6e"][i]} opacity="0.2" />
          <rect x="40" y="6" width="80" height="7" rx="3" fill="#1a1410" opacity="0.4" />
          <rect x="40" y="16" width="55" height="5" rx="2" fill="#7a6e66" opacity="0.3" />
          <rect x="148" y="10" width="16" height="5" rx="2" fill={["#c43d3d","#1a7a6e","#7c5cbf","#c43d3d","#1a7a6e"][i]} opacity="0.4" />
        </g>
      ))}
    </g>
  );
}

function PhoneScreen({ screen }) {
  const screens = { feed: FeedScreen, chat: ChatScreen, profile: ProfileScreen, notif: NotifScreen };
  const S = screens[screen] || FeedScreen;
  return (
    <svg viewBox="0 0 180 220" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <S />
    </svg>
  );
}

// ── Magnetic button ──────────────────────────────────────────
function MagButton({ children, className, onClick, style }) {
  const ref = useRef();
  const handleMove = useCallback((e) => {
    const r = ref.current.getBoundingClientRect();
    const x = e.clientX - r.left - r.width / 2;
    const y = e.clientY - r.top - r.height / 2;
    ref.current.style.transform = `translate(${x * 0.28}px, ${y * 0.28}px)`;
  }, []);
  const handleLeave = useCallback(() => {
    ref.current.style.transform = "translate(0,0)";
  }, []);
  return (
    <button
      ref={ref}
      className={className}
      onClick={onClick}
      style={{ transition: "transform 0.4s cubic-bezier(.23,1,.32,1)", ...style }}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
    >
      {children}
    </button>
  );
}

// ── Live Activity Ticker ─────────────────────────────────────
function ActivityTicker() {
  const [idx, setIdx] = useState(0);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const timer = setInterval(() => {
      setVisible(false);
      setTimeout(() => { setIdx(i => (i + 1) % ACTIVITY_FEED.length); setVisible(true); }, 400);
    }, 2800);
    return () => clearInterval(timer);
  }, []);
  const item = ACTIVITY_FEED[idx];
  return (
    <div className="lp-activity-ticker" style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(8px)" }}>
      <div className="lp-av" style={{ background: item.avatar, width: 28, height: 28 }} />
      <span className="lp-activity-text">
        <strong>{item.name}</strong> {item.action}
      </span>
      <span className="lp-activity-time">{item.time}</span>
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────
export default function Landing() {
  const navigate = useNavigate();
  const canvasRef = useRef();
  const stickyRef = useRef();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [sceneProgress, setSceneProgress] = useState(0);
  const [heroVisible, setHeroVisible] = useState(false);

  useParticles(canvasRef);
  useReveal();

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const el = stickyRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.offsetHeight - window.innerHeight;
      const scrolled = Math.max(0, -rect.top);
      // Each scene occupies exactly 1/(N) of the total scrollable distance
      const N = PHONE_SCENES.length;
      const perScene = total / N;
      const idx = Math.min(Math.floor(scrolled / perScene), N - 1);
      const progress = (scrolled - idx * perScene) / perScene;
      setSceneIdx(idx);
      setSceneProgress(Math.min(progress, 1));
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll(); // sync on mount
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scene = PHONE_SCENES[sceneIdx];

  return (
    <div className="lp">
      {/* ═══ HERO ════════════════════════════════════════════ */}
      <section className="lp-hero">
        <video
          className="lp-hero-video"
          src="https://res.cloudinary.com/drpdkazns/video/upload/v1774695650/15578137_1920_1080_60fps_eyuxab.mp4"
          autoPlay muted loop playsInline
        />
        <div className="lp-hero-overlay" />
        <canvas ref={canvasRef} className="lp-canvas" />

        <div className={`lp-hero-content${heroVisible ? " lp-hero-content--in" : ""}`}>
          <div className="lp-badge">
            <span className="lp-badge-dot" />
            Social. Simple. Yours.
          </div>

          <h1 className="lp-h1">
            <span className="lp-h1-ln" style={{ "--d": "0s" }}>The space</span>
            <span className="lp-h1-ln lp-h1-grad" style={{ "--d": "0.13s" }}><em>where it</em></span>
            <span className="lp-h1-ln" style={{ "--d": "0.26s" }}>all happens</span>
          </h1>

          <p className="lp-sub" style={{ "--d": "0.4s" }}>
            Share moments. Follow people. Chat in real time.<br />
            No noise — just your world, beautifully connected.
          </p>

          <div className="lp-hero-ctas" style={{ "--d": "0.52s" }}>
            <MagButton className="lp-btn-primary" onClick={() => navigate("/register")}>
              Start Exploring
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
              </svg>
            </MagButton>
            <MagButton className="lp-btn-ghost lp-btn-ghost--hero" onClick={() => navigate("/login")}>
              Sign in
            </MagButton>
          </div>

          <div className="lp-chips" style={{ "--d": "0.64s" }}>
            {["Posts","Chats","Follows","Notifications"].map(s => (
              <span key={s} className="lp-chip">{s}</span>
            ))}
          </div>
        </div>

        {/* Floating card cluster */}
        <div className={`lp-cards${heroVisible ? " lp-cards--in" : ""}`}>
          <div className="lp-card lp-card-header">
            <div className="lp-av" style={{ background: "linear-gradient(135deg,#c8ece2,#1a7a6e)" }} />
            <div><div className="lp-sk lp-sk-name" /><div className="lp-sk lp-sk-time" /></div>
          </div>
          <div className="lp-card lp-card-post">
            <div className="lp-card-photo" />
            <div className="lp-card-caption">
              <div className="lp-sk" style={{ width: "88%", height: 8, borderRadius: 4 }} />
              <div className="lp-sk" style={{ width: "62%", height: 8, borderRadius: 4 }} />
            </div>
            <div className="lp-card-row">
              <span className="lp-like">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="#e8843a" stroke="#e8843a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                42
              </span>
              <span className="lp-like">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7a6e66" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                </svg>
                12
              </span>
            </div>
          </div>
          <div className="lp-card lp-card-notif">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            5 new
          </div>
          <div className="lp-card lp-card-chat">
            <div className="lp-bubble lp-bubble-in">Hey! Saw your post 👋</div>
            <div className="lp-bubble lp-bubble-out">Thanks! 😊</div>
          </div>
        </div>

        <div className="lp-scroll-cue">
          <span>Scroll</span>
          <div className="lp-scroll-line" />
        </div>
      </section>

      {/* ═══ MARQUEE ════════════════════════════════════════ */}
      <div className="lp-marquee-wrap" aria-hidden>
        <div className="lp-marquee">
          {[...MARQUEE_ITEMS,...MARQUEE_ITEMS].map((item, i) => (
            <span key={i} className="lp-marquee-item">
              <span className="lp-marquee-dot" />{item}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ SCROLL-SCRUBBED PHONE ══════════════════════════ */}
      <section className="lp-sticky-wrap" ref={stickyRef}>
        <div className="lp-sticky-inner">
          <div className="lp-sticky-text">
            <div className="lp-eyebrow">Everything in one place</div>
            <div className="lp-scenes-wrap">
              {PHONE_SCENES.map((s, i) => (
                <div key={i} className={`lp-scene${i === sceneIdx ? " lp-scene--on" : ""}`}>
                  <h2 className="lp-h2">{s.label}</h2>
                  <p className="lp-scene-p">
                    {[
                      "A clean, beautiful feed showing posts from people you follow. Scroll, like, and discover peoples.",
                      "Real-time messaging powered by WebSockets. Conversations that feel alive — messages appear instantly, no refresh needed.",
                      "Your corner of SocioSpace. Showcase your posts, followers, and bio. Make it yours, make it memorable.",
                      "Never miss a beat. Instant notifications for likes, comments, and follows — all in one elegant notification centre.",
                    ][i]}
                  </p>
                  <div className="lp-scene-tag" style={{ background: s.accent + "20", color: s.accent }}>
                    {["Explore Feed →","Start Chatting →","Build Profile →","Stay Updated →"][i]}
                  </div>
                </div>
              ))}
            </div>
            <div className="lp-dots">
              {PHONE_SCENES.map((s, i) => (
                <div key={i} className={`lp-dot${i === sceneIdx ? " lp-dot--on" : ""}`}
                  style={{ "--c": scene.accent }} />
              ))}
            </div>
            <div className="lp-prog-track">
              <div className="lp-prog-fill" style={{
                width: `${((sceneIdx + sceneProgress) / PHONE_SCENES.length) * 100}%`,
                background: scene.accent,
              }} />
            </div>
          </div>

          <div className="lp-phone-wrap">
            <div className="lp-phone" style={{ "--bg": scene.color }}>
              <div className="lp-notch" />
              <div className="lp-screen">
                {PHONE_SCENES.map((s, i) => (
                  <div key={i} className={`lp-frame${i === sceneIdx ? " lp-frame--on" : ""}`}>
                    <PhoneScreen screen={s.screen} />
                  </div>
                ))}
              </div>
              <div className="lp-home-bar" />
              <div className="lp-reflection" />
            </div>
            <div className="lp-phone-glow" style={{ background: scene.accent + "40" }} />
          </div>
        </div>
      </section>

      {/* ═══ STATS ══════════════════════════════════════════ */}
      <section className="lp-stats">
        <div className="lp-stats-grid">
          {STATS.map((s, i) => (
            <div key={i} className="lp-stat" data-reveal style={{ "--di": `${i * 0.1}s` }}>
              <div className="lp-stat-val"><Counter value={s.value} suffix={s.suffix} /></div>
              <div className="lp-stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ BENTO FEATURES ═════════════════════════════════ */}
      <section className="lp-bento-section">
        <div className="lp-eyebrow" data-reveal style={{ textAlign: "center" }}>What you get</div>
        <h2 className="lp-h2" data-reveal style={{ textAlign: "center", margin: "0 auto 40px" }}>Built for real connection</h2>
        <div className="lp-bento">
          {[
            { span: 2, bg: "#e8f5f0", fg: "#1a7a6e", icon: "M3 3h18v18H3z M8.5 8.5m-1.5 0a1.5 1.5 0 1 0 3 0 1.5 1.5 0 0 0-3 0 M21 15l-5-5L5 21", title: "Share Moments", desc: "Post photos with captions. Tell your story one beautiful frame at a time.", pill: "Feed-first" },
            { span: 1, bg: "#fdf0e6", fg: "#e8843a", icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z", title: "Live Chat", desc: "Messages arrive instantly. No refresh, no delay — pure conversation.", live: true },
            { span: 1, bg: "#f0eefa", fg: "#7c5cbf", icon: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75", title: "Follow Anyone", desc: "Build your circle. Follow and discover people who inspire you." },
            { span: 2, bg: "#e8f5f0", fg: "#1a7a6e", icon: "M12 8a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M4 20c0-4 3.6-7 8-7s8 3 8 7", title: "Your Profile", desc: "A personal page for your posts, bio, and social stats. Yours to own.", tags: ["Posts","Followers","Following","Bio"] },
            { span: 1, bg: "#fff3f3", fg: "#c43d3d", icon: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0", title: "Notifications", desc: "Never miss a like, comment, or follow — elegantly summarised." },
          ].map((f, i) => (
            <div key={i} className="lp-bento-card" data-reveal
              style={{ "--di": `${i * 0.08}s`, gridColumn: `span ${f.span}` }}>
              <div className="lp-bento-icon" style={{ background: f.bg, color: f.fg }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  {f.icon.split(" M").map((d, j) => <path key={j} d={(j === 0 ? "" : "M") + d} />)}
                </svg>
              </div>
              <h3 className="lp-bento-title">{f.title}</h3>
              <p className="lp-bento-desc">{f.desc}</p>
              {f.pill && <div className="lp-bento-pill" style={{ background: f.bg, color: f.fg }}>{f.pill}</div>}
              {f.live && <div className="lp-live"><span className="lp-live-dot" />Real-time</div>}
              {f.tags && <div className="lp-tag-row">{f.tags.map(t => <span key={t} className="lp-tag">{t}</span>)}</div>}
            </div>
          ))}
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══════════════════════════════════ */}
      <section className="lp-how">
        <div className="lp-how-inner">
          <div className="lp-eyebrow" data-reveal style={{ textAlign: "center" }}>Simple by design</div>
          <h2 className="lp-h2" data-reveal style={{ textAlign: "center", margin: "0 auto 48px" }}>Up and running in moments</h2>
          <div className="lp-how-steps">
            {[
              { n: "01", title: "Create your account", desc: "Your first step to joining the community.", color: "#1a7a6e" },
              { n: "02", title: "Build your feed", desc: "Search for people, follow friends, explore posts. Your feed shapes itself around you.", color: "#e8843a" },
              { n: "03", title: "Share & connect", desc: "Post moments, send messages, like and comment. SocioSpace is yours from day one.", color: "#7c5cbf" },
            ].map((step, i) => (
              <div key={i} className="lp-how-step" data-reveal style={{ "--di": `${i * 0.15}s` }}>
                <div className="lp-how-num" style={{ color: step.color, borderColor: step.color + "30", background: step.color + "10" }}>{step.n}</div>
                {i < 2 && <div className="lp-how-connector" style={{ background: `linear-gradient(90deg,${step.color}40,transparent)` }} />}
                <h3 className="lp-how-title">{step.title}</h3>
                <p className="lp-how-desc">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ LIVE ACTIVITY WALL ══════════════════════════════ */}
      <section className="lp-activity-section">
        <div className="lp-activity-inner">
          <div className="lp-activity-left" data-reveal>
            <div className="lp-eyebrow" style={{ color: "#22a092" }}>Happening now</div>
            <h2 className="lp-h2 lp-h2-light" style={{ margin: "12px 0 16px" }}>Your community<br />never stops</h2>
            <p className="lp-activity-desc">
              Likes, comments, follows — SocioSpace moves at the speed of your people.
              Every interaction surfaces instantly, keeping you at the centre of it all.
            </p>
            <ActivityTicker />
          </div>
          <div className="lp-activity-right" data-reveal style={{ "--di": "0.2s" }}>
            <div className="lp-activity-cards">
              {ACTIVITY_FEED.map((item, i) => (
                <div key={i} className="lp-activity-card" style={{ animationDelay: `${i * 0.12}s` }}>
                  <div className="lp-av" style={{ background: item.avatar, width: 36, height: 36, flexShrink: 0 }} />
                  <div className="lp-activity-body">
                    <span className="lp-activity-name">{item.name}</span>
                    <span className="lp-activity-action"> {item.action}</span>
                  </div>
                  <span className="lp-activity-badge">{item.icon}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURE DEEP-DIVE ROWS ══════════════════════════ */}
      <section className="lp-deepdive">
        {[
          { icon: "🔍", color: "#1a7a6e", bg: "#e8f5f0", label: "Discover", title: "Find your people with Search", desc: "Search users, posts, and hashtags instantly. Our smart search surfaces the people and content that matter most to you.", tags: ["Users","Posts","Hashtags","Trending"], side: "left" },
          { icon: "❤️", color: "#e8843a", bg: "#fdf0e6", label: "Engage", title: "Like, comment, share moments", desc: "Double-tap to like. Drop a comment. Every interaction is a thread connecting you deeper to your community — beautifully simple.", tags: ["Likes","Comments","Reposts","Reactions"], side: "right" },
          { icon: "📸", color: "#7c5cbf", bg: "#f0eefa", label: "Express", title: "Post anything, anytime", desc: "Share photos with captions, or just a thought. Your profile is your canvas — paint it however feels right today.", tags: ["Photos","Captions","Stories","Profile"], side: "left" },
        ].map((row, i) => (
          <div key={i} className={`lp-deepdive-row lp-deepdive-row--${row.side}`} data-reveal style={{ "--di": "0.1s" }}>
            <div className="lp-deepdive-visual" style={{ background: row.bg }}>
              <div className="lp-deepdive-icon-wrap" style={{ background: row.color + "18", border: `2px solid ${row.color}20` }}>
                <span style={{ fontSize: 52 }}>{row.icon}</span>
              </div>
              <div className="lp-deepdive-pill" style={{ background: row.color, color: "white" }}>{row.label}</div>
            </div>
            <div className="lp-deepdive-text">
              <div className="lp-eyebrow" style={{ color: row.color }}>{row.label}</div>
              <h3 className="lp-deepdive-h3">{row.title}</h3>
              <p className="lp-deepdive-p">{row.desc}</p>
              <div className="lp-tag-row" style={{ marginTop: 16 }}>
                {row.tags.map(t => <span key={t} className="lp-tag" style={{ borderColor: row.color + "30", color: row.color }}>{t}</span>)}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* ═══ CTA ════════════════════════════════════════════ */}
      <section className="lp-cta" data-reveal>
        <div className="lp-cta-orb lp-cta-orb-1" /><div className="lp-cta-orb lp-cta-orb-2" />
        <div className="lp-cta-inner">
          <div className="lp-eyebrow" style={{ color: "#22a092" }}>Ready?</div>
          <h2 className="lp-cta-h2">Find your <em>SocioSpace</em></h2>
          <p className="lp-cta-sub">Join in seconds. No credit card. No catch.</p>
          <div className="lp-cta-btns">
            <MagButton className="lp-btn-primary lp-btn-lg" onClick={() => navigate("/register")}>
              Create account
            </MagButton>
            <button className="lp-cta-ghost" onClick={() => navigate("/login")}>
              Already have an account? Sign in →
            </button>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═════════════════════════════════════════ */}
      <footer className="lp-footer">
        <span className="lp-footer-logo">SocioSpace</span>
        <span className="lp-footer-copy">© {new Date().getFullYear()} · Made with care</span>
      </footer>

      {/* ═══ ALL STYLES ═════════════════════════════════════ */}
      <style>{`
        /* ── Reset & base ─────────────────────────────────── */
        .lp { font-family: var(--font-body); color: var(--ink); overflow-x: hidden; }
        .lp *, .lp *::before, .lp *::after { box-sizing: border-box; margin: 0; padding: 0; }

        /* Pointer cursor on interactive elements — no custom cursor */
        .lp button, .lp a { cursor: pointer; }

        /* ── Hero ─────────────────────────────────────────── */
        .lp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: space-between;
          gap: 40px; padding: 90px 7vw 80px; overflow: hidden;
        }
        .lp-hero-video {
          position: absolute; inset: 0; width: 100%; height: 100%;
          object-fit: cover; z-index: 0; pointer-events: none;
        }
        .lp-hero-overlay {
          position: absolute; inset: 0; z-index: 1;
          background: linear-gradient(135deg, rgba(10,12,10,.78) 0%, rgba(20,24,20,.52) 60%, rgba(10,12,10,.70) 100%);
        }
        .lp-canvas {
          position: absolute; inset: 0; width: 100%; height: 100%;
          pointer-events: none; z-index: 2;
        }
        .lp-hero-content { position: relative; z-index: 3; flex: 1; max-width: 580px; }
        .lp-cards {
          position: relative; z-index: 3; flex-shrink: 0; width: 300px; height: 390px;
          opacity: 0; transform: translateX(30px) translateY(16px);
          transition: opacity .9s ease .4s, transform .9s ease .4s;
        }
        .lp-cards--in { opacity: 1; transform: none; }

        /* Hero overrides for dark background */
        .lp-hero .lp-h1 { color: #faf8f5; }
        .lp-hero .lp-sub { color: rgba(250,248,245,.68); }
        .lp-hero .lp-badge { background: rgba(26,122,110,.22); border-color: rgba(26,122,110,.38); color: #7de8d8; }
        .lp-hero .lp-badge-dot { background: #7de8d8; }
        .lp-hero .lp-chip { background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.18); color: rgba(250,248,245,.55); }

        /* Hero content entrance */
        .lp-hero-content .lp-badge, .lp-hero-content .lp-h1-ln,
        .lp-hero-content .lp-sub, .lp-hero-content .lp-hero-ctas,
        .lp-hero-content .lp-chips {
          opacity: 0; transform: translateY(28px);
          transition: opacity .7s ease var(--d,0s), transform .7s ease var(--d,0s);
        }
        .lp-hero-content--in .lp-badge, .lp-hero-content--in .lp-h1-ln,
        .lp-hero-content--in .lp-sub, .lp-hero-content--in .lp-hero-ctas,
        .lp-hero-content--in .lp-chips { opacity: 1; transform: none; }

        /* ── Badge ────────────────────────────────────────── */
        .lp-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--mint); border: 1px solid var(--mint-mid);
          color: var(--sea-strong); font-size: 12px; font-weight: 600;
          letter-spacing: .06em; text-transform: uppercase;
          padding: 6px 14px; border-radius: 999px; margin-bottom: 24px;
        }
        .lp-badge-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--sea);
          animation: pulse 2.2s ease-in-out infinite; flex-shrink: 0;
        }

        /* ── Headlines ────────────────────────────────────── */
        .lp-h1 {
          font-family: var(--font-display); font-size: clamp(3rem,6vw,5rem);
          font-weight: 700; line-height: 1.08; letter-spacing: -.03em;
          color: var(--ink); margin-bottom: 20px; display: flex; flex-direction: column;
        }
        .lp-h1-grad em {
          font-style: italic;
          background: linear-gradient(90deg, var(--sea) 0%, var(--sea-light) 50%, var(--accent) 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-h2 {
          font-family: var(--font-display); font-size: clamp(1.8rem,3.5vw,2.8rem);
          font-weight: 700; letter-spacing: -.025em; color: var(--ink);
          line-height: 1.12; margin-bottom: 16px;
        }
        .lp-h2-light { color: #faf8f5 !important; }
        .lp-sub { font-size: 1.05rem; color: var(--muted); line-height: 1.7; margin-bottom: 32px; }
        .lp-hero-ctas { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }

        /* ── Buttons ──────────────────────────────────────── */
        .lp-btn-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--sea); color: white; border: none;
          padding: 13px 26px; border-radius: 999px; font-size: .95rem;
          font-weight: 600; box-shadow: 0 8px 28px rgba(26,122,110,.28);
          will-change: transform;
        }
        .lp-btn-primary:hover { background: var(--sea-strong); }
        .lp-btn-ghost {
          display: inline-flex; align-items: center;
          background: none; border: 1.5px solid var(--border-strong);
          color: var(--ink-soft); padding: 12px 22px; border-radius: 999px;
          font-size: .95rem; font-weight: 500; will-change: transform;
        }
        .lp-btn-ghost--hero { border-color: rgba(255,255,255,.28); color: rgba(250,248,245,.8); }
        .lp-btn-ghost--hero:hover { border-color: #7de8d8; color: #7de8d8; background: rgba(255,255,255,.07); }
        .lp-btn-ghost:hover { border-color: var(--sea); color: var(--sea); background: var(--mint); }
        .lp-btn-lg { font-size: 1rem; padding: 15px 36px; }

        /* ── Chips ────────────────────────────────────────── */
        .lp-chips { display: flex; gap: 7px; flex-wrap: wrap; }
        .lp-chip {
          font-size: 11px; font-weight: 600; letter-spacing: .04em;
          text-transform: uppercase; background: var(--paper-alt);
          border: 1px solid var(--border); color: var(--muted);
          padding: 4px 11px; border-radius: 999px;
        }

        /* ── Card cluster ─────────────────────────────────── */
        .lp-card {
          position: absolute; background: var(--panel-raised);
          border: 1px solid var(--border); border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
        }
        .lp-card-header {
          top: 0; left: 0; right: 0; display: flex; align-items: center; gap: 10px;
          padding: 12px 14px; animation: fA 7s ease-in-out infinite;
        }
        .lp-av { border-radius: 50%; flex-shrink: 0; }
        .lp-sk { background: var(--border-strong); border-radius: 4px; }
        .lp-sk-name { height: 9px; width: 90px; margin-bottom: 5px; }
        .lp-sk-time { height: 7px; width: 55px; background: var(--border); }
        .lp-card-post { top: 64px; left: 10px; right: -10px; padding: 12px; animation: fB 8s ease-in-out infinite; }
        .lp-card-photo {
          height: 150px; border-radius: var(--radius-md);
          background: linear-gradient(135deg, var(--mint-mid), var(--sand)); margin-bottom: 10px;
        }
        .lp-card-caption { margin-bottom: 8px; display: flex; flex-direction: column; gap: 5px; }
        .lp-card-row { display: flex; gap: 12px; }
        .lp-like { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 500; color: var(--muted); }
        .lp-card-notif {
          top: 54px; right: -24px; background: var(--sea); color: white;
          font-size: 11px; font-weight: 700; padding: 6px 12px; border-radius: 999px;
          display: flex; align-items: center; gap: 5px; box-shadow: var(--shadow-sea);
          animation: fC 5s ease-in-out infinite, bb 3s ease-in-out infinite;
        }
        .lp-card-chat {
          bottom: 0; left: -10px; right: 10px; padding: 10px 12px;
          display: flex; flex-direction: column; gap: 7px; animation: fD 9s ease-in-out infinite;
        }
        .lp-bubble { font-size: 12px; padding: 7px 12px; border-radius: 12px; max-width: 75%; }
        .lp-bubble-in { background: var(--paper-alt); color: var(--ink-soft); align-self: flex-start; }
        .lp-bubble-out { background: var(--sea); color: white; align-self: flex-end; }

        @keyframes fA { 0%,100%{transform:translateY(0) rotate(-.5deg)} 50%{transform:translateY(-10px) rotate(-.5deg)} }
        @keyframes fB { 0%,100%{transform:translateY(0) rotate(1deg)} 50%{transform:translateY(-14px) rotate(1deg)} }
        @keyframes fC { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(-2deg)} }
        @keyframes fD { 0%,100%{transform:translateY(0) rotate(.5deg)} 50%{transform:translateY(-11px) rotate(.5deg)} }
        @keyframes bb { 0%,100%{transform:scale(1)} 50%{transform:scale(1.08)} }

        /* ── Scroll cue ───────────────────────────────────── */
        .lp-scroll-cue {
          position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%);
          display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 3;
          font-size: 10px; letter-spacing: .1em; text-transform: uppercase;
          color: rgba(250,248,245,.4); animation: fadePulse 3s ease-in-out infinite;
        }
        .lp-scroll-line {
          width: 1px; height: 40px;
          background: linear-gradient(to bottom, rgba(250,248,245,.4), transparent);
          animation: sline 1.8s ease-in-out infinite;
        }
        @keyframes sline { 0%,100%{transform:scaleY(1);opacity:1} 50%{transform:scaleY(.4);opacity:.25} }
        @keyframes fadePulse { 0%,100%{opacity:.6} 50%{opacity:1} }

        /* ── Marquee ──────────────────────────────────────── */
        .lp-marquee-wrap {
          overflow: hidden; border-top: 1px solid var(--border);
          border-bottom: 1px solid var(--border); background: var(--paper-alt); padding: 12px 0;
        }
        .lp-marquee { display: flex; white-space: nowrap; animation: mq 22s linear infinite; }
        .lp-marquee-wrap:hover .lp-marquee { animation-play-state: paused; }
        .lp-marquee-item {
          display: inline-flex; align-items: center; gap: 10px; font-size: 12px;
          font-weight: 600; letter-spacing: .04em; text-transform: uppercase;
          color: var(--muted); padding: 0 22px;
        }
        .lp-marquee-dot { width: 5px; height: 5px; border-radius: 50%; background: var(--sea); opacity: .5; flex-shrink: 0; }
        @keyframes mq { from{transform:translateX(0)} to{transform:translateX(-50%)} }

        /* ── Sticky phone section ─────────────────────────── */
        .lp-sticky-wrap { height: 300vh; position: relative; }
        .lp-sticky-inner {
          position: sticky; top: 0; height: 100vh;
          display: flex; align-items: center; justify-content: space-between;
          gap: 60px; padding: 0 7vw; overflow: hidden; background: var(--paper);
        }
        .lp-eyebrow {
          font-size: 11px; font-weight: 700; letter-spacing: .1em;
          text-transform: uppercase; color: var(--sea); margin-bottom: 16px;
        }
        .lp-sticky-text { flex: 1; max-width: 460px; display: flex; flex-direction: column; }
        .lp-scenes-wrap { position: relative; min-height: 20px; margin-bottom: 20px; }
        .lp-scene {
          position: absolute; top: 0; left: 0; right: 0; opacity: 0; transform: translateY(18px);
          transition: opacity .5s ease, transform .5s ease; pointer-events: none;
        }
        .lp-scene--on { opacity: 1; transform: none; pointer-events: auto; }
        .lp-scene-p { font-size: 1rem; color: var(--muted); line-height: 1.7; margin-bottom: 20px; }
        .lp-scene-tag {
          display: inline-block; font-size: 13px; font-weight: 600;
          padding: 6px 14px; border-radius: 999px; margin-bottom: 28px; cursor: default;
        }
        .lp-dots { display: flex; gap: 7px; margin-bottom: 10px; }
        .lp-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); transition: background .3s, transform .3s; }
        .lp-dot--on { background: var(--c, var(--sea)); transform: scale(1.35); }
        .lp-prog-track { height: 3px; background: var(--border); border-radius: 999px; overflow: hidden; width: 160px; }
        .lp-prog-fill { height: 100%; border-radius: 999px; transition: width .1s linear, background .4s ease; }

        /* ── Phone mockup ─────────────────────────────────── */
        .lp-phone-wrap { position: relative; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
        .lp-phone {
          position: relative; z-index: 2; width: 240px; height: 480px;
          border-radius: 44px; background: var(--bg, #e8f5f0); border: 8px solid var(--ink);
          overflow: hidden; box-shadow: 0 32px 80px rgba(26,20,16,.2), 0 0 0 1px rgba(26,20,16,.06);
          transition: background .6s ease;
        }
        .lp-notch {
          position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
          width: 80px; height: 18px; border-radius: 999px; background: var(--ink); z-index: 10;
        }
        .lp-screen { position: absolute; inset: 0; padding: 40px 8px 22px; }
        .lp-frame {
          position: absolute; inset: 40px 8px 22px; opacity: 0;
          transform: scale(.95) translateY(14px); transition: opacity .55s ease, transform .55s ease;
        }
        .lp-frame--on { opacity: 1; transform: none; }
        .lp-home-bar {
          position: absolute; bottom: 7px; left: 50%; transform: translateX(-50%);
          width: 72px; height: 4px; border-radius: 3px; background: var(--ink); opacity: .2;
        }
        .lp-reflection {
          position: absolute; top: 0; left: 0; right: 0; height: 55%;
          background: linear-gradient(180deg, rgba(255,255,255,.14), transparent);
          border-radius: 36px 36px 0 0; pointer-events: none;
        }
        .lp-phone-glow {
          position: absolute; width: 280px; height: 280px; border-radius: 50%;
          filter: blur(70px); bottom: -60px; left: 50%; transform: translateX(-50%);
          transition: background .6s ease; z-index: 1;
        }

        /* ── Stats ────────────────────────────────────────── */
        .lp-stats { padding: 64px 7vw; background: var(--ink); }
        .lp-stats-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 2px; max-width: 900px; margin: 0 auto; }
        .lp-stat {
          padding: 36px 28px; border: 1px solid rgba(255,255,255,.07); text-align: center;
          opacity: 0; transform: translateY(24px);
          transition: opacity .5s ease var(--di,0s), transform .5s ease var(--di,0s);
        }
        .lp-stat.revealed { opacity: 1; transform: none; }
        .lp-stat-val {
          font-family: var(--font-display); font-size: clamp(1.8rem,3.5vw,2.8rem);
          font-weight: 700; margin-bottom: 6px;
          background: linear-gradient(90deg, var(--sea-light), var(--accent));
          -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
        }
        .lp-stat-lbl { font-size: 12px; color: rgba(250,248,245,.4); letter-spacing: .04em; }

        /* ── Bento features ───────────────────────────────── */
        .lp-bento-section { padding: 52px 7vw; background: var(--paper); }
        .lp-bento { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; max-width: 1100px; margin: 0 auto; }
        [data-reveal] {
          opacity: 0; transform: translateY(24px);
          transition: opacity .55s ease var(--di,0s), transform .55s ease var(--di,0s);
          animation: revealFallback 0.6s ease forwards;
            animation-delay: calc(var(--di,0s) + 1.2s);
        }
        [data-reveal].revealed { opacity: 1; transform: none; animation: none; }
        @keyframes revealFallback { to { opacity: 1; transform: none; } }
        .lp-bento-card {
          background: var(--panel-raised); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 24px 22px;
          transition: transform .25s, box-shadow .25s, border-color .25s;
        }
        .lp-bento-card:hover { transform: translateY(-4px); box-shadow: var(--shadow-lg); border-color: var(--border-accent); }
        .lp-bento-icon {
          width: 48px; height: 48px; border-radius: var(--radius-md);
          display: flex; align-items: center; justify-content: center; margin-bottom: 14px;
        }
        .lp-bento-title { font-family: var(--font-display); font-size: 1.1rem; font-weight: 600; color: var(--ink); margin-bottom: 7px; }
        .lp-bento-desc { font-size: .9rem; color: var(--muted); line-height: 1.6; }
        .lp-bento-pill { display: inline-block; font-size: 11.5px; font-weight: 600; padding: 4px 11px; border-radius: 999px; margin-top: 12px; }
        .lp-live {
          display: inline-flex; align-items: center; gap: 6px; font-size: 12px;
          font-weight: 600; color: var(--success); margin-top: 12px;
          background: var(--success-light); padding: 4px 11px; border-radius: 999px;
        }
        .lp-live-dot {
          width: 7px; height: 7px; border-radius: 50%; background: var(--success);
          animation: pulse 1.8s ease-in-out infinite; flex-shrink: 0;
        }
        .lp-tag-row { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 12px; }
        .lp-tag {
          font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em;
          color: var(--muted); background: var(--paper-alt); border: 1px solid var(--border);
          padding: 3px 9px; border-radius: 999px;
        }

        /* ── How it works ─────────────────────────────────── */
        .lp-how { padding: 52px 7vw; background: var(--paper-alt); }
        .lp-how-inner { max-width: 1000px; margin: 0 auto; }
        .lp-how-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 32px; position: relative; }
        .lp-how-step { position: relative; text-align: center; }
        .lp-how-num {
          width: 60px; height: 60px; border-radius: 50%; border: 2px solid;
          display: flex; align-items: center; justify-content: center; margin: 0 auto 18px;
          font-family: var(--font-display); font-size: 1.1rem; font-weight: 700; transition: transform .3s;
        }
        .lp-how-step:hover .lp-how-num { transform: scale(1.12); }
        .lp-how-connector {
          position: absolute; top: 30px; left: calc(50% + 38px);
          width: calc(100% - 76px); height: 2px; border-radius: 2px;
        }
        .lp-how-title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 600; color: var(--ink); margin-bottom: 8px; }
        .lp-how-desc { font-size: .9rem; color: var(--muted); line-height: 1.65; }

        /* ── Activity section ─────────────────────────────── */
        .lp-activity-section { padding: 52px 7vw; background: var(--ink); overflow: hidden; }
        .lp-activity-inner {
          max-width: 1100px; margin: 0 auto; display: grid;
          grid-template-columns: 1fr 1fr; gap: 64px; align-items: center;
        }
        .lp-activity-desc { font-size: .97rem; color: rgba(250,248,245,.5); line-height: 1.7; margin-bottom: 24px; }
        .lp-activity-ticker {
          display: flex; align-items: center; gap: 12px;
          background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.1);
          border-radius: 999px; padding: 9px 14px;
          transition: opacity .4s ease, transform .4s ease;
        }
        .lp-activity-text { font-size: 13px; color: rgba(250,248,245,.7); flex: 1; }
        .lp-activity-text strong { color: #faf8f5; }
        .lp-activity-time { font-size: 11px; color: rgba(250,248,245,.35); white-space: nowrap; }
        .lp-activity-cards { display: flex; flex-direction: column; gap: 8px; }
        .lp-activity-card {
          display: flex; align-items: center; gap: 11px;
          background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.08);
          border-radius: 12px; padding: 11px 14px;
          animation: slideIn .5s ease both;
        }
        @keyframes slideIn { from{opacity:0;transform:translateX(24px)} to{opacity:1;transform:none} }
        .lp-activity-body { flex: 1; font-size: 13px; }
        .lp-activity-name { color: #faf8f5; font-weight: 600; }
        .lp-activity-action { color: rgba(250,248,245,.5); }
        .lp-activity-badge { font-size: 15px; }

        /* ── Deep dive ────────────────────────────────────── */
        .lp-deepdive { padding: 40px 7vw 72px; background: var(--paper); display: flex; flex-direction: column; gap: 0; }
        .lp-deepdive-row {
          display: grid; grid-template-columns: 1fr 1fr; gap: 64px;
          align-items: center; padding: 48px 0; border-bottom: 1px solid var(--border);
        }
        .lp-deepdive-row:last-child { border-bottom: none; }
        .lp-deepdive-row--right .lp-deepdive-visual { order: 2; }
        .lp-deepdive-row--right .lp-deepdive-text { order: 1; }
        .lp-deepdive-visual {
          border-radius: var(--radius-lg); aspect-ratio: 1;
          display: flex; flex-direction: column; align-items: center; justify-content: center;
          gap: 18px; min-height: 260px;
        }
        .lp-deepdive-icon-wrap {
          width: 110px; height: 110px; border-radius: 28px;
          display: flex; align-items: center; justify-content: center;
          animation: iconFloat 4s ease-in-out infinite;
        }
        @keyframes iconFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        .lp-deepdive-pill {
          font-size: 11px; font-weight: 700; letter-spacing: .08em;
          text-transform: uppercase; padding: 4px 13px; border-radius: 999px;
        }
        .lp-deepdive-h3 {
          font-family: var(--font-display); font-size: clamp(1.3rem,2.2vw,1.9rem);
          font-weight: 700; color: var(--ink); letter-spacing: -.02em; margin: 6px 0 12px;
        }
        .lp-deepdive-p { font-size: .97rem; color: var(--muted); line-height: 1.7; }

        /* ── CTA ──────────────────────────────────────────── */
        .lp-cta {
          position: relative; overflow: hidden; padding: 88px 7vw;
          background: var(--ink); text-align: center;
        }
        .lp-cta-orb { position: absolute; border-radius: 50%; filter: blur(80px); pointer-events: none; }
        .lp-cta-orb-1 { width: 500px; height: 500px; top: -150px; left: -100px; background: radial-gradient(circle,rgba(26,122,110,.3),transparent); }
        .lp-cta-orb-2 { width: 400px; height: 400px; bottom: -120px; right: -80px; background: radial-gradient(circle,rgba(232,132,58,.28),transparent); }
        .lp-cta-inner { position: relative; z-index: 1; }
        .lp-cta-h2 {
          font-family: var(--font-display); font-size: clamp(2.2rem,4.5vw,3.6rem);
          font-weight: 700; color: var(--paper); letter-spacing: -.03em; margin-bottom: 14px;
        }
        .lp-cta-h2 em { font-style: italic; color: var(--sea-light); }
        .lp-cta-sub { font-size: 1rem; color: rgba(250,248,245,.5); margin-bottom: 36px; line-height: 1.6; }
        .lp-cta-btns { display: flex; flex-direction: column; align-items: center; gap: 12px; }
        .lp-cta-ghost {
          background: none; border: none;
          color: rgba(250,248,245,.38); font-size: .88rem;
          transition: color .2s; font-family: var(--font-body);
        }
        .lp-cta-ghost:hover { color: var(--paper); }

        /* ── Footer ───────────────────────────────────────── */
        .lp-footer {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 7vw; border-top: 1px solid var(--border);
          font-size: 13px; color: var(--muted); background: var(--paper);
        }
        .lp-footer-logo { font-family: var(--font-display); font-weight: 700; font-size: 1rem; color: var(--ink-soft); }

        /* ── Shared animations ────────────────────────────── */
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.45;transform:scale(1.4)} }

        /* ── Responsive — Tablet (≤900px) ─────────────────── */
        @media (max-width: 900px) {
          /* Hero: stack vertically, hide card cluster on small screens */
          .lp-hero { flex-direction: column; align-items: flex-start; padding: 72px 5vw 60px; min-height: auto; gap: 32px; }
          .lp-cards { width: 100%; max-width: 320px; height: 340px; align-self: center; }

          /* Sticky phone section */
          .lp-sticky-wrap { height: 300vh; }
          .lp-sticky-inner { flex-direction: column-reverse; padding: 28px 5vw; gap: 20px; justify-content: center; }
          .lp-sticky-text { max-width: 100%; min-height: auto; }
          .lp-phone { width: 190px; height: 370px; border-radius: 36px; border-width: 6px; }
          .lp-notch { width: 66px; height: 15px; }
          .lp-phone-glow { width: 220px; height: 220px; }

          /* Stats */
          .lp-stats { padding: 48px 5vw; }
          .lp-stats-grid { grid-template-columns: repeat(2,1fr); }

          /* Bento */
          .lp-bento-section { padding: 56px 5vw; }
          .lp-bento { grid-template-columns: 1fr 1fr; }
          .lp-bento-card { grid-column: span 1 !important; }

          /* How */
          .lp-how { padding: 56px 5vw; }
          .lp-how-steps { grid-template-columns: 1fr; gap: 28px; }
          .lp-how-connector { display: none !important; }
          .lp-how-step { text-align: left; display: flex; flex-direction: row; align-items: flex-start; gap: 20px; }
          .lp-how-num { margin: 0; flex-shrink: 0; width: 52px; height: 52px; font-size: 1rem; }
          .lp-how-step > div:last-child { flex: 1; }

          /* Activity */
          .lp-activity-section { padding: 56px 5vw; }
          .lp-activity-inner { grid-template-columns: 1fr; gap: 36px; }

          /* Deepdive */
          .lp-deepdive { padding: 28px 5vw 56px; }
          .lp-deepdive-row { grid-template-columns: 1fr; gap: 28px; padding: 36px 0; }
          .lp-deepdive-row--right .lp-deepdive-visual { order: 0; }
          .lp-deepdive-row--right .lp-deepdive-text { order: 0; }
          .lp-deepdive-visual { min-height: 200px; aspect-ratio: auto; padding: 32px; }

          /* CTA */
          .lp-cta { padding: 64px 5vw; }
        }

        /* ── Responsive — Mobile (≤600px) ─────────────────── */
        @media (max-width: 600px) {
          .lp-hero { padding: 60px 4vw 48px; gap: 24px; }
          .lp-h1 { font-size: clamp(2.4rem,9vw,3.2rem); margin-bottom: 14px; }
          .lp-sub { font-size: .97rem; margin-bottom: 24px; }
          .lp-hero-ctas { flex-direction: column; gap: 10px; }
          .lp-btn-primary, .lp-btn-ghost { width: 100%; justify-content: center; }

          /* Hide floating cards on very small screens to avoid clutter */
          .lp-cards { display: none; }

          /* Sticky phone — smaller */
          .lp-sticky-wrap { height: 400vh; }
          .lp-sticky-inner { padding: 20px 4vw; gap: 16px; }
          .lp-phone { width: 160px; height: 310px; border-radius: 28px; border-width: 5px; }
          .lp-notch { width: 54px; height: 12px; }
          .lp-phone-wrap { width: 100%; display: flex; justify-content: center; }
          .lp-scene-p { font-size: .92rem; }

          /* Stats */
          .lp-stats { padding: 40px 4vw; }
          .lp-stats-grid { grid-template-columns: repeat(2,1fr); gap: 1px; }
          .lp-stat { padding: 28px 16px; }

          /* Bento */
          .lp-bento-section { padding: 48px 4vw; }
          .lp-bento { grid-template-columns: 1fr; gap: 12px; }

          /* How */
          .lp-how { padding: 48px 4vw; }
          .lp-how-step { gap: 14px; }
          .lp-how-num { width: 44px; height: 44px; font-size: .9rem; }

          /* Activity */
          .lp-activity-section { padding: 48px 4vw; }
          .lp-activity-cards { gap: 7px; }

          /* Deepdive */
          .lp-deepdive { padding: 20px 4vw 48px; }
          .lp-deepdive-row { gap: 20px; padding: 28px 0; }
          .lp-deepdive-visual { min-height: 160px; padding: 24px; }
          .lp-deepdive-icon-wrap { width: 80px; height: 80px; border-radius: 20px; }
          .lp-deepdive-icon-wrap span { font-size: 36px !important; }

          /* CTA */
          .lp-cta { padding: 52px 4vw; }
          .lp-cta-h2 { font-size: clamp(1.9rem,8vw,2.8rem); }

          /* Footer */
          .lp-footer { flex-direction: column; gap: 6px; text-align: center; padding: 18px 4vw; }
        }

        /* ── Responsive — Very small (≤380px) ─────────────── */
        @media (max-width: 380px) {
          .lp-h1 { font-size: 2.2rem; }
          .lp-sticky-wrap { height: 400vh; }
          .lp-phone { width: 140px; height: 270px; }
          .lp-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
