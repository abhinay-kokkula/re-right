import { useState, useEffect } from 'react';
import { Sparkles, History, RefreshCw, AlertCircle } from 'lucide-react';
import { RewriteCard } from './components/RewriteCard';
import { HistoryItem } from './components/HistoryItem';
import { useSession } from './hooks/useSession';
import {
  rewriteText,
  saveRewriteHistory,
  updateSelectedOption,
  getRewriteHistory,
  deleteHistoryItem,
} from './services/rewriterService';
import { RewriteOption, RewriteHistory } from './lib/supabase';

function App() {
  const [inputText, setInputText] = useState('');
  const [rewriteOptions, setRewriteOptions] = useState<RewriteOption[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  const [history, setHistory] = useState<RewriteHistory[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useSession();

  useEffect(() => {
    if (sessionId) {
      loadHistory();
    }
  }, [sessionId]);

  const loadHistory = async () => {
    if (!sessionId) return;
    const historyData = await getRewriteHistory(sessionId);
    setHistory(historyData);
  };

  const handleRewrite = async () => {
    if (!inputText.trim()) {
      setError('Please enter some text to rewrite');
      return;
    }

    if (inputText.trim().length < 5) {
      setError('Please enter at least 5 characters');
      return;
    }

    setError(null);
    setLoading(true);
    setSelectedIndex(null);
    setCurrentHistoryId(null);

    try {
      const options = await rewriteText(inputText, sessionId);
      setRewriteOptions(options);

      const historyId = await saveRewriteHistory(inputText, options, sessionId);
      setCurrentHistoryId(historyId);

      await loadHistory();
    } catch (err) {
      setError('Failed to generate rewrites. Please try again.');
      console.error('Rewrite error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = async (index: number) => {
    setSelectedIndex(index);

    if (currentHistoryId) {
      await updateSelectedOption(currentHistoryId, index);
      await loadHistory();
    }
  };

  const handleDeleteHistory = async (id: string) => {
    const success = await deleteHistoryItem(id);
    if (success) {
      await loadHistory();
    }
  };

  const handleRestoreFromHistory = (text: string) => {
    setInputText(text);
    setShowHistory(false);
    setRewriteOptions([]);
    setSelectedIndex(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleRewrite();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-3">RE-right</h1>
          <p className="text-gray-600 text-lg">
            Transform your content with intelligent rewriting options
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Original Text</h2>
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <History className="w-4 h-4" />
                  History
                </button>
              </div>

              <textarea
                value={inputText}
                onChange={(e) => {
                  setInputText(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyPress}
                placeholder="Enter your text here... (Press Cmd/Ctrl + Enter to rewrite)"
                className="w-full h-40 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              />

              {error && (
                <div className="mt-4 flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  {inputText.length} characters
                </p>
                <button
                  onClick={handleRewrite}
                  disabled={loading || !inputText.trim()}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-sm"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      Rewriting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Rewrite
                    </>
                  )}
                </button>
              </div>
            </div>

            {rewriteOptions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold text-gray-900">Rewrite Options</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rewriteOptions.map((option, index) => (
                    <RewriteCard
                      key={index}
                      option={option}
                      index={index}
                      isSelected={selectedIndex === index}
                      onSelect={handleSelectOption}
                    />
                  ))}
                </div>
                {selectedIndex !== null && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <p className="text-sm text-green-800 font-medium">
                      ✓ Selected option saved to history
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 sticky top-8">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-gray-700" />
                <h2 className="text-xl font-semibold text-gray-900">Recent History</h2>
              </div>

              {history.length === 0 ? (
                <div className="text-center py-8">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">No history yet</p>
                  <p className="text-gray-400 text-xs mt-1">
                    Your rewrites will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-2">
                  {history.map((item) => (
                    <HistoryItem
                      key={item.id}
                      item={item}
                      onDelete={handleDeleteHistory}
                      onRestore={handleRestoreFromHistory}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
