import { createContext, FormEvent, useContext, useEffect, useState } from "react";
import { Link, Navigate, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Check, ChevronLeft, Compass, Eye, LockKeyhole, Moon, Sparkles, Sun, Target, X } from "lucide-react";
import { api, Case, Difficulty, Result } from "./api";

const difficultyMeta: Record<Difficulty, { label: string; subtitle: string; counts: string; color: string }> = {
  easy: { label: "Easy", subtitle: "A clear trail", counts: "3 suspects · 5 clues · 2 hints", color: "mint" },
  medium: { label: "Medium", subtitle: "Read between the lines", counts: "4 suspects · 7 clues · 3 hints", color: "gold" },
  hard: { label: "Hard", subtitle: "Nothing is accidental", counts: "5 suspects · 9 clues · 3 hints", color: "rose" }
};

type Theme = "dark" | "light";
const ThemeContext = createContext<{ theme: Theme; toggleTheme: () => void }>({ theme: "dark", toggleTheme: () => undefined });

function Shell({ children }: { children: React.ReactNode }) {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" to="/"><span className="brand-mark"><Compass size={18} /></span> CASEFILE</Link>
        <div className="topbar-actions"><span className="status-dot" /> SYSTEM ONLINE <button className="theme-toggle" onClick={toggleTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`} title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}>{theme === "dark" ? <Moon size={16} /> : <Sun size={16} />}</button></div>
      </header>
      <main className="page">{children}</main>
      <footer className="footer">CASEFILE <span>•</span> An interactive mystery engine</footer>
    </div>
  );
}

function Home() {
  const navigate = useNavigate();
  return <Shell>
    <section className="hero">
      <div className="eyebrow"><span className="eyebrow-line" /> A MYSTERY AWAITS</div>
      <h1>Every clue has<br /><em>a shadow.</em></h1>
      <p className="hero-copy">Enter a premise. Follow the evidence. Find the truth before it finds you.</p>
      <button className="primary-button" onClick={() => navigate("/create")}>Start a new case <ArrowRight size={18} /></button>
      <div className="hero-notes"><span><Sparkles size={14} /> AI-generated mysteries</span><span><Target size={14} /> Three difficulty levels</span><span><LockKeyhole size={14} /> Fair scoring</span></div>
    </section>
    <section className="feature-grid">
      <div><span className="feature-number">01</span><h3>Set the scene</h3><p>Give us the premise for a mystery you want to solve.</p></div>
      <div><span className="feature-number">02</span><h3>Investigate</h3><p>Examine suspects, reveal clues, and use your instincts.</p></div>
      <div><span className="feature-number">03</span><h3>Make your call</h3><p>Accuse the culprit and see how your detective work scored.</p></div>
    </section>
  </Shell>;
}

function Create() {
  const navigate = useNavigate();
  const [premise, setPremise] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("medium");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (premise.trim().length < 20) return setError("Give us at least 20 characters so the case has room to breathe.");
    setLoading(true); setError("");
    try {
      const { case: created } = await api.createCase(premise.trim(), difficulty);
      sessionStorage.setItem("caseId", created.id);
      navigate(`/cases/${created.id}/investigate`);
    } catch (err) { setError(err instanceof Error ? err.message : "Could not generate the case."); }
    finally { setLoading(false); }
  }
  return <Shell><div className="content narrow">
    <Link to="/" className="back-link"><ChevronLeft size={16} /> Back to home</Link>
    <div className="section-heading"><div className="eyebrow">CASE CONSTRUCTION</div><h2>What kind of mystery<br /><em>will you enter?</em></h2><p>Give the engine a starting point. The rest will be hidden in plain sight.</p></div>
    <form onSubmit={submit} className="case-form">
      <label className="field-label" htmlFor="premise">Your premise <span>OPTIONAL DETAILS MAKE BETTER CASES</span></label>
      <textarea id="premise" value={premise} onChange={(e) => setPremise(e.target.value)} placeholder="A priceless artifact vanishes from a remote lighthouse during a storm..." rows={5} maxLength={500} />
      <div className="char-count">{premise.length} / 500</div>
      <label className="field-label">Choose your difficulty</label>
      <div className="difficulty-grid">{(Object.keys(difficultyMeta) as Difficulty[]).map((level) => <button type="button" key={level} className={`difficulty-card ${difficulty === level ? "selected" : ""} ${difficultyMeta[level].color}`} onClick={() => setDifficulty(level)}><span className="difficulty-check">{difficulty === level && <Check size={14} />}</span><strong>{difficultyMeta[level].label}</strong><span>{difficultyMeta[level].subtitle}</span><small>{difficultyMeta[level].counts}</small></button>)}</div>
      {error && <div className="error-box">{error}</div>}
      <button className="primary-button full" disabled={loading}>{loading ? <><span className="spinner" /> Building your case...</> : <>Generate mystery <ArrowRight size={18} /></>}</button>
    </form>
  </div></Shell>;
}

function Investigation() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [game, setGame] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { api.getCase(id).then(({ case: found }) => setGame(found)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  async function discover(clueId: string) { setBusy(clueId); try { const response = await api.discoverClue(id, clueId); setGame((current) => current && ({ ...current, clues: current.clues.map((clue) => clue.id === clueId ? { ...clue, ...response.clue, status: "discovered" } : clue), progress: response.progress })); } catch (e) { setError(e instanceof Error ? e.message : "Could not reveal clue."); } finally { setBusy(""); } }
  async function requestHint(hintId: string) { setBusy(hintId); try { const response = await api.requestHint(id, hintId); setGame((current) => current && ({ ...current, hints: current.hints.map((item) => item.id === hintId ? { ...item, ...response.hint, used: true } : item), progress: response.progress })); } catch (e) { setError(e instanceof Error ? e.message : "Could not request hint."); } finally { setBusy(""); } }
  if (loading) return <Shell><Loading text="Opening the case file..." /></Shell>;
  if (error || !game) return <Shell><div className="empty-state"><X size={32} /><h2>Case unavailable</h2><p>{error || "This case could not be found."}</p><Link className="primary-button" to="/create">Start over</Link></div></Shell>;
  return <Shell><div className="content investigation">
    <div className="case-header"><div><div className="eyebrow">ACTIVE INVESTIGATION <span className="case-id">#{id.slice(-6).toUpperCase()}</span></div><h2>{game.title}</h2><p>{game.premise}</p></div><div className="case-score"><span>PROGRESS</span><strong>{game.progress.discoveredClueIds.length}/{game.clues.length}</strong><small>clues found</small></div></div>
    {error && <div className="error-box">{error}</div>}
    <div className="investigation-grid"><section className="story-panel"><div className="panel-kicker">THE BRIEFING</div><p className="story">{game.story}</p><div className="suspect-heading"><span className="panel-kicker">PERSONS OF INTEREST</span><span>{game.suspects.length} profiles</span></div><div className="suspects">{game.suspects.map((suspect, index) => <div className="suspect-card" key={suspect.id}><span className="suspect-index">0{index + 1}</span><div><strong>{suspect.name}</strong><span>{suspect.role}</span><p>{suspect.description}</p></div></div>)}</div></section>
      <aside className="evidence-panel"><div className="panel-kicker">EVIDENCE BOARD</div><div className="clue-list">{game.clues.map((clue, index) => <div className={`clue ${clue.status}`} key={clue.id}><span className="clue-number">{String(index + 1).padStart(2, "0")}</span>{clue.status === "discovered" ? <div><strong>{clue.label}</strong><p>{clue.description}</p></div> : <button disabled={busy === clue.id} onClick={() => discover(clue.id)}><LockKeyhole size={14} /> {busy === clue.id ? "Searching..." : "Reveal clue"}</button>}</div>)}</div><div className="hints"><div className="hint-header"><span className="panel-kicker">FIELD NOTES</span><span>{game.progress.usedHintIds.length}/{game.progress.hintsAvailable} used</span></div>{game.hints.map((hint) => <div className={`hint ${hint.used ? "used" : ""}`} key={hint.id}>{hint.used ? <><Sparkles size={15} /><span>{hint.text}</span></> : <button disabled={busy === hint.id} onClick={() => requestHint(hint.id)}><Eye size={14} /> {busy === hint.id ? "Thinking..." : "Request hint"}</button>}</div>)}</div><button className="primary-button full" onClick={() => navigate(`/cases/${id}/accuse`)}>Make an accusation <ArrowRight size={18} /></button></aside>
    </div>
  </div></Shell>;
}

function Accusation() {
  const { id = "" } = useParams(); const navigate = useNavigate(); const [game, setGame] = useState<Case | null>(null); const [selected, setSelected] = useState(""); const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false); const [error, setError] = useState("");
  useEffect(() => { api.getCase(id).then(({ case: found }) => setGame(found)).catch((e) => setError(e.message)).finally(() => setLoading(false)); }, [id]);
  async function submit() { if (!selected) return setError("Select one suspect before submitting."); setSubmitting(true); setError(""); try { const { result } = await api.accuse(id, selected); sessionStorage.setItem(`result:${id}`, JSON.stringify(result)); navigate(`/cases/${id}/results`); } catch (e) { setError(e instanceof Error ? e.message : "Could not submit accusation."); } finally { setSubmitting(false); } }
  if (loading) return <Shell><Loading text="Reviewing the evidence..." /></Shell>;
  if (!game) return <Shell><div className="empty-state"><h2>Case unavailable</h2><p>{error}</p></div></Shell>;
  return <Shell><div className="content narrow accusation"><Link to={`/cases/${id}/investigate`} className="back-link"><ChevronLeft size={16} /> Return to evidence</Link><div className="section-heading"><div className="eyebrow">FINAL DECISION</div><h2>Who did it?</h2><p>Trust the evidence. Once submitted, your accusation cannot be changed.</p></div><div className="accusation-list">{game.suspects.map((suspect) => <button className={`accusation-card ${selected === suspect.id ? "selected" : ""}`} key={suspect.id} onClick={() => setSelected(suspect.id)}><span className="radio">{selected === suspect.id && <span />}</span><span><strong>{suspect.name}</strong><small>{suspect.role}</small></span><ArrowRight size={16} /></button>)}</div>{error && <div className="error-box">{error}</div>}<button className="primary-button full" onClick={submit} disabled={submitting}>{submitting ? <><span className="spinner" /> Locking in...</> : <>Submit accusation <Target size={18} /></>}</button></div></Shell>;
}

function Results() {
  const { id = "" } = useParams(); const [result, setResult] = useState<Result | null>(null); const [loading, setLoading] = useState(true);
  useEffect(() => { const cached = sessionStorage.getItem(`result:${id}`); if (cached) { setResult(JSON.parse(cached)); setLoading(false); } else api.result(id).then(({ result: found }) => setResult(found)).finally(() => setLoading(false)); }, [id]);
  if (loading) return <Shell><Loading text="Unsealing the verdict..." /></Shell>;
  if (!result) return <Shell><div className="empty-state"><h2>Verdict unavailable</h2><p>Complete an accusation to see the result.</p><Link to={`/cases/${id}/investigate`} className="primary-button">Return to case</Link></div></Shell>;
  return <Shell><div className="content result-page"><div className={`verdict ${result.correct ? "correct" : "incorrect"}`}><div className="verdict-icon">{result.correct ? <Check size={30} /> : <X size={30} />}</div><div className="eyebrow">{result.correct ? "CASE SOLVED" : "WRONG ACCUSATION"}</div><h2>{result.correct ? "You found the truth." : "The trail went cold."}</h2><p>{result.correct ? "Your instincts were right. The evidence was enough." : "The real culprit was hiding in a different shadow."}</p></div><div className="result-grid"><div className="result-card culprit-card"><span className="panel-kicker">THE CULPRIT</span><h3>{result.culprit.name}</h3><p>{result.explanation}</p></div><div className="result-card score-card"><span className="panel-kicker">FINAL SCORE</span><strong>{result.score.total}</strong><div className="score-lines"><span>Base accusation <b>{result.score.base}</b></span><span>Clue discoveries <b>+{result.score.cluePoints}</b></span><span>Hint deductions <b>−{result.score.hintPenalty}</b></span></div></div></div><Link className="primary-button centered" to="/create">Start another case <ArrowRight size={18} /></Link></div></Shell>;
}

function Loading({ text }: { text: string }) { return <div className="loading-state"><span className="spinner large" /><p>{text}</p></div>; }

export default function App() {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("casefile-theme") as Theme | null) ?? "dark");
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem("casefile-theme", theme);
  }, [theme]);
  return <ThemeContext.Provider value={{ theme, toggleTheme: () => setTheme((current) => current === "dark" ? "light" : "dark") }}><Routes><Route path="/" element={<Home />} /><Route path="/create" element={<Create />} /><Route path="/cases/:id/investigate" element={<Investigation />} /><Route path="/cases/:id/accuse" element={<Accusation />} /><Route path="/cases/:id/results" element={<Results />} /><Route path="*" element={<Navigate to="/" replace />} /></Routes></ThemeContext.Provider>;
}
