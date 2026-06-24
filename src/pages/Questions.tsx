import React, { useEffect, useState } from 'react';
import { apiRequest } from '../utils/api';
import type { Question, Application } from '../types';
import { 
  Plus, 
  Search, 
  AlertCircle, 
  Edit2, 
  X, 
  ChevronDown, 
  ChevronUp, 
  BookOpen, 
  Briefcase, 
  Folder 
} from 'lucide-react';

export const Questions: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [apps, setApps] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter/Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterSkill, setFilterSkill] = useState('');

  // Modals & Forms toggles
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  // Form states
  const [text, setText] = useState('');
  const [answerDraft, setAnswerDraft] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [category, setCategory] = useState('General');
  const [confidenceLevel, setConfidenceLevel] = useState('5');
  const [needsRevision, setNeedsRevision] = useState(true);
  const [roundId, setRoundId] = useState('');
  const [skillNamesString, setSkillNamesString] = useState('');

  const [formError, setFormError] = useState('');

  // Dynamic grouping & viewMode states
  const [viewMode, setViewMode] = useState<'skills' | 'companies' | 'list'>('skills');
  const [expandedChapters, setExpandedChapters] = useState<Record<string, boolean>>({});

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => ({
      ...prev,
      [chapterId]: !prev[chapterId]
    }));
  };

  const getGroupedChapters = () => {
    if (viewMode === 'skills') {
      const groupsMap: Record<string, Question[]> = {};
      
      questions.forEach((q) => {
        if (q.skills && q.skills.length > 0) {
          q.skills.forEach((skill) => {
            if (!groupsMap[skill.name]) {
              groupsMap[skill.name] = [];
            }
            groupsMap[skill.name].push(q);
          });
        } else {
          const generalName = "General / Core Fundamentals";
          if (!groupsMap[generalName]) {
            groupsMap[generalName] = [];
          }
          groupsMap[generalName].push(q);
        }
      });

      return Object.entries(groupsMap).map(([title, qList]) => {
        const total = qList.length;
        const avg = total > 0 ? qList.reduce((sum, q) => sum + q.confidenceLevel, 0) / total : 0;
        const easy = qList.filter(q => q.difficulty === 'Easy').length;
        const medium = qList.filter(q => q.difficulty === 'Medium').length;
        const hard = qList.filter(q => q.difficulty === 'Hard').length;

        return {
          id: `skill-${title}`,
          title,
          questions: qList,
          avgRecallStrength: Math.round(avg * 10) / 10,
          easyCount: easy,
          mediumCount: medium,
          hardCount: hard
        };
      });
    } else if (viewMode === 'companies') {
      const groupsMap: Record<string, Question[]> = {};

      questions.forEach((q) => {
        const companyName = q.round?.application?.company?.name;
        if (companyName) {
          if (!groupsMap[companyName]) {
            groupsMap[companyName] = [];
          }
          groupsMap[companyName].push(q);
        } else {
          const generalName = "Standalone / General Preparation";
          if (!groupsMap[generalName]) {
            groupsMap[generalName] = [];
          }
          groupsMap[generalName].push(q);
        }
      });

      return Object.entries(groupsMap).map(([title, qList]) => {
        const total = qList.length;
        const avg = total > 0 ? qList.reduce((sum, q) => sum + q.confidenceLevel, 0) / total : 0;
        const easy = qList.filter(q => q.difficulty === 'Easy').length;
        const medium = qList.filter(q => q.difficulty === 'Medium').length;
        const hard = qList.filter(q => q.difficulty === 'Hard').length;

        return {
          id: `company-${title}`,
          title,
          questions: qList,
          avgRecallStrength: Math.round(avg * 10) / 10,
          easyCount: easy,
          mediumCount: medium,
          hardCount: hard
        };
      });
    }
    return [];
  };

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      let url = '/questions?';
      if (filterDifficulty) url += `difficulty=${filterDifficulty}&`;
      if (filterCategory) url += `category=${filterCategory}&`;
      if (filterSkill) url += `skill=${filterSkill}&`;
      
      const data = await apiRequest(url);
      
      // Filter by search query in-memory if set
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const filtered = data.filter((q: Question) => 
          q.text.toLowerCase().includes(query) || 
          q.answerDraft?.toLowerCase().includes(query)
        );
        setQuestions(filtered);
      } else {
        setQuestions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppsAndRounds = async () => {
    try {
      const data = await apiRequest('/applications');
      setApps(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [filterDifficulty, filterCategory, filterSkill, searchQuery]);

  useEffect(() => {
    fetchAppsAndRounds();
  }, []);

  const handleCreateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const skillNames = skillNamesString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      await apiRequest('/questions', {
        method: 'POST',
        body: JSON.stringify({
          roundId: roundId || undefined,
          text,
          answerDraft,
          difficulty,
          category,
          confidenceLevel,
          needsRevision,
          skillNames,
        }),
      });
      setShowAddModal(false);
      resetForm();
      fetchQuestions();
    } catch (err: any) {
      setFormError(err.message || 'Failed to log question');
    }
  };

  const handleUpdateQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion) return;
    setFormError('');

    const skillNames = skillNamesString
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    try {
      await apiRequest(`/questions/${selectedQuestion.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          text,
          answerDraft,
          difficulty,
          category,
          confidenceLevel,
          needsRevision,
          skillNames,
        }),
      });
      setSelectedQuestion(null);
      resetForm();
      fetchQuestions();
    } catch (err: any) {
      setFormError(err.message || 'Failed to update question');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;
    try {
      await apiRequest(`/questions/${id}`, {
        method: 'DELETE',
      });
      setSelectedQuestion(null);
      fetchQuestions();
    } catch (err) {
      console.error(err);
    }
  };

  const resetForm = () => {
    setText('');
    setAnswerDraft('');
    setDifficulty('Medium');
    setCategory('General');
    setConfidenceLevel('5');
    setNeedsRevision(true);
    setRoundId('');
    setSkillNamesString('');
    setFormError('');
  };

  const openEdit = (q: Question) => {
    setSelectedQuestion(q);
    setText(q.text);
    setAnswerDraft(q.answerDraft || '');
    setDifficulty(q.difficulty);
    setCategory(q.category);
    setConfidenceLevel(String(q.confidenceLevel));
    setNeedsRevision(q.needsRevision);
    setSkillNamesString(q.skills?.map(s => s.name).join(', ') || '');
  };

  const getDifficultyBadge = (diff: string) => {
    switch (diff) {
      case 'Easy': return 'bg-green-50 text-green-700 border-green-200';
      case 'Medium': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'Hard': return 'bg-red-50 text-red-700 border-red-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Question Bank</h1>
          <p className="text-slate-500 text-sm">Every interview question becomes training data for your next round.</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-black hover:bg-slate-900 text-white rounded-md text-sm font-semibold transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> Log Question
        </button>
      </div>

      {/* Filters & Search */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-white border border-slate-200 rounded-lg p-4">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search questions or answers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-9 pr-4 py-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600"
          />
        </div>
        <div>
          <select
            value={filterDifficulty}
            onChange={(e) => setFilterDifficulty(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600 text-slate-700"
          >
            <option value="">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
        </div>
        <div>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600 text-slate-700"
          >
            <option value="">All Categories</option>
            <option value="Coding">Coding</option>
            <option value="System Design">System Design</option>
            <option value="Behavioral">Behavioral</option>
            <option value="General">General</option>
          </select>
        </div>
        <div>
          <input
            type="text"
            placeholder="Filter by Skill tag (e.g. React)..."
            value={filterSkill}
            onChange={(e) => setFilterSkill(e.target.value)}
            className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Dynamic View Modes Selector */}
      <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
        <button
          onClick={() => setViewMode('skills')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            viewMode === 'skills' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Folder className="w-3.5 h-3.5" />
          <span>Group by Skill / Topic</span>
        </button>
        <button
          onClick={() => setViewMode('companies')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            viewMode === 'companies' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span>Group by Target Company</span>
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            viewMode === 'list' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Flat List View</span>
        </button>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="p-8 text-center text-slate-500 animate-pulse text-sm">Loading repository...</div>
      ) : questions.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-sm bg-white border border-slate-200 rounded-lg">
          No questions logged matching these parameters. Let's record one!
        </div>
      ) : viewMode === 'list' ? (
        /* FLAT LIST VIEW */
        <div className="grid grid-cols-1 gap-4">
          {questions.map((q) => (
            <div key={q.id} className="bg-white border border-slate-200 rounded-lg p-5 hover:border-slate-300 transition duration-150 relative">
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(q.difficulty)}`}>
                    {q.difficulty}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{q.category}</span>
                  {q.needsRevision && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Needs Revision
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500">
                    Recall Strength: <strong className="text-slate-900">{q.confidenceLevel}/10</strong>
                  </span>
                  <button 
                    onClick={() => openEdit(q)}
                    className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <h3 className="font-bold text-slate-900 text-base leading-snug mb-3 pr-8">
                {q.text}
              </h3>

              {q.answerDraft && (
                <div className="bg-slate-50/80 border border-slate-100 rounded p-4 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap mb-4">
                  {q.answerDraft}
                </div>
              )}

              {/* Skills and Round Tags */}
              <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-1.5">
                  {q.skills?.map((skill) => (
                    <span key={skill.id} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                      {skill.name}
                    </span>
                  ))}
                </div>
                
                {q.round && (
                  <span className="text-xs text-slate-400">
                    Asked in: <strong className="text-slate-700">{q.round.application?.company.name}</strong> (Round {q.round.roundNumber} - {q.round.roundType})
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* CHAPTERS / TOPICS ACCORDION VIEW */
        <div className="space-y-4">
          {getGroupedChapters().map((chapter) => {
            const isExpanded = !!expandedChapters[chapter.id];
            
            let recallColorClass = "text-slate-500 bg-slate-50 border-slate-200";
            if (chapter.avgRecallStrength >= 8.0) {
              recallColorClass = "text-emerald-700 bg-emerald-50 border-emerald-200";
            } else if (chapter.avgRecallStrength >= 5.0) {
              recallColorClass = "text-amber-700 bg-amber-50 border-amber-200";
            } else if (chapter.avgRecallStrength > 0) {
              recallColorClass = "text-red-700 bg-red-50 border-red-200";
            }

            return (
              <div key={chapter.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:border-slate-300 transition duration-150">
                
                {/* Chapter Accordion Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className="w-full flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/70 hover:bg-slate-50 transition text-left gap-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm">
                      {viewMode === 'skills' ? <Folder className="w-4 h-4" /> : <Briefcase className="w-4 h-4" />}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{chapter.title}</h3>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5">
                        {viewMode === 'skills' ? 'Skill Category Chapter' : 'Target Company Chapter'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-wrap md:flex-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${recallColorClass}`}>
                      {chapter.avgRecallStrength > 0 ? `Avg Recall Strength: ${chapter.avgRecallStrength}/10` : 'No Recall Data'}
                    </span>

                    <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">
                      {chapter.questions.length} {chapter.questions.length === 1 ? 'Question' : 'Questions'}
                    </span>

                    <div className="flex gap-1">
                      {chapter.easyCount > 0 && <span className="text-[9px] font-bold bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100" title="Easy questions">{chapter.easyCount}E</span>}
                      {chapter.mediumCount > 0 && <span className="text-[9px] font-bold bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-100" title="Medium questions">{chapter.mediumCount}M</span>}
                      {chapter.hardCount > 0 && <span className="text-[9px] font-bold bg-red-50 text-red-700 px-1.5 py-0.5 rounded border border-red-100" title="Hard questions">{chapter.hardCount}H</span>}
                    </div>

                    <div className="text-slate-400 pl-2">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Chapter Questions List */}
                {isExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-white space-y-4 divide-y divide-slate-100">
                    {chapter.questions.map((q, idx) => (
                      <div key={q.id} className={`pt-4 ${idx === 0 ? 'pt-0' : ''}`}>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getDifficultyBadge(q.difficulty)}`}>
                              {q.difficulty}
                            </span>
                            <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">{q.category}</span>
                            {q.needsRevision && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Needs Revision
                              </span>
                            )}
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500">
                              Recall Strength: <strong className="text-slate-900">{q.confidenceLevel}/10</strong>
                            </span>
                            <button 
                              onClick={() => openEdit(q)}
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-slate-955 text-sm leading-snug mb-3 pr-8">
                          {q.text}
                        </h4>

                        {q.answerDraft && (
                          <div className="bg-slate-50/80 border border-slate-100 rounded p-4 text-xs text-slate-600 leading-relaxed font-mono whitespace-pre-wrap mb-4">
                            {q.answerDraft}
                          </div>
                        )}

                        <div className="flex flex-wrap justify-between items-center gap-3 pt-3 border-t border-slate-50">
                          <div className="flex flex-wrap gap-1.5">
                            {q.skills?.map((skill) => (
                              <span key={skill.id} className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                {skill.name}
                              </span>
                            ))}
                          </div>
                          
                          {q.round && (
                            <span className="text-xs text-slate-400 font-medium">
                              Asked in: <strong className="text-slate-600">{q.round.application?.company.name}</strong> (Round {q.round.roundNumber} - {q.round.roundType})
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Log Question Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Interview Question</h3>
              <button onClick={() => { setShowAddModal(false); resetForm(); }} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleCreateQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Link to Interview Round</label>
                <select 
                  value={roundId} 
                  onChange={(e) => setRoundId(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600 text-slate-700"
                >
                  <option value="">Standalone Question (Unlinked)</option>
                  {apps.flatMap(app => 
                    app.rounds?.map(round => (
                      <option key={round.id} value={round.id}>
                        {app.company.name} - {app.position} (Round {round.roundNumber} {round.roundType})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Text *</label>
                <textarea 
                  required
                  rows={2}
                  placeholder="e.g. How do you implement debouncing in Javascript?"
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer Draft / Notes</label>
                <textarea 
                  rows={4}
                  placeholder="Write your explanation or code snippets..."
                  value={answerDraft} 
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Coding">Coding</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recall Strength (1-10)</label>
                  <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
                  </select>
                </div>
                <div className="flex items-center pt-5 pl-2">
                  <input 
                    type="checkbox" 
                    id="needsRevisionCheck"
                    checked={needsRevision} 
                    onChange={(e) => setNeedsRevision(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-600"
                  />
                  <label htmlFor="needsRevisionCheck" className="ml-2 text-xs font-semibold text-slate-700">Flag for revision</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills Tags (comma separated)</label>
                <input 
                  type="text" 
                  placeholder="React, Javascript, Frontend" 
                  value={skillNamesString} 
                  onChange={(e) => setSkillNamesString(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => { setShowAddModal(false); resetForm(); }}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Question</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Question Modal */}
      {selectedQuestion && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xl max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Edit Question Details</h3>
              <div className="flex items-center gap-2">
                <button 
                  type="button"
                  onClick={() => handleDeleteQuestion(selectedQuestion.id)}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold mr-4"
                >
                  Delete
                </button>
                <button onClick={() => setSelectedQuestion(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {formError && <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-200">{formError}</div>}

            <form onSubmit={handleUpdateQuestion} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Question Text *</label>
                <textarea 
                  required
                  rows={2}
                  value={text} 
                  onChange={(e) => setText(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Answer Draft / Notes</label>
                <textarea 
                  rows={4}
                  value={answerDraft} 
                  onChange={(e) => setAnswerDraft(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Difficulty</label>
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    <option value="Coding">Coding</option>
                    <option value="System Design">System Design</option>
                    <option value="Behavioral">Behavioral</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Recall Strength (1-10)</label>
                  <select value={confidenceLevel} onChange={(e) => setConfidenceLevel(e.target.value)}
                    className="w-full text-sm p-2 border border-slate-200 rounded bg-white focus:outline-none focus:border-blue-600">
                    {[1,2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n}/10</option>)}
                  </select>
                </div>
                <div className="flex items-center pt-5 pl-2">
                  <input 
                    type="checkbox" 
                    id="editNeedsRevisionCheck"
                    checked={needsRevision} 
                    onChange={(e) => setNeedsRevision(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-600"
                  />
                  <label htmlFor="editNeedsRevisionCheck" className="ml-2 text-xs font-semibold text-slate-700">Flag for revision</label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Skills Tags (comma separated)</label>
                <input 
                  type="text" 
                  value={skillNamesString} 
                  onChange={(e) => setSkillNamesString(e.target.value)}
                  className="w-full text-sm p-2 border border-slate-200 rounded focus:outline-none focus:border-blue-600" 
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setSelectedQuestion(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 text-sm font-semibold rounded hover:bg-slate-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-black hover:bg-slate-900 text-white text-sm font-semibold rounded">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
