import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { 
  useGetPlanQuery, 
  useGeneratePlanMutation, 
  useToggleTaskMutation, 
  useRegeneratePlanMutation,
  useAddTaskMutation,
  useEditTaskMutation,
  useDeleteTaskMutation
} from '../store/services/learningPlanApi';
import { 
  Loader2, 
  BookOpen, 
  Code, 
  MessageSquare, 
  FileText, 
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  X,
  Sparkles,
  Plus,
  Edit2,
  Trash2
} from 'lucide-react';

export const LearningPlan: React.FC = () => {
  const router = useRouter();
  const { data: plan, isLoading, error, refetch } = useGetPlanQuery({});
  const [generatePlan, { isLoading: isGenerating }] = useGeneratePlanMutation();
  const [toggleTask] = useToggleTaskMutation();
  const [regeneratePlan, { isLoading: isRegenerating }] = useRegeneratePlanMutation();

  // Onboarding Form States
  const [targetRole, setTargetRole] = useState('');
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState('');
  const [availableHours, setAvailableHours] = useState(10);
  const [interviewDate, setInterviewDate] = useState('');
  const [forceShowOnboarding, setForceShowOnboarding] = useState(false);
  const [viewMode, setViewMode] = useState<'roadmap' | 'checklist'>('roadmap');

  // Mutation Hooks
  const [addTask] = useAddTaskMutation();
  const [editTask] = useEditTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();

  // Task Dialog States
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'add' | 'edit'>('add');
  const [editingDay, setEditingDay] = useState('');
  const [editingTaskIdx, setEditingTaskIdx] = useState<number | null>(null);
  const [dialogTopic, setDialogTopic] = useState('');
  const [dialogActivityType, setDialogActivityType] = useState('study resource');
  const [dialogDuration, setDialogDuration] = useState(45);

  const handleOpenAddDialog = (dayName: string) => {
    setDialogMode('add');
    setEditingDay(dayName);
    setEditingTaskIdx(null);
    setDialogTopic('');
    setDialogActivityType('study resource');
    setDialogDuration(45);
    setTaskDialogOpen(true);
  };

  const handleOpenEditDialog = (dayName: string, originalIdx: number, task: any) => {
    setDialogMode('edit');
    setEditingDay(dayName);
    setEditingTaskIdx(originalIdx);
    setDialogTopic(task.topic);
    setDialogActivityType(task.activityType);
    setDialogDuration(task.durationMinutes);
    setTaskDialogOpen(true);
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dialogTopic.trim()) return;

    try {
      if (dialogMode === 'add') {
        await addTask({
          weekNumber: selectedWeekNum,
          dayOfWeek: editingDay,
          topic: dialogTopic.trim(),
          activityType: dialogActivityType,
          durationMinutes: Number(dialogDuration)
        }).unwrap();
      } else if (dialogMode === 'edit' && editingTaskIdx !== null) {
        await editTask({
          weekNumber: selectedWeekNum,
          dayOfWeek: editingDay,
          taskIndex: editingTaskIdx,
          topic: dialogTopic.trim(),
          activityType: dialogActivityType,
          durationMinutes: Number(dialogDuration)
        }).unwrap();
      }
      setTaskDialogOpen(false);
    } catch (err) {
      console.error('Failed to submit task action:', err);
    }
  };

  const handleDeleteTask = async (dayName: string, originalIdx: number) => {
    if (window.confirm("Are you sure you want to delete this task from your study roadmap?")) {
      try {
        await deleteTask({
          weekNumber: selectedWeekNum,
          dayOfWeek: dayName,
          taskIndex: originalIdx
        }).unwrap();
      } catch (err) {
        console.error('Failed to delete task:', err);
      }
    }
  };

  useEffect(() => {
    if (plan) {
      setTargetRole(plan.targetRole || '');
      setCompanies(plan.targetCompanies || []);
      setAvailableHours(plan.availableHoursPerWeek || 10);
      setInterviewDate(plan.interviewDate ? new Date(plan.interviewDate).toISOString().split('T')[0] : '');
    }
  }, [plan]);

  // Active View States
  const [selectedWeekNum, setSelectedWeekNum] = useState(1);
  const [showRegenerateConfirm, setShowRegenerateConfirm] = useState(false);

  const handleAddCompany = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && companyInput.trim()) {
      e.preventDefault();
      if (companies.length < 5 && !companies.includes(companyInput.trim())) {
        setCompanies([...companies, companyInput.trim()]);
      }
      setCompanyInput('');
    }
  };

  const handleRemoveCompany = (name: string) => {
    setCompanies(companies.filter(c => c !== name));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Auto-add any typed company names that weren't submitted with Enter
    let finalCompanies = [...companies];
    if (companyInput.trim() && !finalCompanies.includes(companyInput.trim()) && finalCompanies.length < 5) {
      finalCompanies.push(companyInput.trim());
      setCompanies(finalCompanies);
      setCompanyInput('');
    }
    
    if (!targetRole.trim() || finalCompanies.length === 0) return;

    // Parse date safely
    let formattedDate = null;
    if (interviewDate) {
      const dateObj = new Date(interviewDate);
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toISOString();
      }
    }

    try {
      await generatePlan({
        targetRole,
        targetCompanies: finalCompanies,
        availableHoursPerWeek: availableHours,
        interviewDate: formattedDate
      }).unwrap();
      setForceShowOnboarding(false);
    } catch (err) {
      console.error('Failed to generate learning plan:', err);
    }
  };

  const handleToggleTask = async (weekNumber: number, dayOfWeek: string, taskIndex: number) => {
    try {
      await toggleTask({
        weekNumber,
        dayOfWeek,
        taskIndex
      }).unwrap();
    } catch (err) {
      console.error('Failed to toggle task:', err);
    }
  };

  const handleRegenerate = async () => {
    try {
      await regeneratePlan({}).unwrap();
      setShowRegenerateConfirm(false);
    } catch (err) {
      console.error('Failed to regenerate plan:', err);
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'practice interview':
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case 'coding exercise':
        return <Code className="w-4 h-4 text-emerald-500" />;
      case 'behavioral prep':
        return <FileText className="w-4 h-4 text-purple-500" />;
      default:
        return <BookOpen className="w-4 h-4 text-amber-500" />;
    }
  };

  const getUrgencyBadge = (urgency: string) => {
    if (urgency === 'urgent') return 'bg-red-50 text-red-700 border-red-200';
    if (urgency === 'normal') return 'bg-blue-50 text-blue-700 border-blue-200';
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  };

  if (isLoading || isGenerating || isRegenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
        <span className="text-slate-500 text-sm">
          {isGenerating ? 'AI is building your study plan...' : 'Loading learning path...'}
        </span>
      </div>
    );
  }

  // ONBOARDING SCREEN
  if ((error || !plan) || forceShowOnboarding) {
    return (
      <div className="max-w-xl mx-auto space-y-6 py-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-blue-600 fill-current" />
            <span>Generate Study Path</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Answer a few questions to build an AI-guided weekly calendar targeting your weakness profile and dream companies.
          </p>
        </div>

        <form onSubmit={handleFormSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
          {/* Target Role */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">Target Role</label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer, Full Stack Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          {/* Target Companies Tag Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Target Companies (Max 5, Press Enter to add)
            </label>
            <div className="flex flex-wrap gap-1.5 p-1.5 border border-slate-200 rounded-lg min-h-[44px] items-center">
              {companies.map((company, idx) => (
                <span key={idx} className="bg-blue-50 text-blue-700 border border-blue-100 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                  <span>{company}</span>
                  <button type="button" onClick={() => handleRemoveCompany(company)} className="hover:text-red-500">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {companies.length < 5 && (
                <input
                  type="text"
                  placeholder={companies.length === 0 ? "e.g. Google, Stripe" : "Add company..."}
                  value={companyInput}
                  onChange={(e) => setCompanyInput(e.target.value)}
                  onKeyDown={handleAddCompany}
                  className="flex-1 bg-transparent border-0 outline-none focus:ring-0 text-sm min-w-[80px]"
                />
              )}
            </div>
          </div>

          {/* Hours per week slider */}
          <div className="space-y-1">
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 uppercase tracking-wide">
              <span>Study Hours Per Week</span>
              <span className="text-blue-600 font-extrabold">{availableHours} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              value={availableHours}
              onChange={(e) => setAvailableHours(parseInt(e.target.value))}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-semibold pt-1">
              <span>1 Hour</span>
              <span>20 Hours</span>
              <span>40 Hours</span>
            </div>
          </div>

          {/* Interview Date Picker */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide">
              Upcoming Interview Date <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="date"
              value={interviewDate}
              onChange={(e) => setInterviewDate(e.target.value)}
              className="w-full px-3.5 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[44px]"
            />
          </div>

          <div className="flex gap-3">
            {plan && (
              <button
                type="button"
                onClick={() => setForceShowOnboarding(false)}
                className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-sm font-bold transition shadow min-h-[44px]"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!targetRole.trim() || (companies.length === 0 && !companyInput.trim())}
              className={`${plan ? 'flex-1' : 'w-full'} py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-sm font-bold transition shadow min-h-[44px]`}
            >
              {plan ? 'Save Changes' : 'Generate Study Path'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ACTIVE LEARNING PLAN VIEW
  const generatedPlan = plan.generatedPlan;
  const weeks = generatedPlan.weeks || [];
  
  // Find current week data
  const currentWeek = weeks.find((w: any) => w.weekNumber === selectedWeekNum) || weeks[0];

  // Calculate Overall Progress
  let totalTasksCount = 0;
  let completedTasksCount = 0;
  weeks.forEach((w: any) => {
    if (w.dailyTasks) {
      w.dailyTasks.forEach((t: any) => {
        totalTasksCount++;
        if (t.completed) completedTasksCount++;
      });
    }
  });

  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Calculate specific week progress helper
  const getWeekProgress = (w: any) => {
    if (!w.dailyTasks) return 0;
    const total = w.dailyTasks.length;
    const completed = w.dailyTasks.filter((t: any) => t.completed).length;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      
      {/* HEADER CARD */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{generatedPlan.planTitle}</h1>
            <div className="flex flex-wrap gap-2 items-center mt-2">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border ${getUrgencyBadge(plan.urgency)}`}>
                {plan.urgency} Urgency
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500 font-bold">Target: {plan.targetRole}</span>
              <span className="text-slate-300">|</span>
              <span className="text-xs text-slate-500">Targeting: {plan.targetCompanies.join(', ')}</span>
            </div>
          </div>
          
          <div className="flex gap-2.5">
            <button
              onClick={() => setForceShowOnboarding(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold transition shadow-sm min-h-[44px]"
            >
              <span>Update Plan Settings</span>
            </button>
            <button
              onClick={() => setShowRegenerateConfirm(true)}
              className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-600 rounded-lg text-xs font-bold transition shadow-sm min-h-[44px]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Regenerate Study Path</span>
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
            <span>Overall Plan Progress</span>
            <span className="font-bold text-slate-900">{progressPercent}% ({completedTasksCount} / {totalTasksCount} tasks)</span>
          </div>
          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
            <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-stretch">
        
        {/* WEEK SIDEBAR TIMELINE */}
        <div className="lg:w-1/4 bg-white border border-slate-200 rounded-xl p-5 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-slate-900 text-base pb-2 border-b border-slate-100">Plan Timeline</h3>
          <div className="space-y-3">
            {weeks.map((w: any) => {
              const isActive = w.weekNumber === selectedWeekNum;
              const progress = getWeekProgress(w);
              
              return (
                <button
                  key={w.weekNumber}
                  onClick={() => setSelectedWeekNum(w.weekNumber)}
                  className={`w-full text-left p-3 border rounded-xl transition duration-150 flex flex-col gap-2 ${
                    isActive 
                      ? 'border-blue-500 bg-blue-50/10 shadow-sm' 
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span className={`text-xs font-extrabold ${isActive ? 'text-blue-600' : 'text-slate-800'}`}>
                      Week {w.weekNumber}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{progress}% done</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium truncate w-full">
                    {w.weeklyTheme}
                  </div>
                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* DAILY GRID PLANNER */}
        <div className="lg:w-3/4 space-y-4 flex flex-col justify-between">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4 flex-1">
            
            {/* Planner header and pagination */}
            <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-3">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Weekly Focus Theme</span>
                <h4 className="font-bold text-slate-900 text-lg leading-tight mt-0.5">{currentWeek.weeklyTheme}</h4>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {/* View Mode Toggle Switch */}
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    onClick={() => setViewMode('roadmap')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                      viewMode === 'roadmap'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Visual Roadmap
                  </button>
                  <button
                    onClick={() => setViewMode('checklist')}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold transition ${
                      viewMode === 'checklist'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Checklist Grid
                  </button>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedWeekNum(prev => Math.max(1, prev - 1))}
                    disabled={selectedWeekNum === 1}
                    className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg min-h-[44px] flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedWeekNum(prev => Math.min(weeks.length, prev + 1))}
                    disabled={selectedWeekNum === weeks.length}
                    className="p-2 border border-slate-200 hover:bg-slate-50 disabled:opacity-50 rounded-lg min-h-[44px] flex items-center"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {viewMode === 'roadmap' ? (
              /* VERTICAL TIMELINE NODE FLOW */
              <div className="relative pl-8 sm:pl-12 py-4 space-y-8">
                {/* Central Vertical Connector Line (Background) */}
                <div className="absolute left-[17px] sm:left-[21px] top-4 bottom-4 w-1 bg-slate-100 rounded-full" />

                {daysOfWeek.map((dayName, idx) => {
                  const dayTasks = currentWeek.dailyTasks?.filter((t: any) => t.day.toLowerCase() === dayName.toLowerCase()) || [];
                  const isLastDay = idx === daysOfWeek.length - 1;
                  
                  if (dayTasks.length === 0) {
                    return (
                      <div key={dayName} className="relative flex flex-col items-start min-h-[64px] space-y-2">
                        {/* Timeline node dot */}
                        <div className="absolute -left-[30px] sm:-left-[38px] top-1.5 w-5 h-5 rounded-full border border-slate-200 bg-slate-50 flex items-center justify-center z-10">
                          <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        </div>
                        {/* Rest Day card */}
                        <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-left w-full max-w-xl flex justify-between items-center shadow-sm z-10">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{dayName}</span>
                            <h5 className="font-bold text-slate-500 text-xs mt-0.5">Rest & Recharge Day</h5>
                          </div>
                          
                          <button
                            onClick={() => handleOpenAddDialog(dayName)}
                            className="flex items-center gap-1 text-[10px] font-bold text-blue-650 bg-blue-50/50 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Add Task</span>
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={dayName} className="relative flex flex-col items-start w-full space-y-4">
                      {/* Day Header */}
                      <div className="flex justify-between items-center w-full max-w-xl border-b border-slate-100 pb-1 z-10">
                        <span className="text-xs font-extrabold text-slate-700 tracking-tight">{dayName}</span>
                        <button
                          onClick={() => handleOpenAddDialog(dayName)}
                          className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 transition"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Task</span>
                        </button>
                      </div>

                      {dayTasks.map((task: any, tIdx: number) => {
                        // Find original index in the week's task array
                        const originalIdx = currentWeek.dailyTasks.findIndex(
                          (x: any) => x.day === task.day && x.topic === task.topic
                        );
                        
                        // Active / current task is the first incomplete task in the list
                        const isActive = !task.completed && 
                          currentWeek.dailyTasks.findIndex((t: any) => !t.completed) === originalIdx;

                        return (
                          <div key={tIdx} className="relative flex flex-col items-start w-full">
                            
                            {/* Dynamic line coloring segment */}
                            {!isLastDay && (
                              <div className={`absolute left-[17px] sm:left-[21px] top-6 -bottom-12 w-1 rounded-full z-0 ${
                                task.completed ? 'bg-emerald-500 shadow-sm shadow-emerald-200/50' : 'bg-slate-100'
                              }`} />
                            )}

                            {/* Timeline bullet */}
                            <div className={`absolute -left-[30px] sm:-left-[38px] top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 transition-all duration-200 ${
                              task.completed 
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-600'
                                : isActive
                                  ? 'border-blue-500 bg-blue-50 text-blue-600 shadow'
                                  : 'border-slate-200 bg-white text-slate-400'
                            }`}>
                              {task.completed ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-blue-600' : 'bg-slate-300'}`} />
                              )}
                            </div>

                            {/* Roadmap Node Card */}
                            <div className={`bg-white border rounded-xl p-4 shadow-sm w-full max-w-xl transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md text-left z-10 border-l-4 ${
                              task.completed
                                ? 'border-l-emerald-500 border-slate-200'
                                : isActive
                                  ? 'border-l-blue-500 border-blue-200 shadow-blue-50/50'
                                  : 'border-l-slate-300 border-slate-200'
                            }`}>
                              <div className="flex justify-between items-start gap-4">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-md uppercase flex items-center gap-1.5 ${
                                      task.completed 
                                        ? 'bg-emerald-50 text-emerald-700' 
                                        : 'bg-blue-50 text-blue-700'
                                    }`}>
                                      {getActivityIcon(task.activityType)}
                                      <span>{task.activityType}</span>
                                    </span>
                                  </div>
                                  <h5 className={`font-bold text-sm tracking-tight leading-snug mt-1.5 ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                                    {task.topic}
                                  </h5>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <button
                                    onClick={() => handleOpenEditDialog(task.day, originalIdx, task)}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition"
                                    title="Edit Task"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteTask(task.day, originalIdx)}
                                    className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                    title="Delete Task"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleToggleTask(currentWeek.weekNumber, task.day, originalIdx)}
                                    className={`p-1 rounded-full transition ${
                                      task.completed 
                                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' 
                                        : 'bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-600'
                                    }`}
                                    title={task.completed ? "Mark Incomplete" : "Mark Completed"}
                                  >
                                    <CheckCircle2 className="w-5 h-5 fill-current" />
                                  </button>
                                </div>
                              </div>

                              {/* Card footer details & Actions */}
                              <div className="flex justify-between items-center border-t border-slate-100 pt-3 mt-3">
                                <span className="flex items-center gap-1 text-[10px] text-slate-400 font-bold">
                                  <Clock className="w-3 h-3" />
                                  <span>{task.durationMinutes} Minutes</span>
                                </span>

                                {/* Quick-link Actions */}
                                <div className="flex gap-2">
                                  {task.activityType.toLowerCase() === 'practice interview' && (
                                    <button
                                      onClick={() => router.push('/ai-interviewer')}
                                      className="px-2.5 py-1 text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-md transition"
                                    >
                                      Launch AI Interview
                                    </button>
                                  )}
                                  {task.activityType.toLowerCase() === 'coding exercise' && (
                                    <button
                                      onClick={() => router.push('/')}
                                      className="px-2.5 py-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-md transition"
                                    >
                                      Open Code Sandbox
                                    </button>
                                  )}
                                  {task.activityType.toLowerCase() === 'behavioral prep' && (
                                    <button
                                      onClick={() => router.push('/questions')}
                                      className="px-2.5 py-1 text-[10px] font-bold text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-md transition"
                                    >
                                      Review Question Bank
                                    </button>
                                  )}
                                  {task.activityType.toLowerCase() === 'study resource' && (
                                    <button
                                      onClick={() => router.push('/revision')}
                                      className="px-2.5 py-1 text-[10px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-md transition"
                                    >
                                      Study Center
                                    </button>
                                  )}
                                </div>
                              </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 7 Day Columns Grid */
              <div className="grid grid-cols-1 lg:grid-cols-7 gap-3 items-stretch">
                {daysOfWeek.map((dayName) => {
                  const dayTasks = currentWeek.dailyTasks?.filter((t: any) => t.day.toLowerCase() === dayName.toLowerCase()) || [];
                  
                  return (
                    <div key={dayName} className="space-y-2 border-b lg:border-b-0 lg:border-r border-slate-100 last:border-0 pb-4 lg:pb-0 lg:pr-1 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center border-b border-slate-100 pb-1.5">
                          {dayName.slice(0, 3)}
                        </span>

                        <div className="space-y-2 pt-1">
                          {dayTasks.length === 0 ? (
                            <div className="text-[10px] text-slate-400 italic text-center py-4 bg-slate-50 border border-slate-100 rounded-lg">
                              Rest Day
                            </div>
                          ) : (
                            dayTasks.map((task: any, tIdx: number) => {
                              const originalIdx = currentWeek.dailyTasks.findIndex(
                                (x: any) => x.day === task.day && x.topic === task.topic
                              );
                              
                              return (
                                <div
                                  key={tIdx}
                                  className={`w-full p-2 border rounded-lg text-left transition duration-150 flex flex-col justify-between gap-3 min-h-[120px] ${
                                    task.completed
                                      ? 'bg-slate-50 border-slate-100 text-slate-400 shadow-none'
                                      : 'bg-white border-slate-200 shadow-sm'
                                  }`}
                                >
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-start gap-1">
                                      <span className={`text-[10px] leading-tight font-extrabold break-words ${task.completed ? 'line-through' : 'text-slate-800'}`}>
                                        {task.topic}
                                      </span>
                                      
                                      <div className="flex items-center gap-0.5 flex-shrink-0">
                                        <button
                                          onClick={() => handleOpenEditDialog(task.day, originalIdx, task)}
                                          className="p-0.5 text-slate-400 hover:text-blue-600 rounded transition"
                                          title="Edit Task"
                                        >
                                          <Edit2 className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteTask(task.day, originalIdx)}
                                          className="p-0.5 text-slate-400 hover:text-red-650 rounded transition"
                                          title="Delete Task"
                                        >
                                          <Trash2 className="w-2.5 h-2.5" />
                                        </button>
                                        <button
                                          onClick={() => handleToggleTask(currentWeek.weekNumber, task.day, originalIdx)}
                                          className={`p-0.5 rounded transition ${
                                            task.completed ? 'text-emerald-650' : 'text-slate-400 hover:text-slate-650'
                                          }`}
                                        >
                                          <CheckCircle2 className="w-3.5 h-3.5 fill-none text-current" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex justify-between items-center text-[9px] text-slate-400 font-semibold border-t border-slate-100 pt-1.5 w-full">
                                    <span className="flex items-center gap-0.5">
                                      {getActivityIcon(task.activityType)}
                                      <span className="capitalize">{task.activityType.split(' ')[0]}</span>
                                    </span>
                                    <span className="flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" />
                                      <span>{task.durationMinutes}m</span>
                                    </span>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAddDialog(dayName)}
                        className="w-full py-1.5 border border-dashed border-slate-200 hover:border-blue-400 text-[10px] font-bold text-slate-500 hover:text-blue-600 rounded-lg transition flex items-center justify-center gap-1 bg-slate-50/50 mt-2"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Task</span>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* REGENERATE CONFIRMATION DIALOG */}
      {showRegenerateConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-sm w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-red-650">
              <AlertCircle className="w-8 h-8" />
              <h3 className="font-bold text-slate-900 text-lg">Regenerate Study Path?</h3>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed font-medium">
              Generating a fresh plan will discard your current checked task progress permanently. Are you sure you want to proceed?
            </p>
            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setShowRegenerateConfirm(false)}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleRegenerate}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold min-h-[44px]"
              >
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TASK ADD/EDIT DIALOG */}
      {taskDialogOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-xl max-w-md w-full p-6 shadow-xl space-y-4 text-left">
            <div>
              <h3 className="font-bold text-slate-900 text-lg flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600 fill-current" />
                <span>{dialogMode === 'add' ? 'Add Custom Task' : 'Edit Task'}</span>
              </h3>
              <p className="text-slate-500 text-xs mt-0.5">
                Customize your roadmap for {editingDay}
              </p>
            </div>

            <form onSubmit={handleDialogSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Task Topic / Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master React Fiber & Render Phase"
                  value={dialogTopic}
                  onChange={(e) => setDialogTopic(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Category</label>
                <select
                  value={dialogActivityType}
                  onChange={(e) => setDialogActivityType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                >
                  <option value="study resource">Study Resource</option>
                  <option value="coding exercise">Coding Exercise</option>
                  <option value="practice interview">Practice Interview</option>
                  <option value="behavioral prep">Behavioral Prep</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Duration (Minutes)</label>
                <input
                  type="number"
                  required
                  min="5"
                  max="300"
                  value={dialogDuration}
                  onChange={(e) => setDialogDuration(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none min-h-[40px]"
                />
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTaskDialogOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-xs font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold min-h-[44px]"
                >
                  {dialogMode === 'add' ? 'Add Task' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LearningPlan;
