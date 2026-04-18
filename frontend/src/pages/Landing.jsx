import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";

/* ── Inline styles scoped to this page only ──────────────────────────────
   All tokens (--paper, --sea, --ink, etc.) come from index.css.
   We only define Landing-specific rules here.
──────────────────────────────────────────────────────────────────────── */
const css = `
  .landing-page {
    width: 100%;
    overflow-x: hidden;
  }

  /* ── NAV ── */
  .landing-nav {
    position: fixed; top: 0; left: 0; right: 0; z-index: 200;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 48px; height: 62px;
    background: rgba(250,248,245,0.88);
    backdrop-filter: blur(14px);
    border-bottom: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .landing-nav__brand {
    font-family: var(--font-display);
    font-size: 1.3rem; font-weight: 700;
    color: var(--sea); text-decoration: none;
    letter-spacing: -0.01em;
  }
  .landing-nav__links {
    display: flex; align-items: center; gap: 8px;
  }
  .landing-nav__link {
    font-size: 0.88rem; font-weight: 500; color: var(--muted);
    text-decoration: none; padding: 6px 14px;
    border-radius: var(--radius-sm);
    transition: background 150ms, color 150ms;
  }
  .landing-nav__link:hover {
    background: var(--paper-alt); color: var(--ink); text-decoration: none;
  }
  .landing-nav__cta {
    margin-left: 8px;
    font-size: 0.88rem; font-weight: 600; padding: 8px 20px;
    background: linear-gradient(135deg, var(--sea) 0%, var(--sea-light) 100%);
    color: #f0fffe; border-radius: var(--radius-pill);
    text-decoration: none; border: none; cursor: pointer;
    box-shadow: var(--shadow-sea);
    transition: transform 140ms, box-shadow 140ms;
    display: inline-block;
  }
  .landing-nav__cta:hover {
    transform: translateY(-1px);
    box-shadow: 0 12px 28px rgba(26,122,110,0.3);
    text-decoration: none; color: #f0fffe;
  }

  /* ── HERO ── */
  .landing-hero {
    min-height: 100vh;
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: center;
    gap: 40px;
    padding: 100px 60px 80px;
    position: relative; overflow: hidden;
  }
  .landing-hero__orb-1 {
    position: absolute; border-radius: 999px; pointer-events: none;
    filter: blur(80px); opacity: 0.55;
    width: 520px; height: 520px; left: -160px; top: -160px;
    background: radial-gradient(circle, rgba(232,132,58,0.35), rgba(245,230,204,0.2));
    animation: lp-float 9s ease-in-out infinite;
  }
  .landing-hero__orb-2 {
    position: absolute; border-radius: 999px; pointer-events: none;
    filter: blur(80px); opacity: 0.45;
    width: 400px; height: 400px; right: -120px; bottom: -120px;
    background: radial-gradient(circle, rgba(26,122,110,0.32), rgba(200,236,226,0.2));
    animation: lp-float 12s ease-in-out infinite reverse;
  }
  @keyframes lp-float {
    0%,100% { transform: translateY(0px); }
    50%      { transform: translateY(-18px); }
  }
  .landing-hero__left {
    position: relative; z-index: 2;
  }
  .landing-hero__badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: var(--mint); color: var(--sea-strong);
    padding: 6px 14px; border-radius: var(--radius-pill);
    font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em;
    text-transform: uppercase; margin-bottom: 28px;
    border: 1px solid var(--border-accent);
  }
  .landing-hero__badge-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: var(--sea);
    animation: lp-pulse 1.8s infinite;
  }
  @keyframes lp-pulse {
    0%,100% { opacity: 1; transform: scale(1); }
    50%      { opacity: 0.35; transform: scale(0.55); }
  }
  .landing-hero__h1 {
    font-family: var(--font-display);
    font-size: clamp(2.6rem, 5vw, 4rem);
    font-weight: 700; line-height: 1.05;
    letter-spacing: -0.03em; margin: 0 0 20px;
    color: var(--ink);
  }
  .landing-hero__h1 em {
    font-style: italic; color: var(--accent); font-weight: 600;
  }
  .landing-hero__sub {
    font-size: 1rem; line-height: 1.7; color: var(--muted);
    max-width: 420px; margin: 0 0 36px;
  }
  .landing-hero__actions {
    display: flex; gap: 12px; align-items: center; flex-wrap: wrap;
  }
  .landing-btn-primary {
    padding: 12px 28px;
    background: linear-gradient(135deg, var(--sea) 0%, var(--sea-light) 100%);
    color: #f0fffe; border-radius: var(--radius-pill);
    font-size: 0.95rem; font-weight: 600;
    text-decoration: none; border: none; cursor: pointer;
    box-shadow: var(--shadow-sea);
    transition: transform 140ms, box-shadow 140ms;
    display: inline-block;
  }
  .landing-btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 16px 32px rgba(26,122,110,0.3);
    text-decoration: none; color: #f0fffe;
  }
  .landing-btn-ghost {
    padding: 11px 24px;
    background: transparent; color: var(--ink-soft);
    border-radius: var(--radius-pill);
    font-size: 0.95rem; font-weight: 500;
    text-decoration: none;
    border: 1.5px solid var(--border-strong);
    transition: background 140ms, border-color 140ms;
    display: inline-block;
  }
  .landing-btn-ghost:hover {
    background: var(--paper-alt); border-color: var(--ink);
    text-decoration: none; color: var(--ink);
  }

  /* ── PHONE MOCKUP ── */
  .landing-hero__right {
    position: relative; z-index: 2;
    display: flex; justify-content: center; align-items: center;
  }
  .landing-phone-wrap {
    position: relative;
    animation: lp-phone-float 6s ease-in-out infinite;
  }
  @keyframes lp-phone-float {
    0%,100% { transform: translateY(0px) rotate(-1deg); }
    50%      { transform: translateY(-14px) rotate(1deg); }
  }
  .landing-phone {
    width: 248px;
    background: var(--ink);
    border-radius: 38px;
    padding: 14px;
    box-shadow: 0 40px 80px rgba(26,20,16,0.22), 0 0 0 1px rgba(255,255,255,0.05);
  }
  .landing-phone__notch {
    width: 72px; height: 22px;
    background: var(--ink);
    border-radius: 0 0 14px 14px;
    margin: 0 auto 6px;
    display: flex; align-items: center; justify-content: center;
  }
  .landing-phone__camera {
    width: 7px; height: 7px; border-radius: 50%;
    background: #1e1e1e; border: 2px solid #2a2a2a;
  }
  .landing-phone__screen {
    background: var(--paper);
    border-radius: 26px; overflow: hidden; height: 460px;
  }
  .lp-screen-header {
    background: var(--panel-raised); padding: 12px 14px 10px;
    display: flex; align-items: center; justify-content: space-between;
    border-bottom: 1px solid var(--border);
  }
  .lp-screen-brand {
    font-family: var(--font-display); font-weight: 700;
    font-size: 15px; color: var(--sea); letter-spacing: -0.01em;
  }
  .lp-screen-icons { display: flex; gap: 10px; }
  .lp-screen-icon {
    width: 26px; height: 26px; border-radius: 50%;
    background: var(--mint); display: flex; align-items: center;
    justify-content: center; font-size: 12px;
  }
  .lp-stories {
    display: flex; gap: 10px; padding: 10px 12px;
    border-bottom: 1px solid var(--border); overflow: hidden;
  }
  .lp-story { display: flex; flex-direction: column; align-items: center; gap: 3px; }
  .lp-story__ring {
    width: 40px; height: 40px; border-radius: 50%;
    border: 2px solid var(--accent); padding: 2px;
    display: flex; align-items: center; justify-content: center;
  }
  .lp-story__av {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 12px; font-weight: 700; color: #fff;
  }
  .lp-story__name { font-size: 8px; color: var(--muted); font-family: var(--font-body); }
  .lp-post { background: var(--panel-raised); margin: 8px 0 0; }
  .lp-post__header { display: flex; align-items: center; gap: 8px; padding: 9px 12px; }
  .lp-post__av {
    width: 26px; height: 26px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 700; color: #fff;
  }
  .lp-post__user { font-size: 10px; font-weight: 600; color: var(--ink); font-family: var(--font-body); }
  .lp-post__time { font-size: 8px; color: var(--muted); margin-left: auto; font-family: var(--font-body); }
  .lp-post__image {
    width: 100%; height: 148px;
    display: flex; align-items: center; justify-content: center;
    font-size: 36px;
  }
  .lp-post__actions { display: flex; gap: 12px; padding: 8px 12px 4px; font-size: 14px; }
  .lp-post__likes { font-size: 9px; font-weight: 600; color: var(--ink); padding: 0 12px 3px; font-family: var(--font-body); }
  .lp-post__caption { font-size: 9px; color: var(--ink-soft); padding: 0 12px 10px; line-height: 1.5; font-family: var(--font-body); }

  /* Floating badges */
  .lp-badge {
    position: absolute;
    background: var(--panel-raised);
    border-radius: var(--radius-md);
    padding: 10px 14px;
    box-shadow: var(--shadow-md);
    border: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
    white-space: nowrap;
  }
  .lp-badge__icon { font-size: 16px; }
  .lp-badge__title { font-size: 11px; font-weight: 600; color: var(--ink); font-family: var(--font-body); }
  .lp-badge__sub   { font-size: 10px; color: var(--muted); font-family: var(--font-body); }
  .lp-badge--left  { bottom: 32px; left: -56px; animation: lp-float 7s ease-in-out infinite; }
  .lp-badge--right { top: 70px; right: -44px; animation: lp-float 8s ease-in-out infinite 1.2s; }

  /* ── STATS STRIP ── */
  .landing-stats {
    background: var(--ink);
    display: flex; justify-content: space-around; align-items: center;
    padding: 44px 60px; flex-wrap: wrap; gap: 24px;
  }
  .landing-stats__item { text-align: center; }
  .landing-stats__num {
    font-family: var(--font-display);
    font-size: 2.6rem; font-weight: 700; line-height: 1;
    color: #f0fffe; margin-bottom: 6px;
  }
  .landing-stats__num span { color: var(--accent); }
  .landing-stats__label {
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.12em;
    color: rgba(250,248,245,0.45);
  }
  .landing-stats__div {
    width: 1px; height: 48px;
    background: rgba(250,248,245,0.1);
  }

  /* ── FEATURES ── */
  .landing-features {
    padding: 100px 60px;
  }
  .landing-section-label {
    font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: var(--sea); font-weight: 600; margin-bottom: 14px;
  }
  .landing-section-title {
    font-family: var(--font-display);
    font-size: clamp(1.9rem, 3.5vw, 2.8rem);
    font-weight: 700; line-height: 1.1;
    letter-spacing: -0.03em; max-width: 540px; margin-bottom: 52px;
    color: var(--ink);
  }
  .landing-features__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px;
  }
  .landing-feature-card {
    background: var(--panel-raised);
    border-radius: var(--radius-lg);
    padding: 32px 28px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
    transition: transform 240ms, box-shadow 240ms;
    position: relative; overflow: hidden;
  }
  .landing-feature-card::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 3px;
    border-radius: 3px 3px 0 0;
    opacity: 0; transition: opacity 240ms;
  }
  .landing-feature-card:hover {
    transform: translateY(-5px);
    box-shadow: var(--shadow-lg);
  }
  .landing-feature-card:hover::after { opacity: 1; }
  .lp-fc--sea::after   { background: linear-gradient(90deg, var(--sea), var(--sea-light)); }
  .lp-fc--accent::after { background: var(--accent); }
  .lp-fc--success::after { background: var(--success); }
  .lp-fc--purple::after { background: #a855f7; }
  .landing-feature-card__emoji { font-size: 28px; margin-bottom: 18px; display: block; }
  .landing-feature-card__title {
    font-family: var(--font-display);
    font-size: 1.15rem; font-weight: 700; margin-bottom: 10px;
    color: var(--ink); letter-spacing: -0.01em;
  }
  .landing-feature-card__desc {
    font-size: 0.88rem; line-height: 1.7; color: var(--muted);
  }

  /* ── HOW IT WORKS ── */
  .landing-how {
    padding: 90px 60px;
    background: var(--ink);
    color: #f0fffe;
    position: relative; overflow: hidden;
  }
  .landing-how__orb {
    position: absolute; top: -100px; right: -100px;
    width: 500px; height: 500px; border-radius: 50%;
    background: rgba(26,122,110,0.08);
    pointer-events: none;
  }
  .landing-how .landing-section-label { color: var(--accent); }
  .landing-how .landing-section-title { color: #f0fffe; }
  .landing-steps {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 40px; position: relative;
  }
  .landing-steps::before {
    content: '';
    position: absolute; top: 28px; left: 8%; right: 8%; height: 1px;
    background: repeating-linear-gradient(
      90deg, rgba(250,248,245,0.15) 0, rgba(250,248,245,0.15) 6px,
      transparent 6px, transparent 14px
    );
  }
  .landing-step { position: relative; z-index: 1; }
  .landing-step__num {
    width: 56px; height: 56px; border-radius: 50%;
    background: var(--accent); color: #fff;
    font-family: var(--font-display); font-size: 1.3rem; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 20px;
    box-shadow: 0 8px 20px rgba(232,132,58,0.35);
    border: 3px solid var(--ink);
  }
  .landing-step__title {
    font-family: var(--font-display);
    font-size: 1.05rem; font-weight: 700;
    margin-bottom: 10px; color: #f0fffe;
  }
  .landing-step__desc {
    font-size: 0.87rem; line-height: 1.65;
    color: rgba(250,248,245,0.5);
  }

  /* ── TESTIMONIALS ── */
  .landing-testi { padding: 100px 60px; }
  .landing-testi__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 18px; margin-top: 48px;
  }
  .landing-testi-card {
    background: var(--panel-raised);
    border-radius: var(--radius-lg); padding: 28px;
    border: 1px solid var(--border);
    box-shadow: var(--shadow-sm);
  }
  .landing-testi-card__stars {
    color: var(--accent); font-size: 13px; letter-spacing: 3px; margin-bottom: 14px;
  }
  .landing-testi-card__text {
    font-size: 0.92rem; line-height: 1.7; color: var(--ink-soft);
    font-style: italic; margin-bottom: 22px;
  }
  .landing-testi-card__author {
    display: flex; align-items: center; gap: 12px;
  }
  .landing-testi-card__av {
    width: 38px; height: 38px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; color: #fff; flex-shrink: 0;
  }
  .landing-testi-card__name { font-size: 13px; font-weight: 600; color: var(--ink); }
  .landing-testi-card__handle { font-size: 11px; color: var(--muted); }

  /* ── CTA ── */
  .landing-cta { padding: 70px 60px; }
  .landing-cta__card {
    background: var(--ink);
    border-radius: var(--radius-xl); padding: 80px 40px;
    text-align: center; position: relative; overflow: hidden;
  }
  .landing-cta__orb-1 {
    position: absolute; top: -80px; left: -80px;
    width: 320px; height: 320px; border-radius: 50%;
    background: rgba(232,132,58,0.12); pointer-events: none;
  }
  .landing-cta__orb-2 {
    position: absolute; bottom: -100px; right: -60px;
    width: 420px; height: 420px; border-radius: 50%;
    background: rgba(26,122,110,0.1); pointer-events: none;
  }
  .landing-cta__title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4.5vw, 3.4rem);
    font-weight: 700; line-height: 1.05; letter-spacing: -0.03em;
    color: #f0fffe; margin-bottom: 18px;
    position: relative; z-index: 1;
  }
  .landing-cta__title span { color: var(--accent); font-style: italic; }
  .landing-cta__sub {
    font-size: 0.97rem; color: rgba(250,248,245,0.5);
    margin-bottom: 38px; max-width: 420px;
    margin-left: auto; margin-right: auto;
    position: relative; z-index: 1;
  }
  .landing-cta__btns {
    display: flex; gap: 12px; justify-content: center;
    flex-wrap: wrap; position: relative; z-index: 1;
  }
  .landing-btn-light {
    padding: 12px 28px;
    background: var(--paper); color: var(--ink);
    border-radius: var(--radius-pill);
    font-size: 0.95rem; font-weight: 600;
    text-decoration: none; border: none; cursor: pointer;
    transition: transform 140ms;
    display: inline-block;
  }
  .landing-btn-light:hover {
    transform: translateY(-2px);
    text-decoration: none; color: var(--ink);
  }
  .landing-btn-outline-light {
    padding: 11px 24px;
    background: transparent; color: rgba(250,248,245,0.75);
    border-radius: var(--radius-pill);
    font-size: 0.95rem; font-weight: 500;
    text-decoration: none;
    border: 1.5px solid rgba(250,248,245,0.25);
    transition: border-color 140ms, color 140ms;
    display: inline-block;
  }
  .landing-btn-outline-light:hover {
    border-color: var(--paper); color: var(--paper);
    text-decoration: none;
  }

  /* ── FOOTER ── */
  .landing-footer {
    background: #100e0c; color: rgba(250,248,245,0.4);
    padding: 50px 60px 28px;
  }
  .landing-footer__top {
    display: flex; justify-content: space-between; flex-wrap: wrap;
    gap: 40px; margin-bottom: 50px;
  }
  .landing-footer__brand-name {
    font-family: var(--font-display); font-weight: 700;
    font-size: 1.3rem; color: rgba(250,248,245,0.85);
    letter-spacing: -0.01em;
  }
  .landing-footer__brand-name span { color: var(--accent); font-style: italic; }
  .landing-footer__tagline {
    font-size: 0.82rem; color: rgba(250,248,245,0.35);
    margin-top: 10px; max-width: 200px; line-height: 1.6;
  }
  .landing-footer__col h4 {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.14em;
    color: rgba(250,248,245,0.3); margin-bottom: 16px; font-weight: 600;
  }
  .landing-footer__col ul { list-style: none; padding: 0; margin: 0; }
  .landing-footer__col li { margin-bottom: 10px; }
  .landing-footer__col a {
    font-size: 0.85rem; color: rgba(250,248,245,0.5);
    text-decoration: none; transition: color 150ms;
  }
  .landing-footer__col a:hover { color: rgba(250,248,245,0.85); }
  .landing-footer__bottom {
    border-top: 1px solid rgba(250,248,245,0.07);
    padding-top: 22px;
    display: flex; justify-content: space-between; flex-wrap: wrap; gap: 8px;
    font-size: 0.78rem;
  }

  /* ── SCROLL REVEAL ── */
  .lp-reveal {
    opacity: 0; transform: translateY(28px);
    transition: opacity 0.65s cubic-bezier(0.25,0.8,0.25,1),
                transform 0.65s cubic-bezier(0.25,0.8,0.25,1);
  }
  .lp-reveal.lp-visible { opacity: 1; transform: translateY(0); }
  .lp-delay-1 { transition-delay: 0.1s; }
  .lp-delay-2 { transition-delay: 0.2s; }
  .lp-delay-3 { transition-delay: 0.3s; }
  .lp-delay-4 { transition-delay: 0.4s; }

  /* ── RESPONSIVE ── */
  @media (max-width: 860px) {
    .landing-nav { padding: 0 20px; }
    .landing-nav__link { display: none; }
    .landing-hero {
      grid-template-columns: 1fr; padding: 100px 24px 60px; gap: 50px;
    }
    .landing-hero__right { order: -1; }
    .landing-phone { width: 218px; }
    .landing-phone__screen { height: 390px; }
    .lp-badge--left { left: -12px; }
    .lp-badge--right { right: -6px; }
    .landing-stats { padding: 32px 24px; }
    .landing-stats__div { display: none; }
    .landing-features, .landing-how, .landing-testi, .landing-cta { padding: 60px 24px; }
    .landing-footer { padding: 40px 24px 24px; }
    .landing-steps::before { display: none; }
  }
`;

const stories = [
  { initial: "A", bg: "var(--accent)" },
  { initial: "R", bg: "var(--sea)" },
  { initial: "K", bg: "#a855f7" },
  { initial: "P", bg: "var(--success)" },
];

const features = [
  {
    emoji: "🔐",
    title: "OTP Verified Signup",
    desc: "Your account is secured from day one. Verify your email with a one-time password — no bots, no fake accounts.",
    cls: "lp-fc--sea",
  },
  {
    emoji: "📸",
    title: "Photo Posts",
    desc: "Upload stunning photos with captions, collect likes and comments, and build a beautiful visual feed that's yours.",
    cls: "lp-fc--accent",
  },
  {
    emoji: "👥",
    title: "Follow Anyone",
    desc: "Discover interesting people and follow them instantly. Your personalized feed shows only the people you care about.",
    cls: "lp-fc--success",
  },
  {
    emoji: "💬",
    title: "Real-time Messaging",
    desc: "Slide into DMs with instant messaging powered by WebSockets. Conversations happen in real time — no refresh needed.",
    cls: "lp-fc--purple",
  },
];

const steps = [
  {
    num: "1",
    title: "Create your account",
    desc: "Enter your email, get an OTP, pick a username and password. Done in under 60 seconds.",
  },
  {
    num: "2",
    title: "Set up your profile",
    desc: "Upload a photo, write a bio, add a link. Let the world know who you are.",
  },
  {
    num: "3",
    title: "Post, follow & message",
    desc: "Share photos, discover people, and have real conversations — all in one place.",
  },
];

const testimonials = [
  {
    text: "The OTP signup made me feel safe right away. And the feed is so clean — no ads, no noise. Just people I actually follow.",
    name: "Ananya Sharma",
    handle: "@ananya.s",
    bg: "var(--accent)",
  },
  {
    text: "Messages are instant. It genuinely feels like chatting in real life. I've reconnected with so many people on here.",
    name: "Karan Mehta",
    handle: "@karan.m",
    bg: "var(--sea)",
  },
  {
    text: "Posting here is effortless. My follower count doubled in a week just from people finding me through the explore feed.",
    name: "Priya Desai",
    handle: "@priya.d",
    bg: "var(--success)",
  },
];

function Landing() {
  const revealRef = useRef([]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) e.target.classList.add("lp-visible");
        });
      },
      { threshold: 0.12 }
    );
    revealRef.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const addReveal = (index) => (el) => {
    revealRef.current[index] = el;
  };

  return (
    <>
      <style>{css}</style>

      <div className="landing-page">
        {/* ── NAV ── */}
        <nav className="landing-nav">
          <span className="landing-nav__brand">SocioSpace</span>
          <div className="landing-nav__links">
            <a href="#features" className="landing-nav__link">Features</a>
            <a href="#how" className="landing-nav__link">How it works</a>
            <Link to="/register" className="landing-nav__cta">Join Free</Link>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="landing-hero">
          <div className="landing-hero__orb-1" />
          <div className="landing-hero__orb-2" />

          <div className="landing-hero__left">
            <div className="landing-hero__badge">
              <span className="landing-hero__badge-dot" />
              Now Live — Join the Community
            </div>
            <h1 className="landing-hero__h1">
              Your world,<br /><em>beautifully</em><br />shared.
            </h1>
            <p className="landing-hero__sub">
              SocioSpace is where real connections happen — post photos, follow friends,
              slide into DMs, and build your corner of the internet.
            </p>
            <div className="landing-hero__actions">
              <Link to="/register" className="landing-btn-primary">
                Create your account →
              </Link>
              <a href="#features" className="landing-btn-ghost">
                See features
              </a>
            </div>
          </div>

          <div className="landing-hero__right">
            <div className="landing-phone-wrap">
              {/* Floating badges */}
              <div className="lp-badge lp-badge--left">
                <span className="lp-badge__icon">💬</span>
                <div>
                  <div className="lp-badge__title">New message</div>
                  <div className="lp-badge__sub">@riya.s: "loved your post!"</div>
                </div>
              </div>
              <div className="lp-badge lp-badge--right">
                <span className="lp-badge__icon">❤️</span>
                <div>
                  <div className="lp-badge__title">142 likes</div>
                  <div className="lp-badge__sub">on your latest photo</div>
                </div>
              </div>

              <div className="landing-phone">
                <div className="landing-phone__notch">
                  <div className="landing-phone__camera" />
                </div>
                <div className="landing-phone__screen">
                  <div className="lp-screen-header">
                    <span className="lp-screen-brand">SocioSpace</span>
                    <div className="lp-screen-icons">
                      <div className="lp-screen-icon">💬</div>
                      <div className="lp-screen-icon">🔔</div>
                    </div>
                  </div>
                  <div className="lp-stories">
                    {stories.map((s, i) => (
                      <div className="lp-story" key={i}>
                        <div className="lp-story__ring">
                          <div className="lp-story__av" style={{ background: s.bg }}>
                            {s.initial}
                          </div>
                        </div>
                        <span className="lp-story__name">{i === 0 ? "Your story" : `user_${s.initial.toLowerCase()}`}</span>
                      </div>
                    ))}
                  </div>
                  <div className="lp-post">
                    <div className="lp-post__header">
                      <div className="lp-post__av" style={{ background: "var(--sea)" }}>R</div>
                      <div>
                        <div className="lp-post__user">riya.sharma</div>
                      </div>
                      <span className="lp-post__time">2m ago</span>
                    </div>
                    <div className="lp-post__image" style={{ background: "linear-gradient(135deg,#1a7a6e,#22a092)" }}>
                      🌄
                    </div>
                    <div className="lp-post__actions">
                      <span>❤️</span>
                      <span>💬</span>
                      <span>✈️</span>
                    </div>
                    <div className="lp-post__likes">142 likes</div>
                    <div className="lp-post__caption">
                      <strong>riya.sharma</strong> Golden hour never disappoints ✨
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <div className="landing-stats">
          {[
            { num: "10", suffix: "K+", label: "Active Users" },
            { num: "50", suffix: "K+", label: "Posts Shared" },
            { num: "200", suffix: "K+", label: "Connections Made" },
            { num: "99", suffix: "%", label: "Uptime" },
          ].map((s, i) => (
            <>
              {i > 0 && <div className="landing-stats__div" key={`div-${i}`} />}
              <div className="landing-stats__item" key={i}>
                <div className="landing-stats__num">
                  {s.num}<span>{s.suffix}</span>
                </div>
                <div className="landing-stats__label">{s.label}</div>
              </div>
            </>
          ))}
        </div>

        {/* ── FEATURES ── */}
        <section className="landing-features" id="features">
          <p className="landing-section-label lp-reveal" ref={addReveal(0)}>What you get</p>
          <h2 className="landing-section-title lp-reveal lp-delay-1" ref={addReveal(1)}>
            Everything you need<br />to build your presence.
          </h2>
          <div className="landing-features__grid">
            {features.map((f, i) => (
              <div
                key={i}
                className={`landing-feature-card ${f.cls} lp-reveal lp-delay-${i + 1}`}
                ref={addReveal(2 + i)}
              >
                <span className="landing-feature-card__emoji">{f.emoji}</span>
                <div className="landing-feature-card__title">{f.title}</div>
                <p className="landing-feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ── */}
        <section className="landing-how" id="how">
          <div className="landing-how__orb" />
          <p className="landing-section-label lp-reveal" ref={addReveal(10)}>Simple as it gets</p>
          <h2 className="landing-section-title lp-reveal lp-delay-1" ref={addReveal(11)}>
            Up and running<br />in 3 steps.
          </h2>
          <div className="landing-steps">
            {steps.map((s, i) => (
              <div
                key={i}
                className={`landing-step lp-reveal lp-delay-${i + 1}`}
                ref={addReveal(12 + i)}
              >
                <div className="landing-step__num">{s.num}</div>
                <div className="landing-step__title">{s.title}</div>
                <p className="landing-step__desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── TESTIMONIALS ── */}
        <section className="landing-testi">
          <p className="landing-section-label lp-reveal" ref={addReveal(20)}>People love it</p>
          <h2 className="landing-section-title lp-reveal lp-delay-1" ref={addReveal(21)}>
            Built for real people,<br />not algorithms.
          </h2>
          <div className="landing-testi__grid">
            {testimonials.map((t, i) => (
              <div
                key={i}
                className={`landing-testi-card lp-reveal lp-delay-${i + 1}`}
                ref={addReveal(22 + i)}
              >
                <div className="landing-testi-card__stars">★★★★★</div>
                <p className="landing-testi-card__text">"{t.text}"</p>
                <div className="landing-testi-card__author">
                  <div className="landing-testi-card__av" style={{ background: t.bg }}>
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="landing-testi-card__name">{t.name}</div>
                    <div className="landing-testi-card__handle">{t.handle}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="landing-cta" id="join">
          <div className="landing-cta__card">
            <div className="landing-cta__orb-1" />
            <div className="landing-cta__orb-2" />
            <h2 className="landing-cta__title">
              Your space is<br /><span>waiting for you.</span>
            </h2>
            <p className="landing-cta__sub">
              Join thousands already sharing their world on SocioSpace. Free forever, no credit card needed.
            </p>
            <div className="landing-cta__btns">
              <Link to="/register" className="landing-btn-light">
                Create Free Account →
              </Link>
              <Link to="/login" className="landing-btn-outline-light">
                Sign In
              </Link>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="landing-footer">
          <div className="landing-footer__top">
            <div>
              <div className="landing-footer__brand-name">
                <span>Socio</span>Space
              </div>
              <p className="landing-footer__tagline">
                Share your world, connect with people who matter.
              </p>
            </div>
            <div className="landing-footer__col">
              <h4>Product</h4>
              <ul>
                <li><a href="#features">Features</a></li>
                <li><a href="#how">How it works</a></li>
                <li><Link to="/register">Register</Link></li>
                <li><Link to="/login">Login</Link></li>
              </ul>
            </div>
            <div className="landing-footer__col">
              <h4>Legal</h4>
              <ul>
                <li><a href="#">Privacy Policy</a></li>
                <li><a href="#">Terms of Service</a></li>
              </ul>
            </div>
            <div className="landing-footer__col">
              <h4>Connect</h4>
              <ul>
                <li><a href="https://github.com/abhinavici">GitHub</a></li>
                <li><a href="mailto:iabhinav216@gmail.com">Contact Us</a></li>
                <li><a href="https://www.instagram.com/__iamabhinav__">Instagram</a></li>
                <li><a href="https://www.linkedin.com/in/abhinavici/">LinkedIn</a></li>
              </ul>
            </div>
          </div>
          <div className="landing-footer__bottom">
            <span>© 2026 SocioSpace. All rights reserved.</span>
            <span>Made with ❤️ in India</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default Landing;
