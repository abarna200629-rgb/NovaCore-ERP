import { API_BASE_URL } from "../config";
import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaBrain, FaPaperPlane, FaTimes, FaRobot, FaMicrophone, FaMicrophoneSlash } from "react-icons/fa";

function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Welcome to NovaCore AI Business Copilot.\n\nI can help you analyze your business using live ERP data.\n\nI now support Voice Commands! Try saying:\n• 'Show attendance'\n• 'Show revenue'\n• 'Open inventory'\n• 'Pending leave requests'\n• 'Generate report'\n• 'Navigate dashboard'\n\nYou can also ask general questions using text or voice dictation.",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    }
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const navigate = useNavigate();

  const API_URL = API_BASE_URL + "/api/ai/chat";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Setup Web Speech API for voice recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleVoiceCommand(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = (text) => {
    if (window.speechSynthesis) {
      // Cancel ongoing speech
      window.speechSynthesis.cancel();
      // Clean markdown tags
      const cleanText = text.replace(/[*#`_\-•]/g, "");
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceCommand = (transcript) => {
    const cmd = transcript.toLowerCase().trim().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
    
    // Check for matching navigation commands
    if (cmd.includes("show attendance") || cmd.includes("open attendance")) {
      navigate("/attendance");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to Attendance Logs dashboard.", time: timeNow }
      ]);
      speakText("Navigating to Attendance Logs dashboard.");
      return;
    }

    if (cmd.includes("show revenue") || cmd.includes("open revenue") || cmd.includes("show finance")) {
      navigate("/revenue");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to Revenue Ledger.", time: timeNow }
      ]);
      speakText("Navigating to Revenue Ledger.");
      return;
    }

    if (cmd.includes("open inventory") || cmd.includes("show inventory") || cmd.includes("open products") || cmd.includes("show products")) {
      navigate("/products");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to Inventory Product Catalog.", time: timeNow }
      ]);
      speakText("Navigating to Inventory Product Catalog.");
      return;
    }

    if (cmd.includes("pending leave") || cmd.includes("open leave") || cmd.includes("show leave")) {
      navigate("/leave");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to Leave Requests portal.", time: timeNow }
      ]);
      speakText("Navigating to Leave Requests portal.");
      return;
    }

    if (cmd.includes("generate report") || cmd.includes("open report") || cmd.includes("show report")) {
      navigate("/reports");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to AI Report Generator.", time: timeNow }
      ]);
      speakText("Navigating to AI Report Generator.");
      return;
    }

    if (cmd.includes("navigate dashboard") || cmd.includes("show dashboard") || cmd.includes("open dashboard")) {
      navigate("/dashboard");
      const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        { sender: "user", text: `Voice Command: "${transcript}"`, time: timeNow },
        { sender: "assistant", text: "Navigating to Main Dashboard.", time: timeNow }
      ]);
      speakText("Navigating to Main Dashboard.");
      return;
    }

    // Fallback to text query if no navigation command matches
    handleSendMessage(transcript, true);
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert("Web Speech API is not supported in this browser. Please use Google Chrome or Microsoft Edge.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendMessage = async (textToSend, wasVoice = false) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    // Add user message
    const timeNow = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setMessages(prev => [...prev, { sender: "user", text: wasVoice ? `Voice query: "${query}"` : query, time: timeNow }]);
    if (!textToSend) setInputText("");
    setLoading(true);

    try {
      const response = await axios.post(API_URL, { message: query }, getConfig());
      const replyTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const assistantReply = response.data.response;
      setMessages(prev => [...prev, { sender: "assistant", text: assistantReply, time: replyTime }]);
      
      if (wasVoice) {
        speakText(assistantReply);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      const errTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      setMessages(prev => [
        ...prev,
        {
          sender: "assistant",
          text: "I encountered an error retrieving data. Please check connection.",
          time: errTime
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { label: "Sales Summary", query: "sales summary" },
    { label: "Low Stock", query: "show low stock products" },
    { label: "Pending Invoices", query: "pending invoices" },
    { label: "Employee Count", query: "employee count" },
    { label: "Today's Orders", query: "today's orders" }
  ];

  return (
    <div className="ai-chatbot-widget">
      {/* Floating Toggle Button */}
      <button className="ai-chatbot-btn" onClick={() => setIsOpen(!isOpen)} title="AI Assistant">
        <FaBrain size={24} />
      </button>

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="ai-chatbot-panel">
          
          {/* Header */}
          <div className="ai-chatbot-header">
            <div className="d-flex align-items-center gap-2">
              <FaRobot size={20} />
              <span className="font-bold">ERP AI Business Assistant</span>
            </div>
            <button 
              className="btn btn-link text-white p-0" 
              onClick={() => setIsOpen(false)}
              style={{ textDecoration: "none" }}
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Quick Action Chips */}
          <div className="p-2 border-bottom d-flex gap-2 flex-wrap bg-light-soft" style={{ background: "rgba(0, 0, 0, 0.01)" }}>
            {quickActions.map((action, idx) => (
              <button 
                key={idx} 
                className="ai-quick-btn" 
                onClick={() => handleSendMessage(action.query)}
                disabled={loading}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Messages Body */}
          <div className="ai-chatbot-body">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`ai-msg ${msg.sender === "user" ? "ai-msg-user" : "ai-msg-assistant"}`}
              >
                <div style={{ wordBreak: "break-word", whiteSpace: "pre-line" }}>{msg.text}</div>
                {msg.time && (
                  <span className="ai-msg-time">
                    {msg.time}
                  </span>
                )}
              </div>
            ))}
            
            {loading && (
              <div className="ai-msg ai-msg-assistant d-flex align-items-center gap-2">
                <div className="spinner-border spinner-border-sm text-primary" role="status"></div>
                <span className="text-secondary small">Scanning Database...</span>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Footer */}
          <div className="ai-chatbot-footer d-flex gap-1 align-items-center">
            <button
              type="button"
              className={`btn d-flex align-items-center justify-content-center ${isListening ? "btn-danger animate-pulse" : "btn-outline-secondary"}`}
              onClick={toggleListening}
              style={{ borderRadius: "12px", width: "40px", height: "38px" }}
              title={isListening ? "Listening... Click to stop" : "Start Voice Input"}
            >
              {isListening ? <FaMicrophoneSlash size={14} /> : <FaMicrophone size={14} />}
            </button>

            <input 
              type="text" 
              className="form-control" 
              placeholder={isListening ? "Listening voice..." : "Ask me anything..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
              style={{ borderRadius: "12px" }}
            />
            
            <button 
              className="btn btn-primary d-flex align-items-center justify-content-center"
              onClick={() => handleSendMessage()}
              disabled={loading}
              style={{ borderRadius: "12px", width: "40px", height: "38px" }}
            >
              <FaPaperPlane size={14} />
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

export default AIAssistant;
