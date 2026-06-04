
import React from 'react';
import { Course, CurricularUnit } from '../types';

interface HomeProps {
  onExplore: () => void;
  onSubmitVideo: () => void;
  onNavigatePage?: (slug: string) => void;
  onSelectCourse?: (courseId: string) => void;
  t: (key: string) => string;
  courses: Course[];
  units: CurricularUnit[];
}

const Home: React.FC<HomeProps> = ({ onExplore, onSubmitVideo, onNavigatePage, onSelectCourse, t, courses, units }) => {
  const totalUnits = units.length;
  const totalCourses = courses.length;
  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-7">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] border border-black/20 px-3 py-1 mb-8 inline-block">
              {t('home.heroBadge')}
            </span>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-12">
              {t('home.heroTitle')
                .split('|')
                .map((line, idx, arr) => (
                  <React.Fragment key={`${line}-${idx}`}>
                    {line}
                    {idx < arr.length - 1 && <br />}
                  </React.Fragment>
                ))}
            </h1>
            <p className="text-lg lg:text-xl text-gray-500 font-medium leading-relaxed max-w-2xl mb-12">
              {t('home.heroLead')}
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={onExplore}
                className="bg-primary text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all"
              >
                {t('home.heroCtaPrimary')}
              </button>
              <button
                onClick={() => onNavigatePage?.('sobre-open2')}
                className="bg-white text-black px-8 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:bg-brand-muted transition-all"
              >
                {t('home.heroCtaSecondary')}
              </button>
            </div>
            <p className="mt-8 text-[9px] font-bold uppercase text-gray-400 tracking-[0.2em]">
              <span className="bg-black text-white px-2 py-0.5 mr-2 italic">{t('home.heroPillOpenLabel')}</span>
              {t('home.heroPillOpenDescription')}
            </p>
          </div>
          
          <div className="lg:col-span-5">
            <div className="bg-brand-muted p-10 stark-border relative">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 mb-10">{t('home.heroCardLabel')}</h4>
              <div className="space-y-12">
                <div>
                  <p className="text-6xl font-black tracking-tighter">{totalCourses}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('home.heroCardCoursesLabel')}</p>
                </div>
                <div>
                  <p className="text-6xl font-black tracking-tighter">{totalUnits}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">{t('home.heroCardUnitsLabel')}</p>
                </div>
              </div>
              <div className="mt-12 pt-8 border-t border-black/10 text-[10px] font-medium leading-relaxed italic text-gray-500">
                {t('home.heroCardFoot')}
              </div>
              <div className="absolute -bottom-4 -right-4 w-12 h-12 bg-primary stark-border"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Values & Audience Section */}
      <section className="bg-brand-muted/30 border-y border-black/5 py-24">
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-24">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">{t('home.valuesTitle')}</h2>
            <ul className="space-y-6">
              {[
                t('home.values.access'),
                t('home.values.community'),
                t('home.values.transparency'),
                t('home.values.inclusion'),
                t('home.values.sustainability'),
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 bg-black mt-2 shrink-0"></div>
                  <p className="text-sm font-medium leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-12">{t('home.audienceTitle')}</h2>
            <ul className="space-y-6">
              {[
                t('home.audience.1'),
                t('home.audience.2'),
                t('home.audience.3'),
                t('home.audience.4'),
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 bg-black mt-2 shrink-0"></div>
                  <p className="text-sm font-medium leading-relaxed">{item}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Experience Section */}
      <section className="py-24 border-b border-black/5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 text-center mb-16">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] bg-brand-muted px-3 py-1 mb-6 inline-block">{t('home.featuresEyebrow')}</span>
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter">{t('home.featuresTitle')}</h2>
          <p className="text-gray-400 font-medium uppercase text-[10px] tracking-widest mt-4">{t('home.featuresSubtitle')}</p>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { icon: 'map', title: t('home.feature.map.title'), desc: t('home.feature.map.description') },
            { icon: 'playlist_play', title: t('home.feature.playlists.title'), desc: t('home.feature.playlists.description') },
            { icon: 'check_circle', title: t('home.feature.progress.title'), desc: t('home.feature.progress.description') },
            { icon: 'groups', title: t('home.feature.curatorship.title'), desc: t('home.feature.curatorship.description') },
          ].map((feat, i) => (
            <div key={i} className="stark-border p-10 hover:bg-primary transition-all group">
              <span className="material-symbols-outlined text-4xl mb-8 group-hover:scale-110 transition-transform">{feat.icon}</span>
              <h4 className="text-sm font-black uppercase tracking-tight mb-4">{feat.title}</h4>
              <p className="text-xs font-medium text-gray-500 group-hover:text-black leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Courses Section */}
      <section className="py-24 bg-brand-muted/10">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12 flex justify-between items-end mb-16">
          <div>
            <span className="text-[9px] font-bold uppercase tracking-[0.4em] mb-4 block">{t('home.coursesEyebrow')}</span>
            <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-none">{t('home.coursesTitle')}</h2>
            <p className="text-sm text-gray-500 font-medium uppercase tracking-widest mt-4 max-w-2xl">{t('home.coursesSubtitle')}</p>
          </div>
          <button
            onClick={onExplore}
            className="hidden lg:block stark-border px-8 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all"
          >
            {t('home.viewAllCourses')}
          </button>
        </div>
        <div className="max-w-[1600px] mx-auto px-6 md:px-8 lg:px-12 grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-12">
          {courses.map((course, i) => (
            <button
              key={i}
              onClick={() => onSelectCourse?.(course.id)}
              className="bg-white stark-border p-12 group hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] transition-all cursor-pointer text-left"
            >
              <span className="text-[9px] font-bold uppercase tracking-widest text-gray-400 border border-black/10 px-2 py-1 mb-8 inline-block">PLANO 2025/2026</span>
              <h3 className="text-3xl font-black uppercase tracking-tighter mb-8 group-hover:text-primary transition-colors">{course.title}</h3>
              <p className="text-sm font-medium text-gray-500 mb-12 leading-relaxed">{course.description}</p>
              <div className="flex justify-between items-end pt-8 border-t border-black/10">
                <div className="flex gap-12">
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">ECTS</p>
                    <p className="text-xs font-bold">{course.ects}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">SEMESTRES</p>
                    <p className="text-xs font-bold">{course.semesters}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="bg-primary stark-border px-3 py-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                    <span className="text-[10px] font-black">
                      {units.filter(unit => unit.courseId === course.id).length} {t('home.courseCardFootSuffix')}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 border-y border-black/5">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] mb-4 block">{t('home.journeyEyebrow')}</span>
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-16">{t('home.journeyTitle')}</h2>
          <div className="space-y-12">
            {[
              { n: '1', title: t('home.journeyStep1'), color: 'text-primary' },
              { n: '2', title: t('home.journeyStep2'), color: 'text-primary' },
              { n: '3', title: t('home.journeyStep3'), color: 'text-primary' },
            ].map((step, i) => (
              <div key={i} className="flex gap-8 items-start">
                <span className={`text-6xl font-black italic leading-none ${step.color}`}>{step.n}</span>
                <p className="text-lg lg:text-xl font-black uppercase tracking-tighter mt-2 max-w-2xl">{step.title}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Manifesto Section */}
      <section className="py-24 bg-white">
        <div className="max-w-[1000px] mx-auto px-6 text-center border border-black/10 py-24 px-12 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-2 h-full bg-primary"></div>
          <span className="text-[9px] font-bold uppercase tracking-[0.4em] mb-12 block text-gray-400">{t('home.manifestoEyebrow')}</span>
          <h2 className="text-4xl lg:text-6xl font-black uppercase tracking-tighter mb-12 leading-[0.9]">
            {t('home.manifestoTitle')}
          </h2>
          <p className="text-gray-500 font-medium leading-relaxed mb-12 max-w-2xl mx-auto uppercase text-xs tracking-widest">
            {t('home.manifestoDescription')}
          </p>
          <button
            onClick={() => onNavigatePage?.('manifesto')}
            className="text-[10px] font-black uppercase tracking-[0.3em] underline decoration-primary decoration-4 underline-offset-8 hover:bg-primary transition-all"
          >
            {t('home.readManifesto')}
          </button>
        </div>
      </section>

      {/* Institutional Recognition Section */}
      <section className="py-24 bg-brand-muted border-y-4 border-black">
        <div className="max-w-[1600px] mx-auto px-6 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            {/* Left: Badges */}
            <div className="flex flex-col gap-4">
              <div className="bg-black text-white px-4 py-3 stark-border text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">{t('institutional.seaEu.badge')}</p>
              </div>
              <div className="bg-black text-white px-4 py-3 stark-border text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">{t('institutional.ualg.badge')}</p>
              </div>
              <div className="bg-primary text-black px-4 py-3 stark-border text-center">
                <p className="text-[10px] font-black uppercase tracking-widest">{t('institutional.education.badge')}</p>
              </div>
            </div>

            {/* Center: Text */}
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter mb-6 leading-tight">
                {t('institutional.homepage.title')}
              </h2>
              <p className="text-sm font-medium text-gray-600 leading-relaxed mb-8">
                {t('institutional.homepage.textLong')}
              </p>
              <button
                onClick={() => onNavigatePage?.('sobre')}
                className="bg-black text-white px-8 py-4 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
              >
                {t('institutional.homepage.cta')}
              </button>
            </div>

            {/* Right: Key info */}
            <div className="space-y-6">
              <div className="stark-border p-6 bg-white">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Iniciativa</p>
                <p className="text-sm font-bold">{t('institutional.project.publicName')}</p>
              </div>
              <div className="stark-border p-6 bg-white">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Instituição</p>
                <p className="text-sm font-bold">{t('institutional.ualg.link')}</p>
              </div>
              <div className="stark-border p-6 bg-white">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Aliança</p>
                <p className="text-sm font-bold">{t('institutional.seaEu.link')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-white">
        <div className="max-w-[1600px] mx-auto px-6 text-center">
          <h2 className="text-5xl lg:text-8xl font-black uppercase tracking-tighter mb-12 italic">{t('home.ctaTitle')}</h2>
          <p className="text-lg font-medium text-gray-500 mb-12 max-w-2xl mx-auto uppercase tracking-widest">{t('home.ctaDescription')}</p>
          <div className="flex flex-wrap justify-center gap-6">
            <button 
              onClick={onExplore}
              className="bg-primary text-black px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] stark-border hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] transition-all"
            >
              {t('home.ctaPrimary')}
            </button>
            <button
              onClick={onSubmitVideo}
              className="bg-white text-black px-12 py-5 text-[10px] font-black uppercase tracking-[0.4em] stark-border hover:bg-brand-muted transition-all inline-flex items-center"
            >
              {t('home.ctaSecondary')}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
