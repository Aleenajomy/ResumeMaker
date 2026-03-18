import React from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowRight,
  CheckCircle2,
  FileText,
  Gauge,
  LayoutDashboard,
  LogOut,
  Mail,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { isAuthenticated } from '../utils/auth';

interface FeatureItem {
  title: string;
  description: string;
  icon: LucideIcon;
  iconClass: string;
}

interface StepItem {
  step: string;
  title: string;
  description: string;
}

const featureItems: FeatureItem[] = [
  {
    title: 'ATS Score',
    description: 'Measure how well your resume aligns with ATS readability and structure.',
    icon: Gauge,
    iconClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'Keyword Match',
    description: 'See matched and missing role keywords before you send your application.',
    icon: Sparkles,
    iconClass: 'bg-teal-100 text-teal-700',
  },
  {
    title: 'Resume Generation',
    description: 'Generate tailored resumes from your base file in a guided workflow.',
    icon: FileText,
    iconClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    title: 'Cover Letter + Email',
    description: 'Create a polished cover letter and application email in the same flow.',
    icon: Mail,
    iconClass: 'bg-lime-100 text-lime-700',
  },
];

const steps: StepItem[] = [
  {
    step: 'Step 1',
    title: 'Upload Base Resume',
    description: 'Store your resume once in Dashboard as your source file.',
  },
  {
    step: 'Step 2',
    title: 'Paste Job Description',
    description: 'Add role details and requirements for the target position.',
  },
  {
    step: 'Step 3',
    title: 'Generate Documents',
    description: 'Get ATS-ready resume, cover letter, and application email.',
  },
  {
    step: 'Step 4',
    title: 'Review and Apply',
    description: 'Use score and keyword insights to submit with confidence.',
  },
];

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const authenticated = isAuthenticated();

  const goProtected = (path: '/resume-optimizer' | '/dashboard') =>
    navigate(authenticated ? path : '/login');

  const handleLogout = () => {
    authService.logout();
    navigate('/login', { replace: true });
  };

  const ctaRoute = authenticated ? '/resume-optimizer' : '/login';

  return (
    <div className="min-h-screen bg-[#f4f8f7] text-slate-900">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-[-140px] top-16 h-80 w-80 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="absolute right-[-120px] top-[-40px] h-96 w-96 rounded-full bg-teal-200/30 blur-3xl" />
        <div className="absolute left-1/2 top-44 h-[28rem] w-[30rem] -translate-x-1/2 rounded-full bg-violet-200/25 blur-3xl" />
      </div>

      <nav className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 font-['Manrope'] text-2xl font-bold tracking-tight text-emerald-600"
          >
            <Sparkles size={20} />
            ResumeMaker
          </button>

          <div className="hidden items-center gap-7 text-sm font-medium text-slate-700 lg:flex">
            <a href="#features" className="transition-colors hover:text-slate-900">
              Features
            </a>
            <a href="#pricing" className="transition-colors hover:text-slate-900">
              Pricing
            </a>
            <a href="#how-it-works" className="transition-colors hover:text-slate-900">
              How it works
            </a>
          </div>

          <div className="flex items-center gap-3">
            {authenticated ? (
              <>
                <button
                  type="button"
                  onClick={() => goProtected('/resume-optimizer')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Resume Generator
                </button>
                <button
                  type="button"
                  onClick={() => goProtected('/dashboard')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100"
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => navigate(ctaRoute)}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-600"
                >
                  Get Started
                  <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="relative z-10">
        <section className="mx-auto grid max-w-7xl gap-14 px-6 pb-20 pt-14 lg:grid-cols-[1.03fr_0.97fr] lg:pt-20">
          <div className="reveal-up">
            <p className="mb-6 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.1em] text-indigo-600">
              <Sparkles size={14} />
              Resume Checker
            </p>
            <h1 className="font-['Manrope'] text-4xl font-bold leading-tight text-slate-800 sm:text-5xl lg:text-[4.2rem] lg:leading-[1.05]">
              Is your resume good enough?
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-relaxed text-slate-600">
              A fast AI resume checker that scores your resume, improves ATS match, and generates
              optimized resume, cover letter, and email content for each role.
            </p>

            <div className="mt-8 w-full max-w-[34rem] rounded-2xl border border-emerald-300/80 bg-white/85 p-7 shadow-[0_26px_60px_-45px_rgba(16,185,129,0.6)]">
              <p className="text-center text-lg leading-relaxed text-slate-600">
                Drop your resume here or choose a file.
                <br />
                PDF &amp; DOCX only. Max 2MB file size.
              </p>
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => goProtected("/dashboard")}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-6 py-3 text-lg font-semibold text-white transition hover:bg-emerald-600"
                >
                  Upload Your Resume
                  <ArrowRight size={18} />
                </button>
              </div>
              <p className="mt-5 inline-flex w-full items-center justify-center gap-2 text-sm font-semibold text-slate-600">
                <ShieldCheck size={16} className="text-slate-500" />
                Privacy guaranteed
              </p>
            </div>

            <div className="mt-7 flex flex-wrap items-center gap-4 text-sm text-slate-600">
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Smart ATS improvements
              </p>
              <p className="inline-flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-500" />
                Resume Generator + Dashboard workflow
              </p>
            </div>
          </div>

          <div className="hero-float reveal-up" style={{ animationDelay: '120ms' }}>
            <div className="relative rounded-[2rem] border border-slate-200/90 bg-white/90 p-4 shadow-[0_24px_70px_-38px_rgba(99,102,241,0.6)] lg:p-6">
              <div className="grid gap-4 lg:grid-cols-[13rem_1fr]">
                <aside className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Resume Score
                  </p>
                  <div className="mt-3 flex justify-center">
                    <div className="flex h-24 w-24 items-center justify-center rounded-full border-8 border-emerald-200 text-2xl font-bold text-emerald-600">
                      92
                    </div>
                  </div>
                  <p className="mt-2 text-center text-xs font-medium text-slate-500">out of 100</p>
                  <div className="mt-5 space-y-2.5 text-xs">
                    <p className="flex justify-between text-slate-600">
                      <span>ATS Parse Rate</span>
                      <span className="font-semibold text-emerald-700">Good</span>
                    </p>
                    <p className="flex justify-between text-slate-600">
                      <span>Keyword Match</span>
                      <span className="font-semibold text-emerald-700">High</span>
                    </p>
                    <p className="flex justify-between text-slate-600">
                      <span>Missing Keywords</span>
                      <span className="font-semibold text-rose-700">3</span>
                    </p>
                  </div>
                </aside>

                <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-700">Content Checks</p>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      8 issues found
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[72%] rounded-full bg-emerald-500" />
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[84%] rounded-full bg-emerald-500" />
                    </div>
                    <div className="h-2 rounded-full bg-slate-200">
                      <div className="h-2 w-[60%] rounded-full bg-emerald-500" />
                    </div>
                  </div>
                  <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                      ATS Parse Rate
                    </p>
                    <div className="mt-4 h-3 rounded-full bg-slate-200">
                      <div className="h-3 w-[74%] rounded-full bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <div className="mt-4 space-y-2">
                      <div className="h-2 rounded-full bg-slate-100" />
                      <div className="h-2 rounded-full bg-slate-100" />
                      <div className="h-2 rounded-full bg-slate-100" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-12">
          <div className="reveal-up mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Features
            </p>
            <h2 className="font-['Manrope'] text-3xl font-bold text-slate-900 sm:text-4xl">
              Everything needed for better applications
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featureItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <article
                  key={item.title}
                  className="reveal-up rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-[0_10px_30px_-20px_rgba(16,185,129,0.45)] transition-transform duration-300 hover:-translate-y-1.5"
                  style={{ animationDelay: `${index * 80 + 100}ms` }}
                >
                  <div className={`mb-4 inline-flex rounded-xl p-2.5 ${item.iconClass}`}>
                    <Icon size={20} />
                  </div>
                  <h3 className="font-['Manrope'] text-xl font-semibold text-slate-900">
                    {item.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-7xl px-6 py-14">
          <div className="reveal-up mx-auto max-w-2xl text-center">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">
              How it works
            </p>
            <h2 className="font-['Manrope'] text-3xl font-bold text-slate-900 sm:text-4xl">
              From base resume to tailored application in four steps
            </h2>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <article
                key={item.title}
                className="reveal-up rounded-2xl border border-slate-200 bg-white p-5"
                style={{ animationDelay: `${index * 70 + 120}ms` }}
              >
                <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
                  {item.step}
                </p>
                <h3 className="font-['Manrope'] text-xl font-semibold text-slate-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="pricing" className="mx-auto max-w-7xl px-6 pb-16 pt-10">
          <div className="reveal-up rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-[0_18px_60px_-35px_rgba(20,184,166,0.7)] md:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  Pricing
                </p>
                <h2 className="mt-2 font-['Manrope'] text-3xl font-bold text-slate-900">
                  Start free, scale when you are ready
                </h2>
                <p className="mt-4 max-w-2xl text-slate-600">
                  Begin with your existing resume and generate role-specific documents in minutes.
                  Upgrade when you need higher volume and faster iteration.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate(ctaRoute)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-emerald-600"
              >
                {authenticated ? (
                  <>
                    <Mail size={16} />
                    Open Resume Generator
                  </>
                ) : (
                  <>
                    <LayoutDashboard size={16} />
                    Create Free Account
                  </>
                )}
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
