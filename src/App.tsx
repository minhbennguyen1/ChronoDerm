import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { TimeMachine3D } from './components/TimeMachine3D';
import { CameraOverlay } from './components/CameraOverlay';
import { HCPDashboard } from './components/HCPDashboard';
import { TryOutGuide } from './components/TryOutGuide';
import { AboutSection } from './components/AboutSection';
import { AccountModal } from './components/AccountModal';
import { AiDermatologyChatbot } from './components/AiDermatologyChatbot';
import { UsDermatologyMap } from './components/UsDermatologyMap';
import { AiAnalysisModal } from './components/AiAnalysisModal';
import { AiDifferenceModal } from './components/AiDifferenceModal';
import { ConnectDoctorSection, DoctorReferralContext } from './components/ConnectDoctorSection';
import { ClinicalCase, SkinTimelineFrame, UserAccount, SingleImageAnalysisResult } from './types';
import { isModerateToSevereDermaLens, getEffectiveIgaScore, getIgaDetails } from './utils/dermaLensHelper';
import {
  getCurrentUser,
  setCurrentUser,
  logInUser,
  enterDemoMode,
  logOutUser,
  DEFAULT_USER
} from './services/authService';
import {
  loadUserCases,
  saveUserCases,
  sortFramesChronologically
} from './services/storageService';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  Trash2,
  Camera,
  ArrowRight,
  Bot,
  MapPin,
  Stethoscope
} from 'lucide-react';

export function App() {
  // Current user account state
  const [currentUser, setUserState] = useState<UserAccount>(() => getCurrentUser());
  const [isAccountModalOpen, setIsAccountModalOpen] = useState<boolean>(false);

  // Cases state
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [activeCaseId, setActiveCaseId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'slider' | 'doctor' | 'tryout' | 'hcp' | 'about' | 'chat' | 'map'>('slider');

  // Doctor referral & triage context (e.g. from a low-score scan)
  const [doctorReferralContext, setDoctorReferralContext] = useState<DoctorReferralContext | null>(null);

  // Camera Overlay modal
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);

  // AI Inspection Modals state
  const [singleAnalysisFrame, setSingleAnalysisFrame] = useState<SkinTimelineFrame | null>(null);
  const [differencePair, setDifferencePair] = useState<{
    baseline: SkinTimelineFrame;
    latest: SkinTimelineFrame;
  } | null>(null);

  // Chatbot selected photo context
  const [selectedChatPhoto, setSelectedChatPhoto] = useState<SkinTimelineFrame | null>(null);

  // In-app Toast message
  const [toastMessage, setToastMessage] = useState<{
    text: string;
    type: 'success' | 'info' | 'delete' | 'error';
  } | null>(null);

  const showToast = useCallback(
    (text: string, type: 'success' | 'info' | 'delete' | 'error' = 'success') => {
      setToastMessage({ text, type });
      setTimeout(() => {
        setToastMessage((prev) => (prev?.text === text ? null : prev));
      }, 3500);
    },
    []
  );

  // Load cases whenever user changes
  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setIsLoading(true);
      try {
        const loaded = await loadUserCases(currentUser.id, !!currentUser.isGuestDemo);
        if (!mounted) return;
        setCases(loaded);
        if (loaded.length > 0) {
          setActiveCaseId(loaded[0].id);
        }
      } catch (err) {
        console.error('Failed to load user cases:', err);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentUser.id, currentUser.isGuestDemo]);

  // Active case object
  const activeCase = cases.find((c) => c.id === activeCaseId) || cases[0];

  // Detect whether case or active scan has a Moderate-to-Severe presentation per Impiricus DermaLens (IGA 3 or 4)
  const hasLowScoreAlert = Boolean(
    activeCase?.frames.some((f) => isModerateToSevereDermaLens(f)) ||
    (doctorReferralContext?.frame && isModerateToSevereDermaLens(doctorReferralContext.frame))
  );

  // Connect to doctor triage handler (strictly gates urgent connect right away to Moderate to Severe per Impiricus DermaLens)
  const handleConnectDoctor = useCallback(
    (frame?: SkinTimelineFrame, reason?: string, healthScore?: number) => {
      const dermaLens = frame?.dermaLensEvaluation || frame?.aiAnalysis?.dermaLensEvaluation;
      const isModSevere = isModerateToSevereDermaLens(frame, dermaLens);
      const iga = getEffectiveIgaScore(frame, dermaLens);
      const igaInfo = getIgaDetails(iga);

      setDoctorReferralContext({
        frame,
        conditionName: activeCase?.condition,
        reason: reason || (isModSevere
          ? `Urgent physician triage (Impiricus DermaLens™): ${igaInfo.severityGroup} presentation (IGA ${iga}/4, Suboptimal Status)`
          : `Routine clinical consultation for ${activeCase?.condition} (IGA ${iga}/4: ${igaInfo.severityGroup})`),
        healthScore,
        urgencyLevel: isModSevere ? 'critical' : 'standard',
        dermaLensEvaluation: dermaLens,
      });
      setActiveTab('doctor');
      if (isModSevere) {
        showToast(`Impiricus DermaLens Alert: ${igaInfo.severityGroup} (IGA ${iga}/4) - Connect Right Away Active`, 'error');
      } else {
        showToast(`Dermatology Consultation: Scan graded as ${igaInfo.severityGroup} (IGA ${iga}/4 - Routine)`, 'info');
      }
    },
    [activeCase, showToast]
  );

  // Save new photo frame to active case
  const handleCaptureFrame = async (newFrame: SkinTimelineFrame) => {
    if (!activeCase) return;

    const updatedFrames = sortFramesChronologically([...activeCase.frames, newFrame]);
    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
      totalWeeks: Math.max(...updatedFrames.map((f) => f.week), activeCase.totalWeeks),
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);

    // Save to account-partitioned storage
    await saveUserCases(currentUser.id, updatedCases);

    if (newFrame.dermaLensEvaluation) {
      const evalData = newFrame.dermaLensEvaluation;
      showToast(
        `DermaLens: ${evalData.detected_condition} (IGA ${evalData.iga_score}/4 • ${evalData.status.toUpperCase()})`,
        evalData.status === 'suboptimal' ? 'error' : 'success'
      );
    } else {
      showToast(`Photo for Week ${newFrame.week} (Day ${newFrame.day}) saved! Running AI diagnostic check...`, 'success');
    }

    // Automatically trigger AI single image analysis modal so user immediately sees diagnostic score & doctor recommendations
    setSingleAnalysisFrame(newFrame);
  };

  // Save AI diagnosis to a frame
  const handleSaveAnalysis = async (frameId: string, analysis: SingleImageAnalysisResult) => {
    if (!activeCase) return;

    const updatedFrames = activeCase.frames.map((f) => {
      if (f.id === frameId) {
        return {
          ...f,
          aiAnalysis: analysis,
          dermaLensEvaluation: analysis.dermaLensEvaluation || f.dermaLensEvaluation,
          erythemaIndex: analysis.erythemaIndex ?? f.erythemaIndex,
          inflammationAreaMm2: analysis.estimatedAreaMm2 ?? f.inflammationAreaMm2,
        };
      }
      return f;
    });

    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);
    await saveUserCases(currentUser.id, updatedCases);
    showToast(`AI diagnostic report saved for ${analysis.primaryDiagnosisSuggestion}!`, 'success');
  };

  // BULLETPROOF DELETE FRAME HANDLER
  const handleDeleteFrame = async (frameId: string) => {
    if (!activeCase) return;

    const targetFrame = activeCase.frames.find((f: SkinTimelineFrame) => f.id === frameId);
    const updatedFrames = activeCase.frames.filter((f: SkinTimelineFrame) => f.id !== frameId);

    const updatedCase: ClinicalCase = {
      ...activeCase,
      frames: updatedFrames,
    };

    const updatedCases = cases.map((c) => (c.id === activeCase.id ? updatedCase : c));
    setCases(updatedCases);

    // Immediately persist to user's storage
    await saveUserCases(currentUser.id, updatedCases);

    const label = targetFrame?.label || 'Photo checkpoint';
    showToast(`${label} deleted from account storage.`, 'delete');
  };

  // Switch to personal user account
  const handleLogin = async (email: string, name?: string) => {
    const user = logInUser(email, name);
    setUserState(user);
    showToast(`Signed into ${user.name}'s personal account. Zero pre-existing data.`, 'info');
    setActiveTab('slider');
  };

  // Switch to demo mode (Try Now feature for new users)
  const handleEnterDemo = () => {
    const guestUser = enterDemoMode();
    setUserState(guestUser);
    showToast('Switched to Try Now Demo mode (sample clinical trial benchmark data).', 'info');
  };

  const handleLogout = () => {
    const defaultUser = logOutUser();
    setUserState(defaultUser);
    showToast('Logged out of account session.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#080b12] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navbar */}
      <Navbar
        cases={cases}
        activeCaseId={activeCaseId}
        onSelectCase={(id) => setActiveCaseId(id)}
        activeTab={activeTab}
        onSelectTab={(t) => setActiveTab(t)}
        onLaunchCamera={() => setIsCameraOpen(true)}
        currentUser={currentUser}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
        hasLowScoreAlert={hasLowScoreAlert}
      />

      {/* Demo Banner for New Users (Try Now Mode) */}
      {currentUser.isGuestDemo && (
        <div className="bg-gradient-to-r from-amber-500/20 via-amber-600/15 to-transparent border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Try Now Demo Mode:</strong> You are exploring clinical trial benchmark cases. Real user accounts have zero pre-existing data.
            </span>
          </div>

          <button
            type="button"
            onClick={() => handleLogin(DEFAULT_USER.email, DEFAULT_USER.name)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-bold text-[11px] hover:bg-amber-300 transition-colors cursor-pointer"
          >
            <span>Open Personal Account</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center min-h-[400px] gap-3 text-slate-400">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono">Loading account storage...</p>
          </div>
        ) : (
          <>
            {/* 1. 3D Morph & Presage Telemetry Slider */}
            {activeTab === 'slider' && activeCase && (
              <TimeMachine3D
                clinicalCase={activeCase}
                onLaunchCamera={() => setIsCameraOpen(true)}
                onDeleteFrame={handleDeleteFrame}
                onOpenSingleAnalysis={(frame) => setSingleAnalysisFrame(frame)}
                onOpenDifferenceAnalysis={(baseline, latest) => setDifferencePair({ baseline, latest })}
                onOpenChatbot={(frame) => {
                  setSelectedChatPhoto(frame || null);
                  setActiveTab('chat');
                }}
                onOpenMap={() => setActiveTab('map')}
                onConnectDoctor={handleConnectDoctor}
              />
            )}

            {/* 2. Connect with a Board-Certified Dermatologist */}
            {activeTab === 'doctor' && (
              <ConnectDoctorSection
                referralContext={doctorReferralContext}
                onClearReferral={() => setDoctorReferralContext(null)}
                onNavigateToMap={() => setActiveTab('map')}
                onNavigateToSlider={() => setActiveTab('slider')}
              />
            )}

            {/* 2. Interactive AI Clinical Dermatology Chatbot */}
            {activeTab === 'chat' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold border border-cyan-500/30">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">AI Dermatology Consultation & Treatments</h2>
                      <p className="text-xs text-slate-400">
                        Discuss your skin images, understand visual changes, and explore dermatologist-recommended treatments.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('slider')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to 3D Slider
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('map')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Find Clinic on US Map</span>
                    </button>
                  </div>
                </div>

                <AiDermatologyChatbot
                  photos={activeCase?.frames || []}
                  activePhoto={selectedChatPhoto || (activeCase?.frames.length ? activeCase.frames[0] : null)}
                  conditionName={activeCase?.condition || 'Skin Condition'}
                  onNavigateToMap={() => setActiveTab('map')}
                  onNavigateToDifference={() => {
                    if (activeCase && activeCase.frames.length >= 2) {
                      setDifferencePair({
                        baseline: activeCase.frames[0],
                        latest: activeCase.frames[activeCase.frames.length - 1],
                      });
                    }
                  }}
                />
              </div>
            )}

            {/* 3. US Dermatologist Clinic Locator Map */}
            {activeTab === 'map' && (
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between glass-card p-4 rounded-2xl border border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold border border-emerald-500/30">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">US Verified Dermatologist Directory</h2>
                      <p className="text-xs text-slate-400">
                        Locate verified board-certified dermatology centers, book consultations, or find telehealth support across the United States.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('slider')}
                      className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer"
                    >
                      Back to 3D Slider
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('chat')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 text-xs font-mono transition-colors cursor-pointer"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Ask AI Chatbot</span>
                    </button>
                  </div>
                </div>

                <UsDermatologyMap
                  onAskChatbot={(clinicName) => {
                    setActiveTab('chat');
                    showToast(`Ready to discuss ${clinicName} with AI Assistant`, 'info');
                  }}
                />
              </div>
            )}

            {/* 4. Try Out Guide Tab */}
            {activeTab === 'tryout' && (
              <TryOutGuide
                isGuestDemo={!!currentUser.isGuestDemo}
                onExploreCases={() => {
                  if (!currentUser.isGuestDemo) {
                    handleEnterDemo();
                  }
                  setActiveTab('slider');
                }}
                onTryCamera={() => setIsCameraOpen(true)}
                onGoToPersonalAccount={() => {
                  handleLogin(DEFAULT_USER.email, DEFAULT_USER.name);
                  setActiveTab('slider');
                }}
              />
            )}

            {/* 5. Healthcare Professional Dashboard */}
            {activeTab === 'hcp' && activeCase && (
              <HCPDashboard
                clinicalCase={activeCase}
                onNavigateToSlider={() => setActiveTab('slider')}
              />
            )}

            {/* 6. About Section */}
            {activeTab === 'about' && <AboutSection />}
          </>
        )}
      </main>

      {/* Standardized Camera & Photo Upload Overlay Modal */}
      {isCameraOpen && activeCase && (
        <CameraOverlay
          silhouetteType={activeCase.silhouetteType}
          conditionName={activeCase.condition}
          defaultWeek={activeCase.frames.length > 0 ? activeCase.frames[activeCase.frames.length - 1].week + 1 : 1}
          defaultDay={activeCase.frames.length > 0 ? activeCase.frames[activeCase.frames.length - 1].day + 7 : 0}
          onCaptureFrame={handleCaptureFrame}
          onClose={() => setIsCameraOpen(false)}
          onTriggerDoctorReferral={(frame, reason) => {
            handleConnectDoctor(frame, reason, 35);
          }}
        />
      )}

      {/* AI Single Image Diagnostic Modal ("What is wrong with this skin picture") */}
      {singleAnalysisFrame && (
        <AiAnalysisModal
          frame={singleAnalysisFrame}
          conditionName={activeCase?.condition}
          onClose={() => setSingleAnalysisFrame(null)}
          onAskChatbot={() => {
            setSelectedChatPhoto(singleAnalysisFrame);
            setSingleAnalysisFrame(null);
            setActiveTab('chat');
          }}
          onFindClinic={() => {
            setSingleAnalysisFrame(null);
            setActiveTab('map');
          }}
          onConnectDoctor={handleConnectDoctor}
          onSaveAnalysis={handleSaveAnalysis}
        />
      )}

      {/* AI Longitudinal Difference Comparison Modal */}
      {differencePair && (
        <AiDifferenceModal
          baselineFrame={differencePair.baseline}
          latestFrame={differencePair.latest}
          conditionName={activeCase?.condition}
          onClose={() => setDifferencePair(null)}
          onAskChatbot={() => {
            setSelectedChatPhoto(differencePair.latest);
            setDifferencePair(null);
            setActiveTab('chat');
          }}
        />
      )}

      {/* Account & Storage Manager Modal */}
      <AccountModal
        isOpen={isAccountModalOpen}
        currentUser={currentUser}
        onClose={() => setIsAccountModalOpen(false)}
        onLogin={handleLogin}
        onEnterDemo={handleEnterDemo}
        onLogout={handleLogout}
      />

      {/* Floating In-App Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl shadow-2xl border backdrop-blur-md text-xs font-medium ${
              toastMessage.type === 'delete' || toastMessage.type === 'error'
                ? 'bg-rose-950/90 text-rose-200 border-rose-500/50'
                : toastMessage.type === 'info'
                ? 'bg-blue-950/90 text-blue-200 border-blue-500/50'
                : 'bg-emerald-950/90 text-emerald-200 border-emerald-500/50'
            }`}
          >
            {toastMessage.type === 'delete' ? (
              <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            ) : toastMessage.type === 'info' ? (
              <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
