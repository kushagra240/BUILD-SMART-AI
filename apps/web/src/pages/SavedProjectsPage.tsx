import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, ChevronRight, FolderX, ArrowRight } from 'lucide-react';
import { SampleDataBadge } from '../components/common/SampleDataBadge';
import { formatNumber, formatINR } from '../lib/formatters';

interface SavedProjectItem {
  id: string;
  name: string;
  code: string;
  config: string;
  locality: string;
  updated: string;
  area: number;
  quality: 'Standard' | 'Economy' | 'Premium';
  estimate: number;
}

const INITIAL_PROJECTS: SavedProjectItem[] = [
  {
    id: 'deshmukh-residence',
    name: 'Deshmukh residence',
    code: 'BS-2026-004',
    config: 'G+1',
    locality: 'Baner',
    updated: '07 Oct 2026',
    area: 1800,
    quality: 'Standard',
    estimate: 4320000,
  },
  {
    id: 'kulkarni-family-home',
    name: 'Kulkarni family home',
    code: 'BS-2026-003',
    config: 'G+1',
    locality: 'Kothrud',
    updated: '04 Oct 2026',
    area: 1500,
    quality: 'Standard',
    estimate: 3600000,
  },
  {
    id: 'wagholi-courtyard-home',
    name: 'Wagholi courtyard home',
    code: 'BS-2026-002',
    config: 'G+1',
    locality: 'Wagholi',
    updated: '28 Sep 2026',
    area: 1200,
    quality: 'Economy',
    estimate: 2400000,
  },
  {
    id: 'patil-residence',
    name: 'Patil residence',
    code: 'BS-2026-001',
    config: 'G+1',
    locality: 'Bavdhan',
    updated: '22 Sep 2026',
    area: 1600,
    quality: 'Premium',
    estimate: 4960000,
  },
];

export function SavedProjectsPage() {
  const [search, setSearch] = useState('');
  const [qualityFilter, setQualityFilter] = useState('All');
  const [localityFilter, setLocalityFilter] = useState('All');

  const filtered = INITIAL_PROJECTS.filter((p) => {
    const matchesSearch =
      search === '' ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.locality.toLowerCase().includes(search.toLowerCase());
    const matchesQuality = qualityFilter === 'All' || p.quality === qualityFilter;
    const matchesLocality = localityFilter === 'All' || p.locality === localityFilter;
    return matchesSearch && matchesQuality && matchesLocality;
  });

  return (
    <div className="min-h-screen bg-paper text-ink pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6">
        {/* Header & CTA */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-ink/10 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-brick font-semibold">
                YOUR BUILDING NOTEBOOK / 04 PROJECTS
              </span>
              <SampleDataBadge text="Sample data" />
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl lg:text-5xl font-bold text-ink tracking-tight">
              Every idea, kept in one place.
            </h1>
            <p className="text-xs sm:text-sm text-ink-soft font-sans">
              Return to your estimates, review your choices and keep a record as plans take shape.
            </p>
          </div>

          <Link
            to="/app/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-md bg-brick hover:bg-brick-hover text-paper text-sm font-medium shadow-subtle transition-colors whitespace-nowrap focus-ring"
          >
            <Plus className="w-4 h-4" />
            <span>Start a new estimate</span>
          </Link>
        </div>

        {/* Filter Bar */}
        <div className="bg-paper-deep/40 border border-ink/14 rounded-lg p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-ink-soft absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name or locality"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-paper border border-ink/14 rounded-md text-xs text-ink placeholder:text-ink-soft focus-ring font-sans"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={qualityFilter}
              onChange={(e) => setQualityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-xs text-ink focus-ring font-sans"
            >
              <option value="All">All qualities</option>
              <option value="Economy">Economy</option>
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <select
              value={localityFilter}
              onChange={(e) => setLocalityFilter(e.target.value)}
              className="w-full px-3 py-2 bg-paper border border-ink/14 rounded-md text-xs text-ink focus-ring font-sans"
            >
              <option value="All">All Pune localities</option>
              <option value="Baner">Baner</option>
              <option value="Kothrud">Kothrud</option>
              <option value="Wagholi">Wagholi</option>
              <option value="Bavdhan">Bavdhan</option>
            </select>
          </div>
        </div>

        {/* Projects Table or Empty State */}
        {filtered.length > 0 ? (
          <div className="border border-ink/14 rounded-lg overflow-hidden bg-paper shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-paper-deep/70 text-ink-soft font-mono uppercase text-[10px] tracking-wider border-b border-ink/14">
                  <tr>
                    <th scope="col" className="py-3 px-4 font-semibold">Project</th>
                    <th scope="col" className="py-3 px-4 font-semibold">Locality</th>
                    <th scope="col" className="py-3 px-4 font-semibold">Updated</th>
                    <th scope="col" className="py-3 px-4 font-semibold">Area / sq ft</th>
                    <th scope="col" className="py-3 px-4 font-semibold">Quality</th>
                    <th scope="col" className="py-3 px-4 text-right font-semibold">Estimate</th>
                    <th scope="col" className="py-3 px-4 text-center font-semibold">Open</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink/10 font-sans">
                  {filtered.map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-paper-deep/40 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-4">
                        <Link to={`/app/projects/${item.id}`} className="block focus-ring rounded">
                          <div className="font-semibold text-sm text-ink group-hover:text-brick transition-colors">
                            {item.name}
                          </div>
                          <div className="text-[11px] font-mono text-ink-soft">
                            {item.code} · {item.config}
                          </div>
                        </Link>
                      </td>
                      <td className="py-3.5 px-4 text-ink-soft">{item.locality}</td>
                      <td className="py-3.5 px-4 font-mono text-ink-soft">{item.updated}</td>
                      <td className="py-3.5 px-4 font-mono text-ink">{formatNumber(item.area)}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-mono border border-ink/14 bg-paper-deep text-ink">
                          {item.quality}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-sm text-ink group-hover:text-brick transition-colors">
                        {formatINR(item.estimate)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Link
                          to={`/app/projects/${item.id}`}
                          className="inline-flex items-center justify-center p-1.5 rounded hover:bg-paper-deep text-ink-soft hover:text-brick transition-colors focus-ring"
                          aria-label={`Open ${item.name}`}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            <div className="bg-paper-deep/40 border-t border-ink/14 px-4 py-2.5 flex items-center justify-between text-xs text-ink-soft font-mono">
              <span>Showing {filtered.length} of {INITIAL_PROJECTS.length} saved projects</span>
              <span>Previous / 1 / Next</span>
            </div>
          </div>
        ) : (
          /* Empty Search State (Matching Figma Screenshot 4 bottom left) */
          <div className="bg-paper-deep/50 border border-ink/14 rounded-lg p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-clay border border-ink/14 text-ink-soft">
              <FolderX className="w-6 h-6 stroke-[1.5]" />
            </div>
            <div className="space-y-1 max-w-sm mx-auto">
              <div className="text-[11px] font-mono uppercase tracking-wider text-brick">
                SEARCH: {search.toUpperCase()}
              </div>
              <h3 className="font-headline text-lg font-bold text-ink">
                No saved projects in {search}.
              </h3>
              <p className="text-xs text-ink-soft">
                Try another locality or clear your search. Your four saved projects are still here.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setQualityFilter('All');
                setLocalityFilter('All');
              }}
              className="px-4 py-2 rounded-md bg-paper border border-ink/14 text-xs font-medium text-ink hover:bg-paper-deep transition-colors focus-ring"
            >
              Clear search
            </button>
          </div>
        )}

        {/* Disclaimer Callout Box */}
        <div className="bg-clay/40 border border-ink/14 rounded-lg p-4 text-xs text-ink-soft leading-relaxed space-y-1">
          <strong className="text-ink font-sans">
            Your estimates are planning records, not quotations:
          </strong>{' '}
          Amounts use the area and quality selected when saved. Review assumptions and obtain fresh local quotations before making decisions.
        </div>
      </div>
    </div>
  );
}
