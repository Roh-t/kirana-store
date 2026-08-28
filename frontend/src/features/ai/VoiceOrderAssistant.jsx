import React, { useState } from 'react';
import { aiService } from '../../services/aiService';
import { useCart } from '../../context/CartContext';
import { Mic, MicOff, Sparkles, Check, X, ShoppingBag } from 'lucide-react';

export const VoiceOrderAssistant = ({ slug, isOpen, onClose }) => {
  const [rawText, setRawText] = useState('');
  const [listening, setListening] = useState(false);
  const [parsedData, setParsedData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { updateQuantity } = useCart();

  if (!isOpen) return null;

  const handleStartVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition not supported in this browser. Please type or paste text below.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'hi-IN'; // Speech recognition configured for Hindi/Hinglish
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setRawText(transcript);
    };

    recognition.start();
  };

  const handleParseText = async (e) => {
    e.preventDefault();
    setError(null);
    if (!rawText.trim()) return;

    try {
      setLoading(true);
      const res = await aiService.parseVoiceOrder(slug, rawText);
      setParsedData(res.data);
    } catch (err) {
      setError(err.message || 'Failed to parse order text');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadToCart = () => {
    if (!parsedData || parsedData.matchedItems.length === 0) return;

    parsedData.matchedItems.forEach((item) => {
      updateQuantity(item.product, item.quantity);
    });

    alert(`Loaded ${parsedData.matchedItems.length} matched item(s) to your cart!`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 space-y-4">
        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 text-base">AI Voice & Quick Order</h3>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <div className="p-2.5 bg-red-50 text-red-700 text-xs rounded-xl font-medium">{error}</div>}

        {/* Voice Microphone Button */}
        <div className="text-center p-4 bg-purple-50 rounded-2xl border border-purple-100">
          <button
            type="button"
            onClick={handleStartVoice}
            className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center transition shadow-md ${
              listening ? 'bg-red-500 text-white animate-ping' : 'bg-purple-600 hover:bg-purple-700 text-white'
            }`}
          >
            {listening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-xs font-bold text-purple-900 mt-2">
            {listening ? 'Listening... Speak now in Hindi/English' : 'Tap Mic & Speak Grocery List'}
          </p>
        </div>

        {/* Manual Input Form */}
        <form onSubmit={handleParseText} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Or Paste Grocery List Text (e.g. "2 Aashirvaad Atta, 1 Oil")
            </label>
            <textarea
              rows={3}
              placeholder="e.g. 2 Aashirvaad Atta, 1 litre oil, sugar"
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full p-3 text-xs border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
          >
            <Sparkles className="w-4 h-4" />
            {loading ? 'AI Parsing Order...' : 'Parse List Items'}
          </button>
        </form>

        {/* Parsed Items Preview */}
        {parsedData && (
          <div className="bg-gray-50 p-3 rounded-2xl border border-gray-200 space-y-2 text-xs">
            <div className="flex justify-between font-bold border-b pb-1">
              <span>Matched Items ({parsedData.matchedItems.length})</span>
              <span className="text-green-700">Total: ₹{parsedData.totalEstimate}</span>
            </div>

            {parsedData.matchedItems.map((item, idx) => (
              <div key={idx} className="flex justify-between text-gray-700">
                <span>{item.quantity}x {item.product.name}</span>
                <span className="font-bold">₹{item.lineTotal}</span>
              </div>
            ))}

            <button
              onClick={handleLoadToCart}
              className="w-full mt-2 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Add All Matched Items to Cart
            </button>
          </div>
        )}
      </div>
    </div>
  );
};