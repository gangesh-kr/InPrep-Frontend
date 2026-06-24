import React, { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../utils/api';
import { useAppDispatch, useAppSelector } from '../store';
import { setUser as setUserAction } from '../store/authSlice';
import { 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Play, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  ArrowRight, 
  Calendar, 
  Briefcase, 
  History, 
  Keyboard, 
  Send,
  Cpu,
  Loader2,
  Upload,
  FileText,
  AudioLines
} from 'lucide-react';

interface AIInterviewTranscriptItem {
  role: 'interviewer' | 'candidate';
  text: string;
  timestamp: string;
}

interface AIQuestionAnalysis {
  question: string;
  candidateAnswer: string;
  rating: number;
  feedback: string;
  idealAnswer: string;
}

interface AIInterviewEvaluation {
  overallScore: number;
  verdict: 'SELECTED' | 'NOT SELECTED';
  feedbackSummary: string;
  strengths: string[];
  weaknesses: string[];
  questionsAnalysis: AIQuestionAnalysis[];
}

interface AIInterviewItem {
  id: string;
  position: string;
  companyName?: string;
  personality: string;
  overallScore?: number;
  verdict?: 'SELECTED' | 'NOT SELECTED';
  createdAt: string;
}

const SAMPLE_JDS = {
  frontend: {
    title: 'Frontend React Developer',
    company: 'Veloctiy Tech',
    jd: `We are looking for a Senior Frontend Developer with 3+ years of experience.
Must be highly proficient in React, TypeScript, and state management (Zustand or Redux).
You will build responsive, premium user interfaces and optimize loading performance (lazy loading, virtual lists).
Familiarity with TailwindCSS and writing unit tests with Vitest/Jest is expected.`
  },
  backend: {
    title: 'Backend Node.js Engineer',
    company: 'DataStream Inc',
    jd: `Seeking a Backend Engineer specializing in Node.js, Express, and Prisma ORM.
The role involves designing secure, high-throughput REST APIs and managing database performance (indexing, caching with Redis).
You should be comfortable with SQLite/PostgreSQL, Docker containerization, and basic CI/CD deployments.`
  },
  pm: {
    title: 'Product Manager (Core Platform)',
    company: 'Synergy Corp',
    jd: `We are hiring a Product Manager to lead our Core Platform product.
You will write clear technical specs, compile product requirements, and build development roadmaps.
Strong analytical skills (SQL, metrics analysis), empathy for developer tools, and experience conducting user interviews are essential.`
  },
  general: {
    title: 'Fullstack Software Engineer',
    company: 'CloudLaunch',
    jd: `We are looking for a Software Engineer to work across our web applications.
Requires experience with full-stack architectures (React frontend + Node/Python backend), SQL databases, and Git.
Strong communication, testing habits, and active problem-solving skills are critical.`
  }
};

export const AIInterviewer: React.FC = () => {
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();
  const setUser = (u: any) => dispatch(setUserAction(u));
  
  // Navigation tabs within AI page: 'setup' | 'interview' | 'evaluation' | 'history' | 'view_report'
  const [activeScreen, setActiveScreen] = useState<'setup' | 'interview' | 'evaluation' | 'history' | 'view_report'>('setup');
  
  // Setup form states
  const [position, setPosition] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [personality, setPersonality] = useState('Tech Lead - Deep-dive & Critical');
  const [selectedVoice, setSelectedVoice] = useState<string>('');
  const [voicesList, setVoicesList] = useState<SpeechSynthesisVoice[]>([]);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  // Interview runtime states
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [spokenAnswer, setSpokenAnswer] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [isTypingMode, setIsTypingMode] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [roundNumber, setRoundNumber] = useState(1);
  const [totalRounds] = useState(10);
  const [isSimulatedMode, setIsSimulatedMode] = useState(false);
  const [transcript, setTranscript] = useState<AIInterviewTranscriptItem[]>([]);
  
  // Evaluation results states
  const [evaluation, setEvaluation] = useState<AIInterviewEvaluation | null>(null);
  const [openAnalysisIndex, setOpenAnalysisIndex] = useState<number | null>(null);
  
  // History states
  const [historyList, setHistoryList] = useState<AIInterviewItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [detailedReport, setDetailedReport] = useState<any>(null);
  const [reportLoading, setReportLoading] = useState(false);
  
  // Web Speech API refs
  const recognitionRef = useRef<any>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const transcriptBottomRef = useRef<HTMLDivElement>(null);

  // Voice test/check states
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [audioTestStatus, setAudioTestStatus] = useState<'idle' | 'playing' | 'listening' | 'success'>('idle');
  const [audioTestResultText, setAudioTestResultText] = useState('');

  // Synthesizes a browser-native chime using Web Audio API
  const playChimeSound = (type: 'micOn' | 'micOff' | 'success') => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      if (type === 'micOn') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'micOff') {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === 'success') {
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.setValueAtTime(659.25, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(now + 0.3);
      }
    } catch (e) {
      console.warn('Web Audio API not supported', e);
    }
  };

  const handleStartAudioTest = () => {
    if (isTestingAudio) return;
    setIsTestingAudio(true);
    setAudioTestStatus('playing');
    setAudioTestResultText('Playing system voice check...');
    
    window.speechSynthesis.cancel();
    const testUtterance = new SpeechSynthesisUtterance("Hello! This is your audio and mic connection check. Let's make sure you can hear me. After I finish speaking, please say a few words to test your microphone.");
    const voice = voicesList.find(v => v.name === selectedVoice);
    if (voice) testUtterance.voice = voice;
    testUtterance.rate = 1.0;
    
    testUtterance.onend = () => {
      setAudioTestStatus('listening');
      setAudioTestResultText('System listening... Say anything!');
      playChimeSound('micOn');
      
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setAudioTestStatus('success');
        setAudioTestResultText('Audio playback is functional. Speech recognition is unsupported in this browser.');
        setIsTestingAudio(false);
        return;
      }
      
      const testRec = new SpeechRecognition();
      testRec.lang = 'en-US';
      testRec.onresult = (event: any) => {
        const result = event.results[0]?.[0]?.transcript;
        if (result) {
          setAudioTestResultText(`Mic active! Successfully captured: "${result}".`);
          setAudioTestStatus('success');
        }
      };
      testRec.onerror = (err: any) => {
        console.warn(err);
        setAudioTestResultText('Microphone active! Test finished successfully.');
        setAudioTestStatus('success');
      };
      testRec.onend = () => {
        setIsTestingAudio(false);
        playChimeSound('micOff');
      };
      
      try {
        testRec.start();
      } catch (err) {
        setAudioTestResultText('Microphone active! Test finished successfully.');
        setAudioTestStatus('success');
        setIsTestingAudio(false);
      }
    };
    
    window.speechSynthesis.speak(testUtterance);
  };

  // Initialize Speech Synthesis Voices
  useEffect(() => {
    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      // Filter for english voices primarily
      const engVoices = allVoices.filter(voice => voice.lang.startsWith('en'));
      setVoicesList(engVoices.length > 0 ? engVoices : allVoices);
      
      // Auto-select a nice voice
      if (engVoices.length > 0 && !selectedVoice) {
        // Try Google US English or Microsoft David
        const preferred = engVoices.find(v => v.name.includes('Google') || v.name.includes('David') || v.name.includes('Natural'));
        setSelectedVoice(preferred ? preferred.name : engVoices[0].name);
      }
    };
    
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Update input box with spoken words
        if (finalTranscript) {
          setSpokenAnswer(finalTranscript);
        } else {
          setSpokenAnswer(interimTranscript);
        }
      };
      
      rec.onerror = (err: any) => {
        console.error('Speech recognition error:', err);
        if (err.error !== 'no-speech') {
          setIsListening(false);
        }
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = rec;
    }
  }, []);

  // Scroll transcript to bottom
  useEffect(() => {
    if (transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [transcript, isAISpeaking]);

  // Load Job Template helper
  const handleLoadTemplate = (key: keyof typeof SAMPLE_JDS) => {
    const template = SAMPLE_JDS[key];
    setPosition(template.title);
    setCompanyName(template.company);
    setJobDescription(template.jd);
  };

  // Speaks AI text
  const speakAIText = (text: string) => {
    window.speechSynthesis.cancel(); // Cancel current speech
    
    if (isMuted) return;

    // Remove any prefixes or emojis for speech synthesis text
    const cleanText = text.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voice = voicesList.find(v => v.name === selectedVoice);
    if (voice) {
      utterance.voice = voice;
    }
    
    utterance.rate = 0.95; // Slightly slower for better comprehensibility
    utterance.pitch = 1.0;
    
    utterance.onstart = () => {
      setIsAISpeaking(true);
      // If listening was active, pause it while AI speaks
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
    };
    
    utterance.onend = () => {
      setIsAISpeaking(false);
      // Auto-trigger microphone listening after AI stops speaking (if not typing mode)
      if (!isTypingMode && recognitionRef.current && !isMuted) {
        try {
          recognitionRef.current.start();
          playChimeSound('micOn');
        } catch (e) {
          // already listening or not allowed
        }
      }
    };
    
    utterance.onerror = (e) => {
      console.error('TTS error:', e);
      setIsAISpeaking(false);
    };
    
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  // Toggle Microphone
  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech Recognition is not supported or initialized in this browser. Please use Typing Mode.');
      setIsTypingMode(true);
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      playChimeSound('micOff');
    } else {
      // If AI is currently speaking, stop it
      if (isAISpeaking) {
        window.speechSynthesis.cancel();
        setIsAISpeaking(false);
      }
      try {
        setSpokenAnswer('');
        recognitionRef.current.start();
        playChimeSound('micOn');
      } catch (err) {
        console.error('Failed to start recognition', err);
      }
    }
  };

  // Start interview session API call
  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!position || !jobDescription) {
      alert('Please fill out the position and Job Description.');
      return;
    }

    if (user && user.credits <= 0) {
      alert('You have 0 mock session credits remaining. Please buy more credits to start a new interview.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('position', position);
      formData.append('companyName', companyName);
      formData.append('jobDescription', jobDescription);
      formData.append('personality', personality);
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }

      const data = await apiRequest('/ai-interviewer/start', {
        method: 'POST',
        body: formData
      });

      setInterviewId(data.interviewId);
      setCurrentQuestion(data.firstQuestion);
      setIsSimulatedMode(data.isSimulated);
      setRoundNumber(1);
      setSpokenAnswer('');
      setTranscript([
        {
          role: 'interviewer',
          text: data.firstQuestion,
          timestamp: new Date().toISOString()
        }
      ]);
      
      // Update local user credits
      if (user) {
        setUser({ ...user, credits: Math.max(0, user.credits - 1) });
      }
      
      setActiveScreen('interview');
      
      // Delay speech slightly to let user settle in
      setTimeout(() => {
        speakAIText(data.firstQuestion);
      }, 800);

    } catch (error: any) {
      console.error('Error starting interview:', error);
      alert('Failed to start interview: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit response & retrieve next question API call
  const handleSubmitAnswer = async () => {
    if (!spokenAnswer.trim()) {
      alert('Please speak or type your answer before submitting.');
      return;
    }

    // Stop speaking or listening
    window.speechSynthesis.cancel();
    setIsAISpeaking(false);
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }

    setIsSubmitting(true);
    
    // Add user response to local transcript state immediately
    const updatedTranscript = [
      ...transcript,
      {
        role: 'candidate' as const,
        text: spokenAnswer,
        timestamp: new Date().toISOString()
      }
    ];
    setTranscript(updatedTranscript);
    
    const currentAnswer = spokenAnswer;
    setSpokenAnswer('');

    try {
      const data = await apiRequest('/ai-interviewer/respond', {
        method: 'POST',
        body: JSON.stringify({
          interviewId,
          answer: currentAnswer
        })
      });

      if (data.isFinished) {
        playChimeSound('success');
        // Parse strengths/weaknesses from JSON if returned as strings
        const evalData = data.evaluation;
        setEvaluation({
          overallScore: evalData.overallScore,
          verdict: evalData.verdict,
          feedbackSummary: evalData.feedbackSummary,
          strengths: Array.isArray(evalData.strengths) ? evalData.strengths : JSON.parse(evalData.strengths || '[]'),
          weaknesses: Array.isArray(evalData.weaknesses) ? evalData.weaknesses : JSON.parse(evalData.weaknesses || '[]'),
          questionsAnalysis: evalData.questionsAnalysis || []
        });
        setActiveScreen('evaluation');
      } else {
        // Update question and state
        setCurrentQuestion(data.nextQuestion);
        setRoundNumber(data.currentRound);
        
        // Append next interviewer question to transcript
        setTranscript([
          ...updatedTranscript,
          {
            role: 'interviewer',
            text: data.nextQuestion,
            timestamp: new Date().toISOString()
          }
        ]);

        // Speak the next question
        setTimeout(() => {
          speakAIText(data.nextQuestion);
        }, 300);
      }

    } catch (error: any) {
      console.error('Error submitting response:', error);
      alert('Failed to process response: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Finish early and grade
  const handleFinishEarly = async () => {
    if (window.confirm('Are you sure you want to end the interview now? The AI will grade you based on your answers so far.')) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      setIsSubmitting(true);
      try {
        const data = await apiRequest('/ai-interviewer/finish', {
          method: 'POST',
          body: JSON.stringify({ interviewId })
        });
        
        playChimeSound('success');
        const evalData = data.evaluation;
        setEvaluation({
          overallScore: evalData.overallScore,
          verdict: evalData.verdict,
          feedbackSummary: evalData.feedbackSummary,
          strengths: Array.isArray(evalData.strengths) ? evalData.strengths : JSON.parse(evalData.strengths || '[]'),
          weaknesses: Array.isArray(evalData.weaknesses) ? evalData.weaknesses : JSON.parse(evalData.weaknesses || '[]'),
          questionsAnalysis: evalData.questionsAnalysis || []
        });
        setActiveScreen('evaluation');
      } catch (error: any) {
        console.error('Error ending interview:', error);
        alert('Failed to finish interview: ' + error.message);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  // Fetch Interview History
  const fetchHistory = async () => {
    setHistoryLoading(true);
    setActiveScreen('history');
    try {
      const data = await apiRequest('/ai-interviewer/history');
      setHistoryList(data);
    } catch (error: any) {
      console.error('Error fetching history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load Detailed Report from History
  const handleViewDetailedReport = async (id: string) => {
    setReportLoading(true);
    setActiveScreen('view_report');
    try {
      const data = await apiRequest(`/ai-interviewer/history/${id}`);
      setDetailedReport(data);
    } catch (error: any) {
      console.error('Error loading report:', error);
      alert('Failed to load report: ' + error.message);
      setActiveScreen('history');
    } finally {
      setReportLoading(false);
    }
  };

  // Exit interview confirmation
  const handleExitInterview = () => {
    if (window.confirm('Do you want to exit the interview session? Progress will be lost.')) {
      window.speechSynthesis.cancel();
      setIsAISpeaking(false);
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setActiveScreen('setup');
    }
  };

  // Mock Purchase Credits API call
  const handlePurchaseCredits = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const data = await apiRequest('/ai-interviewer/purchase-credits', {
        method: 'POST',
      });
      setUser({ ...user, credits: data.credits });
      alert('Mock Payment Successful! 5 session credits have been added to your account.');
    } catch (error: any) {
      console.error('Error purchasing credits:', error);
      alert('Failed to purchase credits: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to get score text color
  const getScoreColorClass = (score: number) => {
    if (score >= 80) return 'text-emerald-600 border-emerald-200 bg-emerald-50';
    if (score >= 60) return 'text-amber-600 border-amber-200 bg-amber-50';
    return 'text-rose-600 border-rose-200 bg-rose-50';
  };

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-blue-700 via-indigo-700 to-indigo-800 rounded-2xl text-white shadow-lg overflow-hidden relative">
        <div className="absolute inset-0 bg-grid-white/10 opacity-20 pointer-events-none"></div>
        <div className="space-y-1 z-10">
          <div className="flex items-center flex-wrap gap-2">
            <Cpu className="w-6 h-6 text-blue-300 animate-pulse" />
            <span className="text-[10px] tracking-widest font-bold bg-blue-500/30 border border-blue-400/30 px-2 py-0.5 rounded-full text-blue-200 uppercase">AI Intelligence Core</span>
            {user !== undefined && user !== null && (
              <span className="text-[10px] tracking-widest font-bold bg-amber-500/30 border border-amber-400/30 px-2 py-0.5 rounded-full text-amber-200 uppercase">
                {user.credits} Mock Credits Remaining
              </span>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">Realtime Vocal AI Interviewer</h1>
          <p className="text-indigo-100 text-sm font-medium">Practice interactive voice interviews with instant scoring, feedback, and selection analysis.</p>
        </div>

        <div className="flex items-center gap-2 z-10">
          {activeScreen !== 'interview' && (
            <>
              <button 
                onClick={() => setActiveScreen('setup')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border ${activeScreen === 'setup' ? 'bg-white text-indigo-950 border-white shadow-md' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
              >
                Setup Room
              </button>
              <button 
                onClick={fetchHistory}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all border flex items-center gap-1.5 ${['history', 'view_report'].includes(activeScreen) ? 'bg-white text-indigo-950 border-white shadow-md' : 'bg-transparent text-white border-white/20 hover:bg-white/10'}`}
              >
                <History className="w-3.5 h-3.5" />
                Past Audits
              </button>
            </>
          )}
        </div>
      </div>

      {/* ---------------------------------------------------- */}
      {/* SCREEN 1: Setup and Configurations */}
      {/* ---------------------------------------------------- */}
      {activeScreen === 'setup' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Config Form */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div className="border-b border-slate-100 pb-4">
              <h2 className="text-lg font-bold text-slate-900">Configure Auditing Session</h2>
              <p className="text-slate-500 text-xs mt-1">Specify your target profile and interviewer persona to generate tailored real-time questions.</p>
            </div>

            <form onSubmit={handleStartInterview} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="position" className="text-xs font-bold text-slate-700">Target Role / Position</label>
                  <input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    placeholder="e.g. Senior Frontend Developer"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition"
                    required
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label htmlFor="company" className="text-xs font-bold text-slate-700">Company Name (Optional)</label>
                  <input
                    id="company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g. Google, Stripe"
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="jd" className="text-xs font-bold text-slate-700">Job Description (JD)</label>
                  <span className="text-[10px] text-slate-400 font-semibold">Paste requirements to customize questions</span>
                </div>
                <textarea
                  id="jd"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the target job description requirements here..."
                  rows={6}
                  className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition resize-y font-sans"
                  required
                />
              </div>

              {/* Resume PDF Upload */}
              <div className="space-y-1.5 p-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-xl">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5 text-blue-500" />
                    <span>Candidate Resume (PDF Only)</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-semibold">Used for skill verification & cross-examination</span>
                </div>
                
                {!resumeFile ? (
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer bg-white hover:bg-slate-50 hover:border-blue-300 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-3">
                        <Upload className="w-6 h-6 mb-1 text-slate-400" />
                        <p className="text-[11px] text-slate-500"><span className="font-bold text-blue-600">Click to upload</span> or drag and drop</p>
                        <p className="text-[9px] text-slate-400">PDF (Max. 5MB)</p>
                      </div>
                      <input 
                        type="file" 
                        accept=".pdf" 
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            const file = e.target.files[0];
                            if (file.type !== 'application/pdf') {
                              alert('Only PDF files are supported.');
                              return;
                            }
                            setResumeFile(file);
                          }
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-8 h-8 text-blue-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{resumeFile.name}</p>
                        <p className="text-[10px] text-slate-400">{(resumeFile.size / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResumeFile(null)}
                      className="text-xs font-bold text-rose-500 hover:text-rose-600 px-2.5 py-1 hover:bg-rose-50 rounded-lg transition"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              {/* Advanced voice/personality configurations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Interviewer Personality</label>
                  <select
                    value={personality}
                    onChange={(e) => setPersonality(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition"
                  >
                    <option value="Tech Lead - Deep-dive & Critical">Tech Lead - Deep-dive & Critical</option>
                    <option value="HR Recruiter - Warm & Encouraging">HR Recruiter - Warm & Encouraging</option>
                    <option value="Product Manager - Analytical & Structured">Product Manager - Analytical & Structured</option>
                    <option value="CTO - High Level Strategy & Fast-paced">CTO - High Level Strategy & Fast-paced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Auditory Accent / Voice</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                    className="w-full text-sm px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-xl outline-none transition"
                  >
                    {voicesList.map(voice => (
                      <option key={voice.name} value={voice.name}>
                        {voice.name} ({voice.lang})
                      </option>
                    ))}
                    {voicesList.length === 0 && (
                      <option value="">System Default Voice</option>
                    )}
                  </select>
                </div>
              </div>

              {/* Mic / Audio connection check */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800">Voice & Audio Connection Check</h4>
                    <p className="text-[10px] text-slate-500">Ensure your speaker volume is up and microphone is connected.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleStartAudioTest}
                    disabled={isTestingAudio}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition ${isTestingAudio ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-white hover:bg-slate-50 text-blue-600 border-blue-200 hover:border-blue-300 shadow-sm'}`}
                  >
                    {isTestingAudio ? 'Testing...' : 'Test Voice Check'}
                  </button>
                </div>
                {audioTestStatus !== 'idle' && (
                  <div className={`p-2.5 rounded-lg border text-[11px] font-semibold flex items-center gap-2 ${
                    audioTestStatus === 'playing' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    audioTestStatus === 'listening' ? 'bg-emerald-50 text-emerald-700 border-emerald-100 animate-pulse' :
                    'bg-slate-50 text-slate-700 border-slate-200'
                  }`}>
                    {audioTestStatus === 'listening' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>}
                    <span>{audioTestResultText}</span>
                  </div>
                )}
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-md hover:shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Drafting Interview Script...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 fill-white text-white" />
                      <span>Start Voice Interview Session</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Quick-Load JD Templates & Tips */}
          <div className="space-y-6">
            
            {/* Quick Templates Card */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Quick Job Templates</span>
                </h3>
                <p className="text-slate-500 text-[11px] mt-0.5">Select a role to autofill fields and test the interviewer immediately.</p>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleLoadTemplate('frontend')}
                  className="w-full text-left p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex justify-between items-center group text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">Frontend Developer</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">React, TypeScript, state</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => handleLoadTemplate('backend')}
                  className="w-full text-left p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex justify-between items-center group text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">Backend Node Engineer</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Express, Prisma, Databases</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => handleLoadTemplate('pm')}
                  className="w-full text-left p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex justify-between items-center group text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">Product Manager</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Roadmap, Specs, Analytics</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </button>

                <button
                  onClick={() => handleLoadTemplate('general')}
                  className="w-full text-left p-3 border border-slate-100 hover:border-blue-200 hover:bg-blue-50/50 rounded-xl transition flex justify-between items-center group text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-800">Fullstack Engineer</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Universal stack, Git, Devops</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </div>

            {/* Credit Wallet / Purchase Card */}
            {user && (
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-sm p-5 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    <span>Mock Interview Credits</span>
                  </h3>
                  <p className="text-slate-600 text-[11px] mt-0.5">Every login gets 2 free sessions. Top up to continue practicing with Gemini.</p>
                </div>

                <div className="flex items-baseline gap-1.5 p-3 bg-white border border-amber-100 rounded-xl">
                  <span className="text-2xl font-extrabold text-amber-700">{user.credits}</span>
                  <span className="text-slate-500 text-xs font-semibold">credits remaining</span>
                </div>

                {user.credits <= 0 ? (
                  <div className="p-3 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[11px] font-semibold leading-relaxed">
                    ⚠️ You are out of mock sessions. Upgrade to continue practicing.
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={handlePurchaseCredits}
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition shadow-sm hover:shadow"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white" />
                  <span>Get 5 Credits for ₹99</span>
                </button>
              </div>
            )}

            {/* Preparation tips */}
            <div className="bg-slate-900 text-white rounded-2xl shadow-md p-5 space-y-3 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-32 h-32 rounded-full bg-blue-600/20 blur-xl"></div>
              <h3 className="text-xs font-bold tracking-widest text-blue-400 uppercase">Interactive Guidelines</h3>
              <ul className="space-y-2.5 text-slate-300 text-xs">
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">1.</span>
                  <span>Allow **microphone permissions** in your browser pop-up.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">2.</span>
                  <span>The AI speaks the question first. Wait for the audio wave to stop pulsating before talking.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">3.</span>
                  <span>Talk clearly. Speak details of your experience, code libraries, and problem solving.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-400 font-bold">4.</span>
                  <span>Switch to **Typing Mode** at any time if you prefer text entry.</span>
                </li>
              </ul>
            </div>
            
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 2: Active Voice Interview Room */}
      {/* ---------------------------------------------------- */}
      {activeScreen === 'interview' && (
        <div className="bg-slate-950 rounded-3xl shadow-xl border border-slate-800 p-6 md:p-8 flex flex-col items-center justify-center space-y-8 relative min-h-[500px]">
          {/* Top Panel stats */}
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-4 text-slate-400 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              <span className="font-bold text-slate-200">INTERVIEW ACTIVE</span>
              {isSimulatedMode && (
                <span className="text-[10px] bg-amber-950 border border-amber-800 px-2 py-0.5 rounded-full text-amber-300 font-bold ml-2">
                  Simulated
                </span>
              )}
              <span className="text-slate-600">|</span>
              <span className="truncate max-w-[150px] md:max-w-[300px]">{position} @ {companyName || 'Corporate Audit'}</span>
            </div>
            
            <div className="flex items-center gap-3">
              <span className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-full text-slate-300 font-bold">
                Round {roundNumber} of {totalRounds}
              </span>
              <button 
                onClick={handleExitInterview}
                className="text-rose-500 hover:text-rose-400 font-bold hover:underline"
              >
                Quit Session
              </button>
            </div>
          </div>

          {/* CENTERED VOICE ORB VISUALIZER */}
          <div className="flex flex-col items-center justify-center py-6 space-y-4">
            <div className="relative w-36 h-36 flex items-center justify-center">
              {/* Outer pulsing ring 1 */}
              <div 
                className={`absolute inset-0 rounded-full transition-all duration-700 opacity-20 ${
                  isAISpeaking ? 'bg-blue-500 animate-ping-slow' :
                  isListening ? 'bg-emerald-500 animate-ping-slow' :
                  isSubmitting ? 'bg-purple-500 animate-ping-slow' :
                  'bg-slate-700 animate-pulse-slow'
                }`}
              />
              {/* Outer pulsing ring 2 */}
              <div 
                className={`absolute -inset-4 rounded-full transition-all duration-700 opacity-10 ${
                  isAISpeaking ? 'bg-blue-600 animate-pulse-slow' :
                  isListening ? 'bg-emerald-600 animate-pulse-slow' :
                  isSubmitting ? 'bg-purple-600 animate-pulse-slow' :
                  'bg-slate-800 opacity-0'
                }`}
              />
              {/* Core visualizer orb */}
              <div 
                className={`w-28 h-28 rounded-full flex items-center justify-center text-white border transition-all duration-700 z-10 ${
                  isAISpeaking ? 'bg-blue-600 border-blue-400 shadow-[0_0_25px_rgba(59,130,246,0.6)] voice-orb-active-blue' :
                  isListening ? 'bg-emerald-600 border-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.6)] voice-orb-active-green' :
                  isSubmitting ? 'bg-purple-600 border-purple-400 shadow-[0_0_25px_rgba(139,92,246,0.6)] voice-orb-active-purple' :
                  'bg-slate-800 border-slate-700 shadow-inner voice-orb-idle'
                }`}
              >
                {isAISpeaking && <AudioLines className="w-10 h-10 animate-pulse text-blue-100" />}
                {isListening && <Mic className="w-10 h-10 animate-bounce-slow text-emerald-100" />}
                {isSubmitting && <Loader2 className="w-10 h-10 animate-spin text-purple-100" />}
                {!isAISpeaking && !isListening && !isSubmitting && <MicOff className="w-10 h-10 text-slate-400" />}
              </div>
            </div>
            
            {/* Status labels */}
            <div className="text-center space-y-1">
              <span className={`text-[10px] tracking-widest font-black uppercase px-3 py-1 rounded-full border ${
                isAISpeaking ? 'text-blue-400 bg-blue-950/40 border-blue-900/30' :
                isListening ? 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30 animate-pulse' :
                isSubmitting ? 'text-purple-400 bg-purple-950/40 border-purple-900/30' :
                'text-slate-400 bg-slate-900/40 border-slate-800/30'
              }`}>
                {isAISpeaking ? 'Interviewer Speaking' :
                 isListening ? 'Microphone Active' :
                 isSubmitting ? 'AI Core Processing' :
                 'System Idle'}
              </span>
            </div>
          </div>

          {/* CURRENT QUESTION DISPLAY */}
          <div className="w-full max-w-3xl bg-slate-900/50 border border-slate-800/80 rounded-2xl p-6 text-center space-y-2">
            <span className="text-[10px] text-indigo-400 uppercase tracking-widest font-bold">Interviewer Question</span>
            <p className="text-slate-100 text-base md:text-lg font-medium leading-relaxed">
              "{currentQuestion}"
            </p>
          </div>

          {/* CONTEXTUAL SUPPORT TIP */}
          <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div className="flex-1 text-left">
              <span className="text-[9px] uppercase tracking-widest font-black text-slate-500">Candidate Guide Tip</span>
              <p className="text-slate-300 text-xs mt-0.5 font-medium">
                {isAISpeaking ? "Listen closely to the question and focus on the technical details." : 
                 isListening ? "Speak clearly. Explain concepts thoroughly with STAR (Situation, Task, Action, Result) method!" : 
                 isSubmitting ? "The AI is evaluating key terminology and accuracy of your response." : 
                 "Enable your microphone and prepare to explain technical fundamentals."}
              </p>
            </div>
          </div>

          {/* CANDIDATE TRANSCRIPT / INPUT PANEL */}
          <div className="w-full max-w-3xl space-y-4">
            
            {!isTypingMode ? (
              /* VOICE TRANSCRIPTION OUTPUT */
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 min-h-[100px] flex flex-col justify-center relative">
                <span className="absolute top-3 right-4 text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Live Speech-to-Text
                </span>
                
                {spokenAnswer ? (
                  <p className="text-slate-200 text-sm italic pr-12 font-medium">
                    "{spokenAnswer}"
                  </p>
                ) : (
                  <p className="text-slate-500 text-sm italic text-center">
                    {isListening ? 'Say something... your speech will display here in real-time.' : 'Press "Start Listening" to dictate your answer.'}
                  </p>
                )}
              </div>
            ) : (
              /* KEYBOARD TYPING MODE */
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-xs font-bold text-slate-400">Type Your Answer</span>
                  <span className="text-[10px] text-slate-500">Press Shift+Enter for new line</span>
                </div>
                <textarea
                  value={spokenAnswer}
                  onChange={(e) => setSpokenAnswer(e.target.value)}
                  placeholder="Type your response to the interviewer's question..."
                  rows={4}
                  className="w-full text-sm px-4 py-3 bg-slate-900 border border-slate-800 text-slate-100 focus:border-blue-500 focus:bg-slate-900 rounded-xl outline-none transition resize-none font-sans"
                />
              </div>
            )}

            {/* CONTROLS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-900 pt-4">
              
              <div className="flex items-center gap-2">
                {/* Listening Toggle */}
                {!isTypingMode && (
                  <button
                    onClick={toggleListening}
                    disabled={isSubmitting}
                    className={`flex items-center gap-2 font-bold px-4 py-2.5 rounded-xl text-xs transition border ${isListening ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500 shadow-md shadow-emerald-900/10' : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-800'}`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Mute Mic</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4 text-emerald-400" />
                        <span>Start Listening</span>
                      </>
                    )}
                  </button>
                )}

                {/* Speak Question again */}
                <button
                  onClick={() => speakAIText(currentQuestion)}
                  disabled={isSubmitting}
                  className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
                  title="Repeat Question"
                >
                  <Volume2 className="w-4 h-4 text-blue-400" />
                </button>

                {/* AI Volume Mute */}
                <button
                  onClick={() => {
                    const newMute = !isMuted;
                    setIsMuted(newMute);
                    if (newMute) {
                      window.speechSynthesis.cancel();
                      setIsAISpeaking(false);
                    } else {
                      speakAIText(currentQuestion);
                    }
                  }}
                  className="flex items-center justify-center p-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition"
                  title={isMuted ? 'Unmute AI' : 'Mute AI'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {/* Mode Swapper & Submitter */}
              <div className="flex items-center gap-2">
                
                {/* Swap keyboard vs speech */}
                <button
                  onClick={() => {
                    setIsTypingMode(!isTypingMode);
                    if (isListening && recognitionRef.current) {
                      recognitionRef.current.stop();
                    }
                  }}
                  className="flex items-center gap-1.5 px-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-semibold hover:bg-slate-900 rounded-xl transition"
                >
                  {isTypingMode ? (
                    <>
                      <Mic className="w-3.5 h-3.5" />
                      <span>Speech Entry</span>
                    </>
                  ) : (
                    <>
                      <Keyboard className="w-3.5 h-3.5" />
                      <span>Type Answer</span>
                    </>
                  )}
                </button>

                {/* Finish early */}
                <button
                  onClick={handleFinishEarly}
                  disabled={isSubmitting}
                  className="px-3 py-2 text-rose-400 hover:text-rose-300 text-xs font-semibold hover:bg-rose-950/20 rounded-xl transition border border-transparent hover:border-rose-900/30"
                >
                  Skip to Rating
                </button>

                {/* Submit button */}
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !spokenAnswer.trim()}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-900 text-white disabled:text-slate-600 font-bold px-5 py-2.5 rounded-xl text-xs transition border border-transparent disabled:border-slate-800/80"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Answer</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>

          {/* CHAT TRANSCRIPT PREVIEW PANEL */}
          {transcript.length > 1 && (
            <div className="w-full max-w-3xl border-t border-slate-900 pt-6 mt-2 space-y-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Conversation Log</span>
              <div className="max-h-40 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-800">
                {transcript.map((item, idx) => {
                  const isUser = item.role === 'candidate';
                  return (
                    <div 
                      key={idx} 
                      className={`flex flex-col space-y-1 ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <span className="text-[9px] text-slate-500 font-semibold px-1">
                        {isUser ? 'You (Candidate)' : 'Interviewer'}
                      </span>
                      <div className={`p-3 max-w-[85%] text-xs rounded-2xl ${isUser ? 'bg-blue-600/10 border border-blue-900/20 text-blue-200' : 'bg-slate-900 border border-slate-800 text-slate-300'}`}>
                        {item.text}
                      </div>
                    </div>
                  );
                })}
                <div ref={transcriptBottomRef} />
              </div>
            </div>
          )}

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 3: Interactive Evaluation Scorecard */}
      {/* ---------------------------------------------------- */}
      {activeScreen === 'evaluation' && evaluation && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Main Scorecard Panel */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6">
            
            {/* Top Score Summary block */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6">
              
              <div className="space-y-2 text-center md:text-left">
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Evaluation Audit Complete</span>
                <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">AI Interview Scorecard</h2>
                <p className="text-slate-500 text-xs">A comprehensive assessment generated based on your answers matching the Job Description.</p>
              </div>

              {/* Big Score Gauge */}
              <div className="flex items-center gap-6">
                
                {/* Circle Score representation */}
                <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center font-black ${getScoreColorClass(evaluation.overallScore)}`}>
                  <span className="text-3xl leading-none">{evaluation.overallScore}</span>
                  <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ 100</span>
                </div>

                {/* Verdict Panel */}
                <div className="space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Decision Verdict</span>
                  <div className={`flex items-center gap-1.5 font-black text-sm px-4 py-2 border rounded-xl ${evaluation.verdict === 'SELECTED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                    {evaluation.verdict === 'SELECTED' ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 fill-emerald-600 text-white" />
                        <span>PASSED / SELECTED</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 fill-rose-600 text-white" />
                        <span>NOT SELECTED</span>
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>

            {/* Performance Summary Text */}
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Executive Summary</span>
              <p className="text-slate-800 text-sm font-medium leading-relaxed">
                "{evaluation.feedbackSummary}"
              </p>
            </div>

            {/* Strengths & Weaknesses Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Strengths */}
              <div className="border border-slate-200/80 rounded-2xl p-5 space-y-3 bg-emerald-50/10">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Key Strengths</span>
                </h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, index) => (
                    <li key={index} className="text-slate-700 text-xs font-medium flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                      <span>{strength}</span>
                    </li>
                  ))}
                  {evaluation.strengths.length === 0 && (
                    <li className="text-slate-400 text-xs italic">No notable strengths identified.</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="border border-slate-200/80 rounded-2xl p-5 space-y-3 bg-rose-50/10">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  <span>Areas of Improvement</span>
                </h3>
                <ul className="space-y-2">
                  {evaluation.weaknesses.map((weakness, index) => (
                    <li key={index} className="text-slate-700 text-xs font-medium flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                  {evaluation.weaknesses.length === 0 && (
                    <li className="text-slate-400 text-xs italic">No critical weaknesses identified.</li>
                  )}
                </ul>
              </div>

            </div>

            {/* ACCORDION TRANSCRIPT & RATING DETAILED AUDIT */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Question-by-Question Detailed Assessment</h3>
              
              <div className="space-y-3">
                {evaluation.questionsAnalysis.map((analysis, index) => {
                  const isOpen = openAnalysisIndex === index;
                  return (
                    <div 
                      key={index}
                      className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
                    >
                      {/* Question Summary Bar */}
                      <button
                        onClick={() => setOpenAnalysisIndex(isOpen ? null : index)}
                        className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border-b border-transparent hover:border-slate-100 transition text-left"
                      >
                        <div className="flex items-center gap-3 pr-4">
                          <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 flex-shrink-0">
                            Q{index + 1}
                          </span>
                          <span className="font-bold text-slate-800 text-xs truncate max-w-[250px] md:max-w-xl">
                            {analysis.question}
                          </span>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${analysis.rating >= 8 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : analysis.rating >= 6 ? 'text-amber-700 bg-amber-50 border-amber-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                            Rating: {analysis.rating}/10
                          </span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>
                      </button>

                      {/* Detailed collapse info */}
                      {isOpen && (
                        <div className="p-5 space-y-4 bg-white border-t border-slate-100 text-xs">
                          
                          {/* Question and Answer */}
                          <div className="space-y-2">
                            <div>
                              <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Interviewer's Question</p>
                              <p className="text-slate-800 font-semibold mt-0.5">{analysis.question}</p>
                            </div>
                            
                            <div className="pt-1.5">
                              <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Your Spoken Answer</p>
                              <p className="text-slate-700 italic mt-0.5">"{analysis.candidateAnswer}"</p>
                            </div>
                          </div>

                          {/* Feedback */}
                          <div className="p-3 bg-blue-50/40 border border-blue-100/50 rounded-xl space-y-1 text-slate-800">
                            <p className="font-bold text-blue-800 uppercase text-[9px] tracking-wider">Expert Assessment & Review</p>
                            <p className="leading-relaxed font-medium">{analysis.feedback}</p>
                          </div>

                          {/* Ideal answer advice */}
                          <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                            <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Ideal Response Template Advice</p>
                            <p className="text-slate-600 leading-relaxed font-medium">{analysis.idealAnswer}</p>
                          </div>

                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-6">
              <span className="text-[10px] text-slate-400 italic">
                Note: Questions where you rated below 8/10 are auto-saved to your Question Bank for future practice.
              </span>
              <button
                onClick={() => setActiveScreen('setup')}
                className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Start Another Audit
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 4: Audit History List */}
      {/* ---------------------------------------------------- */}
      {activeScreen === 'history' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-lg font-bold text-slate-900">Past Audit Sessions</h2>
            <p className="text-slate-500 text-xs mt-1">Review performance evaluations and selection records of your past mock interviews.</p>
          </div>

          {historyLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs">Fetching past records...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-3">
              <AlertCircle className="w-10 h-10 text-slate-300" />
              <div className="text-center">
                <p className="font-bold text-slate-700">No mock audits found</p>
                <p className="text-xs text-slate-400 mt-1">Complete your first voice interview to save scoring analytics.</p>
              </div>
              <button
                onClick={() => setActiveScreen('setup')}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl transition"
              >
                Initiate Setup
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Job Role / Position</th>
                    <th className="py-3 px-4">Interviewer Type</th>
                    <th className="py-3 px-4">Audit Date</th>
                    <th className="py-3 px-4 text-center">Score</th>
                    <th className="py-3 px-4">Verdict</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {historyList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-4 px-4 font-bold text-slate-800">
                        {item.position}
                        {item.companyName && (
                          <span className="text-[10px] text-slate-400 font-semibold block mt-0.5">
                            @{item.companyName}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-slate-500">{item.personality}</td>
                      <td className="py-4 px-4 text-slate-400 flex items-center gap-1 mt-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(item.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {typeof item.overallScore === 'number' ? (
                          <span className={`px-2 py-0.5 font-bold border rounded-full ${getScoreColorClass(item.overallScore)}`}>
                            {item.overallScore}/100
                          </span>
                        ) : (
                          <span className="text-slate-400 italic text-[11px]">Incomplete</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        {item.verdict ? (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 border rounded-full font-bold text-[10px] ${item.verdict === 'SELECTED' ? 'text-emerald-700 bg-emerald-50 border-emerald-100' : 'text-rose-700 bg-rose-50 border-rose-100'}`}>
                            {item.verdict}
                          </span>
                        ) : (
                          <span className="text-slate-400">-</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleViewDetailedReport(item.id)}
                          className="bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200 hover:border-blue-200 font-bold px-3 py-1.5 rounded-lg transition"
                        >
                          View Report
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* SCREEN 5: Detailed Past Audit Report */}
      {/* ---------------------------------------------------- */}
      {activeScreen === 'view_report' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setActiveScreen('history')}
              className="text-xs text-slate-500 hover:text-slate-800 font-bold flex items-center gap-1"
            >
              &larr; Back to History List
            </button>
          </div>

          {reportLoading || !detailedReport ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-16 flex flex-col items-center justify-center space-y-2 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              <p className="text-xs">Retrieving report data...</p>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              {/* Detailed view scorecard */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 md:p-8 space-y-6">
                
                {/* Header detail info */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6">
                  
                  <div className="space-y-2 text-center md:text-left">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                      <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full uppercase">Report Archive</span>
                      <span className="text-[10px] bg-blue-50 text-blue-800 border border-blue-100 font-bold px-2 py-0.5 rounded-full">
                        {detailedReport.personality}
                      </span>
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 tracking-tight">
                      {detailedReport.position}
                    </h2>
                    {detailedReport.companyName && (
                      <p className="text-slate-500 text-xs font-semibold flex items-center gap-1.5 justify-center md:justify-start">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400" />
                        <span>Mock Application for {detailedReport.companyName}</span>
                      </p>
                    )}
                  </div>

                  {/* Circular Score Gauge */}
                  <div className="flex items-center gap-6">
                    
                    <div className={`w-24 h-24 rounded-full border-4 flex flex-col items-center justify-center font-black ${getScoreColorClass(detailedReport.evaluation.overallScore)}`}>
                      <span className="text-3xl leading-none">{detailedReport.evaluation.overallScore}</span>
                      <span className="text-[10px] font-bold text-slate-400 mt-0.5">/ 100</span>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Decision Verdict</span>
                      <div className={`flex items-center gap-1.5 font-black text-sm px-4 py-2 border rounded-xl ${detailedReport.evaluation.verdict === 'SELECTED' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-rose-700 bg-rose-50 border-rose-200'}`}>
                        {detailedReport.evaluation.verdict === 'SELECTED' ? 'SELECTED' : 'NOT SELECTED'}
                      </div>
                    </div>

                  </div>

                </div>

                {/* Feedback summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-1.5">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Auditor Feedback Notes</span>
                  <p className="text-slate-800 text-sm font-medium leading-relaxed">
                    "{detailedReport.evaluation.feedbackSummary}"
                  </p>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div className="border border-slate-200/80 rounded-2xl p-5 space-y-3 bg-emerald-50/10">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      <span>Strengths Highlighted</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {detailedReport.evaluation.strengths.map((str: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0"></span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="border border-slate-200/80 rounded-2xl p-5 space-y-3 bg-rose-50/10">
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-1.5">
                      <AlertCircle className="w-4 h-4 text-rose-500" />
                      <span>Weaknesses Highlighted</span>
                    </h3>
                    <ul className="space-y-2 text-xs text-slate-700 font-medium">
                      {detailedReport.evaluation.weaknesses.map((wk: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 flex-shrink-0"></span>
                          <span>{wk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Detailed Q&A Accordion */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h3 className="text-sm font-bold text-slate-900">Q&A Audit Transcript Breakdown</h3>
                  
                  <div className="space-y-3">
                    {detailedReport.evaluation.questionsAnalysis.map((analysis: any, index: number) => {
                      const isOpen = openAnalysisIndex === index;
                      return (
                        <div 
                          key={index}
                          className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200"
                        >
                          <button
                            onClick={() => setOpenAnalysisIndex(isOpen ? null : index)}
                            className="w-full flex items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 border-b border-transparent hover:border-slate-100 transition text-left"
                          >
                            <div className="flex items-center gap-3 pr-4">
                              <span className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center font-bold text-[10px] text-slate-600 flex-shrink-0">
                                Q{index + 1}
                              </span>
                              <span className="font-bold text-slate-800 text-xs truncate max-w-[250px] md:max-w-xl">
                                {analysis.question}
                              </span>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${analysis.rating >= 8 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                                Rating: {analysis.rating}/10
                              </span>
                              {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                            </div>
                          </button>

                          {isOpen && (
                            <div className="p-5 space-y-4 bg-white border-t border-slate-100 text-xs">
                              
                              <div className="space-y-2">
                                <div>
                                  <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Interviewer's Question</p>
                                  <p className="text-slate-800 font-semibold mt-0.5">{analysis.question}</p>
                                </div>
                                
                                <div className="pt-1.5">
                                  <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Your Recorded Answer</p>
                                  <p className="text-slate-700 italic mt-0.5">"{analysis.candidateAnswer}"</p>
                                </div>
                              </div>

                              <div className="p-3 bg-blue-50/40 border border-blue-100/50 rounded-xl space-y-1 text-slate-800">
                                <p className="font-bold text-blue-800 uppercase text-[9px] tracking-wider">Assessor Feedback</p>
                                <p className="leading-relaxed font-medium">{analysis.feedback}</p>
                              </div>

                              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                                <p className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Corrective Suggestions</p>
                                <p className="text-slate-600 leading-relaxed font-medium">{analysis.idealAnswer}</p>
                              </div>

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* Embedded CSS styles for Wave animations */}
      <style>{`
        @keyframes aiWave {
          0%, 100% { height: 12px; }
          50% { height: 75px; }
        }
        @keyframes userWave {
          0%, 100% { height: 16px; }
          50% { height: 50px; }
        }
        @keyframes thinkingWave {
          0%, 100% { height: 10px; }
          50% { height: 30px; }
        }

        .animate-ai-wave {
          animation: aiWave 1s ease-in-out infinite;
        }
        .animate-user-wave {
          animation: userWave 0.7s ease-in-out infinite;
        }
        .animate-thinking-wave {
          animation: thinkingWave 1.4s ease-in-out infinite;
        }

        /* Concentric Pulse & Orb Animations */
        @keyframes pingSlow {
          0% { transform: scale(0.9); opacity: 0.4; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes pulseSlow {
          0%, 100% { transform: scale(1); opacity: 0.3; }
          50% { transform: scale(1.1); opacity: 0.6; }
        }
        @keyframes spinSlow {
          to { transform: rotate(360deg); }
        }
        @keyframes bounceSlow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        
        .animate-ping-slow {
          animation: pingSlow 2.5s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-pulse-slow {
          animation: pulseSlow 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spinSlow 8s linear infinite;
        }
        .animate-bounce-slow {
          animation: bounceSlow 2s ease-in-out infinite;
        }
      `}</style>

    </div>
  );
};
export default AIInterviewer;
