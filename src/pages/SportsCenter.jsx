/**
 * SportsCenter.jsx — Main Sports Center page.
 *
 * Features:
 *  • Cricket / Football tabs
 *  • Live / Upcoming / Results sub-tabs per sport
 *  • League/type filter pills
 *  • Team search
 *  • Match detail modal
 *  • Favorite teams (localStorage)
 *  • Countdown timers for upcoming matches
 *  • Trending / live matches section
 *  • Football league standings
 *  • Auto-refresh every 20s via React Query
 *  • Mobile-first, dark mode, glassmorphism
 */

import { useState, useMemo, useCallback, useEffect, lazy, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import {
  Search, RefreshCw, Wifi, WifiOff, Star, TrendingUp, Trophy,
  LayoutGrid, AlignJustify,
} from 'lucide-react';

import Layout from '../components/layout/Layout';

// Sport-specific hooks
import { useLiveCricket, useUpcomingCricket, useRecentCricket } from '../hooks/useCricketScores';
import { useFootballScores, useFootballStandings } from '../hooks/useFootballScores';

// Components
import CricketCard from '../components/sports/CricketCard';
import FootballCard from '../components/sports/FootballCard';
import LeagueFilter from '../components/sports/LeagueFilter';
import ScoreSkeleton from '../components/sports/ScoreSkeleton';
import LiveIndicator from '../components/sports/LiveIndicator';

// Lazy-loaded heavy components
const MatchModal    = lazy(() => import('../components/sports/MatchModal'));
const StandingsTable = lazy(() => import('../components/sports/StandingsTable'));

import { POPULAR_LEAGUES, CRICKET_TYPES } from '../types/sports.js';

// ── Persistence helpers ───────────────────────────────────────────────────────

function loadFavourites() {
  try { return new Set(JSON.parse(localStorage.getItem('sports-favourites') || '[]')); }
  catch { return new Set(); }
}
function saveFavourites(set) {
  localStorage.setItem('sports-favourites', JSON.stringify([...set]));
}

// ── Countdown timer hook ──────────────────────────────────────────────────────

function useCountdown(isoDate) {
  const [text, setText] = useState('');
  useEffect(() => {
    if (!isoDate) return;
    const update = () => {
      const diff = new Date(isoDate) - Date.now();
      if (diff <= 0) { setText('Starting soon'); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setText(h > 0 ? `${h}h ${m}m` : m > 0 ? `${m}m ${s}s` : `${s}s`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [isoDate]);
  return text;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionHeader({ title, count, isRefetching }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <h2 className="text-white font-bold text-base">{title}</h2>
      {count !== undefined && (
        <span className="text-xs bg-white/10 text-white/60 px-2 py-0.5 rounded-full">{count}</span>
      )}
      {isRefetching && (
        <RefreshCw size={13} className="text-white/30 animate-spin ml-auto" />
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, message, subtext }) {
  return (
    <div className="text-center py-16 text-white/40">
      <Icon size={48} className="mx-auto mb-3 opacity-30" />
      <p className="font-semibold text-white/60">{message}</p>
      {subtext && <p className="text-sm mt-1">{subtext}</p>}
    </div>
  );
}

function ErrorState({ error, onRetry }) {
  return (
    <div className="text-center py-12 space-y-3">
      <WifiOff size={40} className="mx-auto text-red-400/50" />
      <p className="text-white/60 font-semibold">Failed to load data</p>
      <p className="text-xs text-white/40">{error?.message || 'Unknown error'}</p>
      <button onClick={onRetry} className="mt-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors">
        Retry
      </button>
    </div>
  );
}

/** Countdown badge shown on upcoming match cards */
function CountdownBadge({ isoDate }) {
  const text = useCountdown(isoDate);
  if (!text) return null;
  return (
    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-mono">
      ⏱ {text}
    </span>
  );
}

// ── Trending strip ─────────────────────────────────────────────────────────────

function TrendingStrip({ matches, sport, onSelect }) {
  if (!matches?.length) return null;
  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={16} className="text-red-400" />
        <span className="text-sm font-bold text-white/80">Trending Now</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {matches.slice(0, 4).map(m => {
          const id = sport === 'cricket' ? m.id : m.id;
          const title = sport === 'cricket'
            ? `${m.team1?.shortName} vs ${m.team2?.shortName}`
            : `${m.homeTeam?.name} vs ${m.awayTeam?.name}`;
          return (
            <button
              key={id}
              onClick={() => onSelect(m)}
              className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
            >
              <LiveIndicator />
              <span className="truncate max-w-[120px]">{title}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

// ── Cricket Panel ─────────────────────────────────────────────────────────────

function CricketPanel({ onSelect, favourites, onToggleFavourite }) {
  const [subTab, setSubTab]     = useState('live');
  const [typeFilter, setType]   = useState(null);
  const [search, setSearch]     = useState('');

  const liveQuery     = useLiveCricket();
  const upcomingQuery = useUpcomingCricket();
  const recentQuery   = useRecentCricket();

  const queries = { live: liveQuery, upcoming: upcomingQuery, recent: recentQuery };
  const { data = [], isLoading, isFetching, isError, error, refetch } = queries[subTab];

  const filtered = useMemo(() => {
    let list = data;
    if (typeFilter) list = list.filter(m => m.matchType === typeFilter);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.team1?.name?.toLowerCase().includes(q) ||
        m.team2?.name?.toLowerCase().includes(q) ||
        m.seriesName?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, typeFilter, search]);

  const liveMatches = liveQuery.data || [];

  return (
    <div className="space-y-4">
      {/* Trending live strip */}
      <TrendingStrip matches={liveMatches} sport="cricket" onSelect={onSelect} />

      {/* Sub-tab */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5">
        {['live', 'upcoming', 'recent'].map(t => (
          <button
            key={t}
            id={`cricket-tab-${t}`}
            onClick={() => setSubTab(t)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
              subTab === t
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t === 'live' ? '🔴 Live' : t === 'upcoming' ? '📅 Upcoming' : '📋 Results'}
          </button>
        ))}
      </div>

      {/* Match type filter */}
      <LeagueFilter
        items={CRICKET_TYPES.filter(c => c.key !== 'all').map(c => ({ id: c.key, label: c.label }))}
        selected={typeFilter}
        onSelect={setType}
        allLabel="All Types"
      />

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
        <input
          id="cricket-search"
          type="text"
          placeholder="Search teams or series…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-red-500/50 transition-colors"
        />
      </div>

      {/* Content */}
      <SectionHeader title={`${subTab.charAt(0).toUpperCase() + subTab.slice(1)} Matches`} count={filtered.length} isRefetching={isFetching && !isLoading} />

      {isLoading && <ScoreSkeleton count={6} />}
      {isError && !isLoading && <ErrorState error={error} onRetry={refetch} />}
      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={Search}
          message={search ? 'No matches found' : `No ${subTab} matches right now`}
          subtext={search ? 'Try a different search term' : 'Check back soon!'}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(match => (
            <div key={match.id} className="relative">
              {subTab === 'upcoming' && (
                <div className="absolute top-3 right-3 z-10">
                  <CountdownBadge isoDate={match.startTime} />
                </div>
              )}
              <CricketCard
                match={match}
                onSelect={onSelect}
                isFavorite={favourites.has(String(match.id))}
                onToggleFavorite={onToggleFavourite}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Football Panel ────────────────────────────────────────────────────────────

const STANDINGS_LEAGUE_ID = 39; // Default: Premier League

function FootballPanel({ onSelect, favourites, onToggleFavourite }) {
  const [subTab, setSubTab]         = useState('live');
  const [leagueFilter, setLeague]   = useState(null);
  const [search, setSearch]         = useState('');
  const [showStandings, setStandings] = useState(false);
  const [standingsLeague, setStandingsLeague] = useState(STANDINGS_LEAGUE_ID);

  const scoresQuery    = useFootballScores(subTab, leagueFilter);
  const standingsQuery = useFootballStandings(standingsLeague);

  const { data = [], isLoading, isFetching, isError, error, refetch } = scoresQuery;

  const filtered = useMemo(() => {
    let list = data;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(m =>
        m.homeTeam?.name?.toLowerCase().includes(q) ||
        m.awayTeam?.name?.toLowerCase().includes(q) ||
        m.league?.name?.toLowerCase().includes(q),
      );
    }
    return list;
  }, [data, search]);

  const liveMatches = (subTab === 'live' ? data : []).filter(m => m.isLive);

  return (
    <div className="space-y-4">
      {/* Trending */}
      <TrendingStrip matches={liveMatches} sport="football" onSelect={onSelect} />

      {/* Sub-tab */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5">
        {['live', 'fixtures', 'results'].map(t => (
          <button
            key={t}
            id={`football-tab-${t}`}
            onClick={() => { setSubTab(t); setStandings(false); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
              subTab === t && !showStandings
                ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
                : 'text-white/50 hover:text-white'
            }`}
          >
            {t === 'live' ? '🔴 Live' : t === 'fixtures' ? '📅 Fixtures' : '📋 Results'}
          </button>
        ))}
        <button
          id="football-tab-standings"
          onClick={() => setStandings(s => !s)}
          className={`flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all duration-200 ${
            showStandings
              ? 'bg-red-600 text-white shadow-lg shadow-red-600/30'
              : 'text-white/50 hover:text-white'
          }`}
        >
          🏆 Table
        </button>
      </div>

      {/* League filter */}
      <LeagueFilter
        items={POPULAR_LEAGUES.map(l => ({ id: l.id, label: l.name, flag: l.flag }))}
        selected={showStandings ? standingsLeague : leagueFilter}
        onSelect={id => {
          if (showStandings) setStandingsLeague(id ?? STANDINGS_LEAGUE_ID);
          else setLeague(id);
        }}
        allLabel="All Leagues"
      />

      {/* Standings view */}
      {showStandings && (
        <Suspense fallback={<ScoreSkeleton count={3} />}>
          <div className="sports-glass-card p-4">
            <SectionHeader title="League Table" isRefetching={standingsQuery.isFetching && !standingsQuery.isLoading} />
            <StandingsTable
              standings={standingsQuery.data || []}
              isLoading={standingsQuery.isLoading}
            />
          </div>
        </Suspense>
      )}

      {/* Matches view */}
      {!showStandings && (
        <>
          {/* Search */}
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              id="football-search"
              type="text"
              placeholder="Search teams or leagues…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-white placeholder-white/30 bg-white/5 border border-white/10 focus:outline-none focus:border-red-500/50 transition-colors"
            />
          </div>

          <SectionHeader
            title={subTab.charAt(0).toUpperCase() + subTab.slice(1)}
            count={filtered.length}
            isRefetching={isFetching && !isLoading}
          />

          {isLoading && <ScoreSkeleton count={6} />}
          {isError && !isLoading && <ErrorState error={error} onRetry={refetch} />}
          {!isLoading && !isError && filtered.length === 0 && (
            <EmptyState
              icon={Search}
              message={search ? 'No matches found' : `No ${subTab} matches`}
              subtext={search ? 'Try a different search' : subTab === 'live' ? 'No live games right now' : 'Check back later'}
            />
          )}

          {!isLoading && !isError && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(match => (
                <div key={match.id} className="relative">
                  {subTab === 'fixtures' && (
                    <div className="absolute top-3 right-3 z-10">
                      <CountdownBadge isoDate={match.date} />
                    </div>
                  )}
                  <FootballCard
                    match={match}
                    onSelect={onSelect}
                    isFavorite={favourites.has(String(match.id))}
                    onToggleFavorite={onToggleFavourite}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Favourites Panel ──────────────────────────────────────────────────────────

function FavouritesPanel({ favIds, liveCricket, liveFootball, onSelect }) {
  const cricketFavs   = (liveCricket  || []).filter(m => favIds.has(String(m.id)));
  const footballFavs  = (liveFootball || []).filter(m => favIds.has(String(m.id)));
  const all = [...cricketFavs, ...footballFavs];

  if (all.length === 0) {
    return (
      <EmptyState
        icon={Star}
        message="No favourites yet"
        subtext="Tap the ★ on any match to track it here"
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cricketFavs.map(m => (
        <CricketCard key={m.id} match={m} onSelect={onSelect} isFavorite onToggleFavorite={() => {}} />
      ))}
      {footballFavs.map(m => (
        <FootballCard key={m.id} match={m} onSelect={onSelect} isFavorite onToggleFavorite={() => {}} />
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function SportsCenter() {
  const [sport, setSport]         = useState('cricket');
  const [selectedMatch, setMatch] = useState(null);
  const [selectedSport, setSelectedSport] = useState(null);
  const [favourites, setFavourites] = useState(loadFavourites);

  const handleSelect = useCallback((match, sp) => {
    setMatch(match);
    setSelectedSport(sp);
  }, []);

  const handleCricketSelect   = useCallback(m => handleSelect(m, 'cricket'), [handleSelect]);
  const handleFootballSelect  = useCallback(m => handleSelect(m, 'football'), [handleSelect]);
  const handleClose = useCallback(() => { setMatch(null); setSelectedSport(null); }, []);

  const toggleFavourite = useCallback(id => {
    setFavourites(prev => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key); else next.add(key);
      saveFavourites(next);
      return next;
    });
  }, []);

  // Prefetch live data from both sports for Favourites tab
  const liveCricket  = useLiveCricket().data;
  const liveFootball = useFootballScores('live').data;

  const TABS = [
    { id: 'cricket',  label: '🏏 Cricket' },
    { id: 'football', label: '⚽ Football' },
    { id: 'favourites', label: `⭐ Favourites${favourites.size > 0 ? ` (${favourites.size})` : ''}` },
  ];

  return (
    <Layout sidebar={false}>
      <Helmet>
        <title>Sports Center — Live Scores | Kolhapur_Times24</title>
        <meta name="description" content="Live cricket and football scores, fixtures, results and league standings on Kolhapur_Times24 Sports Center." />
      </Helmet>

      {/* ── Immersive Dark Background Wrapper ── */}
      <div className="-mx-4 -my-6 min-h-screen pb-12" style={{ background: '#0b0b13' }}>
        {/* ── Page hero ── */}
        <div
          className="relative px-4 sm:px-8 pt-10 pb-8 mb-6 overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #0f0f1e 0%, #1a0a2e 50%, #0d1a2e 100%)',
          }}
        >
        {/* Decorative blobs */}
        <div className="absolute -top-10 -right-10 w-64 h-64 rounded-full opacity-20 blur-3xl"
          style={{ background: 'radial-gradient(circle, #dc2626, transparent)' }} />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full opacity-10 blur-3xl"
          style={{ background: 'radial-gradient(circle, #7c3aed, transparent)' }} />

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-1">
            <Wifi size={14} className="text-red-400" />
            <span className="text-xs text-red-400 font-semibold tracking-widest uppercase">Live Scores</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white mb-1">
            Sports <span className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(90deg, #f87171, #fb923c)' }}>Center</span>
          </h1>
          <p className="text-white/50 text-sm">
            Real-time cricket & football scores, fixtures, and standings.
          </p>
        </div>
      </div>

      {/* ── Main content area ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8">

        {/* Sport tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              id={`sport-tab-${tab.id}`}
              onClick={() => setSport(tab.id)}
              className={`shrink-0 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                sport === tab.id
                  ? 'text-white shadow-lg'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              style={sport === tab.id ? {
                background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                boxShadow: '0 4px 20px rgba(220,38,38,0.35)',
              } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Panel */}
        <div>
          {sport === 'cricket' && (
            <CricketPanel
              onSelect={handleCricketSelect}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          )}
          {sport === 'football' && (
            <FootballPanel
              onSelect={handleFootballSelect}
              favourites={favourites}
              onToggleFavourite={toggleFavourite}
            />
          )}
          {sport === 'favourites' && (
            <FavouritesPanel
              favIds={favourites}
              liveCricket={liveCricket}
              liveFootball={liveFootball}
              onSelect={handleCricketSelect}
            />
          )}
        </div>
      </div>
    </div>

      {/* Match detail modal */}
      <Suspense fallback={null}>
        <MatchModal match={selectedMatch} sport={selectedSport} onClose={handleClose} />
      </Suspense>
    </Layout>
  );
}
