import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { 
  useGetPacksQuery, 
  usePurchasePackMutation 
} from '../store/services/packsApi';
import { 
  Loader2, 
  Search, 
  Lock, 
  Unlock, 
  Clock, 
  Building2, 
  X, 
  Sparkles, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export const CompanyPacks: React.FC = () => {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [interviewType, setInterviewType] = useState('');
  const [selectedPack, setSelectedPack] = useState<any | null>(null);
  const [paywallPack, setPaywallPack] = useState<any | null>(null);

  const { data: packs, isLoading, error, refetch } = useGetPacksQuery({});
  const [purchasePack, { isLoading: isPurchasing }] = usePurchasePackMutation();

  const handleStartInterview = (pack: any) => {
    // Save pack context to localStorage for AIInterviewer page to consume
    localStorage.setItem(
      'inprep_selected_pack',
      JSON.stringify({
        packId: pack.id,
        companyName: pack.companyName,
        position: `${pack.companyName} software engineer`,
        jobDescription: `Tailored interview pack designed to test key focus areas for ${pack.companyName}: ${pack.questionFocusAreas.join(', ')}.\n\nPhilosophy:\n${pack.culturalContext}`,
        personality: `Professional ${pack.companyName} Interviewer`,
        interviewType: pack.interviewType
      })
    );
    setSelectedPack(null);
    router.push('/ai-interviewer');
  };

  const handlePurchase = async (packId: string) => {
    try {
      await purchasePack(packId).unwrap();
      refetch(); // Reload packs access state
      setPaywallPack(null);
    } catch (err) {
      console.error('Failed to purchase pack:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-slate-500 text-sm">Loading curated company packs...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <span>Failed to load company packs. Please try again.</span>
      </div>
    );
  }

  // Filter packs
  const filteredPacks = (packs || []).filter((pack: any) => {
    const matchesSearch = pack.companyName.toLowerCase().includes(search.toLowerCase()) || 
                          pack.description.toLowerCase().includes(search.toLowerCase());
    const matchesDifficulty = !difficulty || pack.difficulty === difficulty;
    const matchesType = !interviewType || pack.interviewType === interviewType;
    return matchesSearch && matchesDifficulty && matchesType;
  });

  const getDifficultyBadge = (diff: string) => {
    if (diff === 'hard') return 'bg-red-50 text-red-700 border-red-200';
    if (diff === 'medium') return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Company Interview Packs</h1>
        <p className="text-slate-500 text-sm">Practice role-specific mock interviews tailored to top tech companies.</p>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search company or pack description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>

          <select
            value={interviewType}
            onChange={(e) => setInterviewType(e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
          >
            <option value="">All Types</option>
            <option value="technical">Technical</option>
            <option value="behavioral">Behavioral</option>
            <option value="system design">System Design</option>
          </select>

        </div>
      </div>

      {/* CARD GRID */}
      {filteredPacks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 bg-white border border-slate-200 rounded-xl text-center">
          <Building2 className="w-12 h-12 text-slate-300 mb-3" />
          <h3 className="font-bold text-slate-800 text-lg">No packs match criteria</h3>
          <p className="text-slate-500 text-sm max-w-sm mt-1">Try adapting your search keyword or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredPacks.map((pack: any) => (
            <div 
              key={pack.id} 
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-blue-500 transition duration-150"
            >
              <div>
                <div className="flex justify-between items-start gap-4 mb-4">
                  <div className="flex items-center gap-3">
                    <img
                      src={pack.companyLogoUrl || `https://www.google.com/s2/favicons?sz=64&domain=${pack.companyName.toLowerCase()}.com`}
                      alt={pack.companyName}
                      className="w-10 h-10 rounded-lg border border-slate-100 object-contain p-1 flex-shrink-0"
                      onError={(e) => {
                        e.currentTarget.src = `https://www.google.com/s2/favicons?sz=64&domain=google.com`;
                      }}
                    />
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">{pack.companyName} Pack</h3>
                      <div className="flex gap-1.5 items-center mt-1">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getDifficultyBadge(pack.difficulty)}`}>
                          {pack.difficulty}
                        </span>
                        <span className="text-[10px] text-slate-400 capitalize font-medium">{pack.interviewType}</span>
                      </div>
                    </div>
                  </div>

                  {pack.tier === 'premium' ? (
                    pack.hasAccess ? (
                      <span className="text-xs text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Unlock className="w-3 h-3" /> Premium
                      </span>
                    ) : (
                      <span className="text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Premium
                      </span>
                    )
                  ) : (
                    <span className="text-xs text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full font-bold">
                      Free
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                  {pack.description}
                </p>

                <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-4">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Est. Duration: {pack.estimatedDurationMinutes} minutes</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex gap-2">
                {pack.hasAccess ? (
                  <button
                    onClick={() => setSelectedPack(pack)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition min-h-[44px]"
                  >
                    View Details & Start
                  </button>
                ) : (
                  <button
                    onClick={() => setPaywallPack(pack)}
                    className="w-full py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold transition min-h-[44px] flex items-center justify-center gap-1.5"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Unlock Premium</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL / SLIDE-OVER */}
      {selectedPack && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-lg w-full p-6 shadow-xl space-y-4 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3">
                <img
                  src={selectedPack.companyLogoUrl || `https://www.google.com/s2/favicons?sz=64&domain=${selectedPack.companyName.toLowerCase()}.com`}
                  alt={selectedPack.companyName}
                  className="w-10 h-10 object-contain p-1 border border-slate-100 rounded-lg flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">{selectedPack.companyName} Pack Syllabus</h3>
                  <p className="text-slate-400 text-xs capitalize">{selectedPack.interviewType} Interview</p>
                </div>
              </div>
              <button onClick={() => setSelectedPack(null)} className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Description</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1">{selectedPack.description}</p>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Focus Areas</span>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {selectedPack.questionFocusAreas.map((tag: string, idx: number) => (
                    <span key={idx} className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded text-xs font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Company Interview Philosophy</span>
                <p className="text-xs text-slate-600 leading-relaxed mt-1 font-medium italic">
                  "{selectedPack.culturalContext}"
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 text-xs text-slate-500 space-y-1">
                <div className="font-bold text-slate-700">Interview Structure:</div>
                <div>• Total Rounds: 10 conceptual progressive questions</div>
                <div>• Auto-evaluator analyzes state scoping, concurrency depth, or case frameworks.</div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedPack(null)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleStartInterview(selectedPack)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold min-h-[44px]"
              >
                Start Pack Interview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM PAYWALL MODAL */}
      {paywallPack && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
            
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-7 h-7 fill-current animate-pulse" />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-black text-slate-900 text-xl">Unlock {paywallPack.companyName} Premium Pack</h3>
              <p className="text-slate-500 text-xs leading-relaxed max-w-xs mx-auto">
                Get full access to company-specific interview prompts, real-time cross-examinations, and recruiter-ready scorecards.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-left space-y-2 text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Google/Meta/Amazon known interview focus areas</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Cultural alignment philosophy validation</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span>Unlimited grading iterations & feedback</span>
              </div>
            </div>

            <div className="text-slate-400 text-[10px] italic">
              * Payment gateway integration is currently in sandbox. Access is granted instantly for demonstration purposes.
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setPaywallPack(null)}
                className="w-1/2 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => handlePurchase(paywallPack.id)}
                disabled={isPurchasing}
                className="w-1/2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition min-h-[44px] flex items-center justify-center gap-1.5"
              >
                {isPurchasing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Purchase Access</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default CompanyPacks;
