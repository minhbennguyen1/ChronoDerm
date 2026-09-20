import React, { useState, useRef, useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Image as ImageIcon,
  AlertTriangle,
  MapPin,
  RefreshCw,
  Clock,
  ShieldAlert,
  Flame,
  ChevronRight,
  Info
} from 'lucide-react';
import { ChatMessage, SkinTimelineFrame } from '../types';
import { sendChatMessage } from '../services/aiService';

interface AiDermatologyChatbotProps {
  photos: SkinTimelineFrame[];
  activePhoto?: SkinTimelineFrame | null;
  conditionName?: string;
  onNavigateToMap?: () => void;
  onNavigateToDifference?: () => void;
}

export const AiDermatologyChatbot: React.FC<AiDermatologyChatbotProps> = ({
  photos,
  activePhoto,
  conditionName = 'Eczema / Dermatitis',
  onNavigateToMap,
  onNavigateToDifference,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `👋 Hello! I am your **ChronoDerm AI Clinical Dermatology Assistant**. 

I have analyzed your **${photos.length} photo checkpoint${photos.length === 1 ? '' : 's'}** for *${conditionName}*. 

You can ask me anything about your uploaded pictures:
- **"What is visually wrong with my skin in my latest picture?"**
- **"What treatments or barrier creams do you recommend?"**
- **"Are my photos showing real healing differences over time?"**
- **"What common triggers should I eliminate?"**

How can I assist you with your skin today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputMessage, setInputMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFocusPhoto, setSelectedFocusPhoto] = useState<SkinTimelineFrame | null>(
    activePhoto || (photos.length > 0 ? photos[photos.length - 1] : null)
  );

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (activePhoto) {
      setSelectedFocusPhoto(activePhoto);
    } else if (photos.length > 0 && !selectedFocusPhoto) {
      setSelectedFocusPhoto(photos[photos.length - 1]);
    }
  }, [activePhoto, photos]);

  const QUICK_QUESTIONS = [
    'What do you see wrong in this picture?',
    'What treatments and creams are recommended for this?',
    'How do my pictures compare? Is it improving?',
    'What triggers should I avoid to prevent flares?',
    'When should I see an in-person dermatologist?',
  ];

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prioritize the focus photo and the baseline photo
      const relevantPhotos: SkinTimelineFrame[] = [];
      if (photos.length > 0) {
        relevantPhotos.push(photos[0]); // baseline
      }
      if (selectedFocusPhoto && selectedFocusPhoto.id !== photos[0]?.id) {
        relevantPhotos.push(selectedFocusPhoto);
      } else if (photos.length > 1) {
        relevantPhotos.push(photos[photos.length - 1]);
      }

      const reply = await sendChatMessage(
        textToSend,
        messages,
        relevantPhotos,
        {
          condition: conditionName,
          activeLabel: selectedFocusPhoto ? selectedFocusPhoto.label : 'Uploaded skin photo',
          latestEI: selectedFocusPhoto ? selectedFocusPhoto.erythemaIndex : undefined,
          severity: selectedFocusPhoto ? `${selectedFocusPhoto.severityScore}/72` : undefined,
        }
      );

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${err.message || 'I encountered a brief network delay connecting to the AI model. ChronoDerm is ready—please try sending your question again.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 max-w-5xl mx-auto w-full py-2">
      {/* Top Context & Photo Strip */}
      <div className="glass-card-glow rounded-3xl p-5 border border-cyan-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 via-blue-500 to-indigo-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-cyan-500/20 shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                AI Dermatology Assistant & Treatment Advisor
              </h2>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Discussing {photos.length} uploaded photo{photos.length === 1 ? '' : 's'} for{' '}
              <span className="text-cyan-300 font-semibold">{conditionName}</span>. Ask about clinical findings, treatment regimens, and red-flags.
            </p>
          </div>
        </div>

        {/* Quick action buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {photos.length >= 2 && onNavigateToDifference && (
            <button
              type="button"
              onClick={onNavigateToDifference}
              className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Compare Differences</span>
            </button>
          )}

          {onNavigateToMap && (
            <button
              type="button"
              onClick={onNavigateToMap}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 text-xs font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-cyan-500/20"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>US Clinic Map</span>
            </button>
          )}
        </div>
      </div>

      {/* Patient Photos Attached Strip */}
      {photos.length > 0 && (
        <div className="glass-card rounded-2xl p-3 border border-slate-800 flex items-center gap-3 overflow-x-auto">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-cyan-400" />
            <span>Active Photos ({photos.length}):</span>
          </span>

          <div className="flex items-center gap-2">
            {photos.map((photo) => {
              const isSelected = selectedFocusPhoto?.id === photo.id;
              return (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setSelectedFocusPhoto(photo)}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs transition-all shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600'
                  }`}
                >
                  <img
                    src={photo.imageUrl}
                    alt={photo.label}
                    className="w-6 h-6 rounded-md object-cover border border-slate-700"
                  />
                  <div className="text-left font-mono">
                    <div className="font-bold text-[11px] leading-none">{photo.label}</div>
                    <div className="text-[9px] text-cyan-300">EI: {photo.erythemaIndex}</div>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Chat Messages Log */}
      <div className="glass-card rounded-3xl p-4 md:p-6 border border-slate-800 min-h-[460px] max-h-[580px] flex flex-col justify-between overflow-hidden shadow-2xl">
        <div className="overflow-y-auto space-y-4 pr-2 flex-1 pb-4">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 items-start ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shrink-0 mt-0.5 shadow-md shadow-cyan-500/20">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] md:max-w-[78%] rounded-2xl p-4 text-xs md:text-sm leading-relaxed shadow-lg ${
                    isUser
                      ? 'bg-cyan-600 text-white rounded-tr-sm'
                      : 'bg-slate-900/90 border border-slate-700/80 text-slate-200 rounded-tl-sm'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 pb-1.5 mb-1.5 border-b border-white/10 text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-cyan-300">{isUser ? 'You' : 'ChronoDerm AI'}</span>
                    <span>{msg.timestamp}</span>
                  </div>

                  {/* Message body */}
                  <div className="markdown-body space-y-2 text-xs md:text-[13px]">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                </div>

                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-cyan-300 flex items-center justify-center font-bold shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-3 items-start justify-start">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center font-bold shrink-0 animate-pulse">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-cyan-300 flex items-center gap-3">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                <span>AI analyzing photo features and formulating clinical treatment guidance...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Question Chips */}
        <div className="pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider shrink-0">
              Suggested:
            </span>
            {QUICK_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(question)}
                disabled={isLoading}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-cyan-500/40 text-[11px] text-slate-300 hover:text-white shrink-0 transition-colors disabled:opacity-50 cursor-pointer"
              >
                {question}
              </button>
            ))}
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2 mt-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={
                  selectedFocusPhoto
                    ? `Ask about ${selectedFocusPhoto.label} or treatment recommendations...`
                    : 'Ask ChronoDerm AI about your skin condition or treatments...'
                }
                disabled={isLoading}
                className="w-full bg-slate-950/80 border border-slate-700/80 rounded-2xl pl-4 pr-10 py-3 text-xs md:text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading || !inputMessage.trim()}
              className="w-11 h-11 rounded-2xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 disabled:hover:bg-cyan-500 text-slate-950 flex items-center justify-center font-bold transition-all shrink-0 cursor-pointer shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>

          {/* Clinical Disclaimer */}
          <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400 mt-2 text-center">
            <Info className="w-3 h-3 text-slate-400 shrink-0" />
            <span>AI analysis provides educational & clinical decision support. Always consult a certified dermatologist for prescription treatments.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
