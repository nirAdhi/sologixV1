import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { fetchProjects, buildTypes, FALLBACK_PROJECT_IMAGE } from './ProjectsPage';

// Photo gallery of the projects the admin manages in Admin → Projects.
// API fails → built-in project list (same as the Projects page).
// API OK but no projects → friendly "coming soon" message.
const Gallery = () => {
  const { t } = useT();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [openIndex, setOpenIndex] = useState(null); // index into `filtered`

  useEffect(() => {
    let alive = true;
    fetchProjects().then(({ projects: list }) => {
      if (!alive) return;
      setProjects(list);
      setLoading(false);
    });
    return () => { alive = false; };
  }, []);

  const types = buildTypes(projects);
  const activeFilter = types.includes(filter) ? filter : 'All';
  const filtered = activeFilter === 'All' ? projects : projects.filter(p => p.type === activeFilter);
  const open = openIndex !== null ? filtered[openIndex] : null;
  const empty = !loading && projects.length === 0;

  // Lightbox keyboard: Esc closes, arrows move
  useEffect(() => {
    if (openIndex === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpenIndex(null);
      else if (e.key === 'ArrowRight' && filtered.length > 1) setOpenIndex(i => (i + 1) % filtered.length);
      else if (e.key === 'ArrowLeft' && filtered.length > 1) setOpenIndex(i => (i - 1 + filtered.length) % filtered.length);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openIndex, filtered.length]);

  const pickFilter = (type) => { setFilter(type); setOpenIndex(null); };
  const onImgError = (e) => { if (e.target.src !== FALLBACK_PROJECT_IMAGE) e.target.src = FALLBACK_PROJECT_IMAGE; };
  const btnStyle = { fontFamily: 'Work Sans', fontSize: '14px', letterSpacing: '0.05em' };

  return (
    <div>
      <div className="pt-24 pb-24">
        <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] mb-16 text-center">
          <h1 className="text-[48px] font-bold text-[#141b2b] mb-4" style={{ fontFamily: 'Manrope' }}>{t('Powering the Future')}</h1>
          <p className="text-[18px] text-[#3d4a42] max-w-2xl mx-auto" style={{ fontFamily: 'Work Sans' }}>{t('Explore our portfolio of successful solar installations across residential, commercial, and industrial sectors. See how we deliver reliable, forward-thinking energy solutions.')}</p>
        </section>

        {loading && (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#006948]"></div></div>
        )}

        {empty && (
          <section className="max-w-md mx-auto px-5 text-center py-12">
            <div className="text-5xl mb-4">☀️</div>
            <h2 className="text-2xl font-bold text-[#141b2b] mb-2" style={{ fontFamily: 'Manrope' }}>{t('Projects coming soon')}</h2>
            <p className="text-[#3d4a42] mb-6" style={{ fontFamily: 'Work Sans' }}>{t('We are adding photos of our latest solar installations. Please check back soon.')}</p>
            <Link to="/booking" className="inline-block bg-[#006948] text-white px-8 py-3 rounded-full font-semibold hover:bg-green-700 transition-colors">
              {t('Start Your Solar Journey →')}
            </Link>
          </section>
        )}

        {!loading && !empty && (
          <>
            {types.length > 2 && (
              <section className="max-w-[1280px] mx-auto px-5 md:px-[64px] mb-12 flex justify-center gap-4 flex-wrap">
                {types.map(type => (
                  <button key={type} type="button" onClick={() => pickFilter(type)} aria-pressed={activeFilter === type}
                    className={'px-6 py-2 rounded-full border font-medium transition-colors ' +
                      (activeFilter === type
                        ? 'border-[#006948] bg-[#006948] text-white'
                        : 'border-[#E5E7EB] text-[#3d4a42] hover:border-[#006948] hover:text-[#006948]')}
                    style={btnStyle}>
                    {type === 'All' ? t('All Projects') : t(type)}
                  </button>
                ))}
              </section>
            )}

            <section className="max-w-[1280px] mx-auto px-5 md:px-[64px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((project, i) => (
                  <button key={project.id} type="button" onClick={() => setOpenIndex(i)}
                    className="relative block w-full h-72 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-[#E5E7EB] group text-left focus:outline-none focus-visible:ring-4 focus-visible:ring-[#006948]/40">
                    <img alt={project.title} loading="lazy" src={project.image_url || FALLBACK_PROJECT_IMAGE} onError={onImgError}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                    {project.type && (
                      <div className="absolute top-4 left-4 max-w-[70%] bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full border border-[#E5E7EB]">
                        <span className="block truncate text-[14px] font-medium text-[#006948]" style={{ fontFamily: 'Work Sans' }}>{t(project.type)}</span>
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5 pt-16 text-white">
                      <h3 className="text-[20px] font-semibold line-clamp-2 break-words" style={{ fontFamily: 'Manrope' }}>{t(project.title)}</h3>
                      <div className="flex items-center justify-between gap-3 mt-1 text-sm text-white/85" style={{ fontFamily: 'Work Sans' }}>
                        {project.location ? (
                          <span className="flex items-center gap-1 min-w-0">
                            <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
                            <span className="truncate">{t(project.location)}</span>
                          </span>
                        ) : <span />}
                        {project.capacity && <span className="flex-shrink-0 max-w-[40%] truncate bg-[#006948] px-2.5 py-0.5 rounded-full text-xs font-semibold">{t(project.capacity)}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {filtered.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <p>{t('No {type} projects found', { type: t(activeFilter) })}</p>
                </div>
              )}
            </section>
          </>
        )}
      </div>

      {/* Lightbox */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setOpenIndex(null)} role="dialog" aria-modal="true" aria-label={t(open.title)}>
          <button type="button" onClick={() => setOpenIndex(null)} aria-label={t('Close')}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-xl flex items-center justify-center">✕</button>
          {filtered.length > 1 && (
            <>
              <button type="button" aria-label={t('Previous')}
                onClick={e => { e.stopPropagation(); setOpenIndex(i => (i - 1 + filtered.length) % filtered.length); }}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center">‹</button>
              <button type="button" aria-label={t('Next')}
                onClick={e => { e.stopPropagation(); setOpenIndex(i => (i + 1) % filtered.length); }}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/15 hover:bg-white/30 text-white text-2xl flex items-center justify-center">›</button>
            </>
          )}
          <figure className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img src={open.image_url || FALLBACK_PROJECT_IMAGE} alt={open.title} onError={onImgError}
              className="w-full max-h-[75vh] object-contain rounded-lg" />
            <figcaption className="text-white mt-4 text-center px-8">
              <h2 className="text-xl md:text-2xl font-semibold break-words" style={{ fontFamily: 'Manrope' }}>{t(open.title)}</h2>
              <p className="text-white/75 text-sm mt-1 break-words" style={{ fontFamily: 'Work Sans' }}>
                {[open.location && t(open.location), open.capacity && t(open.capacity), open.type && t(open.type)].filter(Boolean).join(' · ')}
              </p>
              {open.savings && <p className="text-[#6ee7b7] text-sm mt-1 break-words">{t('Annual Savings')}: {t(open.savings)}</p>}
              {open.description && <p className="text-white/70 text-sm mt-2 max-w-2xl mx-auto line-clamp-3 break-words">{t(open.description)}</p>}
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
};

export default Gallery;
