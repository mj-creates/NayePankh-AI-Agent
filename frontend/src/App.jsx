import { useState, useRef, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import "./App.css";

const BACKEND_URL = "http://127.0.0.1:8000";

// Helper function to safely parse and render basic markdown (bold, list items)
// and convert URLs, emails, and phone numbers into clickable links.
const renderTextWithLinksAndFormatting = (text) => {
  if (!text) return "";
  
  const lines = text.split("\n");
  let isInsideList = false;
  let listItems = [];
  const renderedElements = [];

  const parseLineContent = (lineText) => {
    const boldRegex = /\*\*(.*?)\*\*/g;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/g;
    const phoneRegex = /(\+91[- ]?\d{10}|\b\d{10}\b)/g;

    let tokens = [{ text: lineText, type: "text" }];

    const splitTokens = (typeToSplit, regex, newType, replacer) => {
      let newTokens = [];
      for (let token of tokens) {
        if (token.type !== typeToSplit) {
          newTokens.push(token);
          continue;
        }
        let lastIndex = 0;
        const matches = [...token.text.matchAll(regex)];
        for (let match of matches) {
          const index = match.index;
          const matchText = match[0];
          if (index > lastIndex) {
            newTokens.push({ text: token.text.substring(lastIndex, index), type: "text" });
          }
          newTokens.push({ text: replacer ? replacer(match) : matchText, type: newType });
          lastIndex = index + matchText.length;
        }
        if (lastIndex < token.text.length) {
          newTokens.push({ text: token.text.substring(lastIndex), type: "text" });
        }
      }
      tokens = newTokens;
    };

    // Apply token splits
    splitTokens("text", boldRegex, "bold", (match) => match[1]);
    splitTokens("text", urlRegex, "link", (match) => match[0]);
    splitTokens("text", emailRegex, "email", (match) => match[0]);
    splitTokens("text", phoneRegex, "phone", (match) => match[0]);

    return tokens.map((token, idx) => {
      if (token.type === "bold") {
        return <strong key={idx}>{token.text}</strong>;
      } else if (token.type === "link") {
        let url = token.text;
        let suffix = "";
        // Clean trailing punctuation
        if (/[.,!?;]$/.test(url)) {
          suffix = url.slice(-1);
          url = url.slice(0, -1);
        }
        return (
          <span key={idx}>
            <a href={url} target="_blank" rel="noreferrer" className="chat-link">
              {url}
            </a>
            {suffix}
          </span>
        );
      } else if (token.type === "email") {
        return (
          <a key={idx} href={`mailto:${token.text}`} className="chat-link">
            {token.text}
          </a>
        );
      } else if (token.type === "phone") {
        return (
          <a key={idx} href={`tel:${token.text}`} className="chat-link">
            {token.text}
          </a>
        );
      }
      return token.text;
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const isBullet = line.startsWith("* ") || line.startsWith("- ") || line.startsWith("• ");

    if (isBullet) {
      if (!isInsideList) {
        isInsideList = true;
        listItems = [];
      }
      const content = line.substring(2).trim();
      listItems.push(<li key={`li-${i}`}>{parseLineContent(content)}</li>);
    } else {
      if (isInsideList) {
        renderedElements.push(<ul key={`ul-${i}`}>{listItems}</ul>);
        isInsideList = false;
        listItems = [];
      }
      if (line) {
        renderedElements.push(<p key={`p-${i}`}>{parseLineContent(line)}</p>);
      }
    }
  }

  if (isInsideList) {
    renderedElements.push(<ul key="ul-final">{listItems}</ul>);
  }

  return renderedElements;
};

export default function App() {
  const [showIntro, setShowIntro] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [introText, setIntroText] = useState("");
  const fullIntroText = "Welcome to NayePankh. I'm Asha, your personal assistant today.";

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hello! 👋 I'm Asha, NayePankh Foundation's AI Assistant. NayePankh is a youth-led NGO working to uplift underprivileged communities across India through food, education, healthcare awareness, and more. How can I help you today? 😊",
    },
  ]);
  const [history, setHistory] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState(null);
  
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  // Intro Typing Effect
  useEffect(() => {
    if (!showIntro) return;
    
    let index = 0;
    const interval = setInterval(() => {
      setIntroText((prev) => prev + fullIntroText[index]);
      index++;
      if (index >= fullIntroText.length) {
        clearInterval(interval);
        
        // Auto transition to chat interface after 1.5 seconds
        const timeout = setTimeout(() => {
          setIsFadingOut(true);
          const finishTimeout = setTimeout(() => {
            setShowIntro(false);
          }, 800); // matches CSS animation duration
          return () => clearTimeout(finishTimeout);
        }, 1500);
        return () => clearTimeout(timeout);
      }
    }, 60);

    return () => clearInterval(interval);
  }, [showIntro]);

  // Auto-expanding input area
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSkipIntro = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setShowIntro(false);
    }, 300);
  };

  // Auto scroll to bottom on new message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message helper
  const sendImmediateMessage = async (msgText) => {
    if (!msgText.trim() || loading) return;

    const userMessage = msgText.trim();
    
    // Add user message to UI
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const response = await axios.post(`${BACKEND_URL}/chat`, {
        message: userMessage,
        history: history,
      });

      const { reply, history: updatedHistory } = response.data;

      // Add Asha's reply to UI
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      // Update memory
      setHistory(updatedHistory);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Please try again! 💙",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const currentInput = input;
    setInput("");
    await sendImmediateMessage(currentInput);
  };

  // Copy helper
  const handleCopy = (text, idx) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Clear Chat history and reset UI
  const clearChat = () => {
    setMessages([
      {
        role: "assistant",
        content:
          "Hello! 👋 I'm Asha, NayePankh Foundation's AI Assistant. NayePankh is a youth-led NGO working to uplift underprivileged communities across India through food, education, healthcare awareness, and more. How can I help you today? 😊",
      },
    ]);
    setHistory([]);
    setInput("");
  };

  // Send on Enter key
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">
      {showIntro && (
        <div className={`intro-overlay ${isFadingOut ? "fade-out" : ""}`}>
          <div className="intro-content">
            <div className="intro-logo-container">
              <img src={logo} alt="NayePankh Logo" className="intro-logo" />
            </div>
            <div className="intro-text-wrapper">
              <h2 className="intro-text">
                {introText}
                <span className="intro-cursor">|</span>
              </h2>
            </div>
            <button id="btn-skip-intro" className="skip-intro-btn" onClick={handleSkipIntro}>
              {introText.length >= fullIntroText.length ? "Get Started →" : "Skip Intro"}
            </button>
          </div>
        </div>
      )}

      {/* Left Sidebar */}
      <div className="sidebar" role="complementary">
        <div className="sidebar-brand">
          <div className="sidebar-logo-container">
            <img src={logo} alt="NayePankh Logo" className="sidebar-logo" />
          </div>
          <h2>NayePankh</h2>
          <span className="badge">GOVT. REG. NGO</span>
        </div>
        
        <p className="sidebar-desc">
          We are one of the biggest student-led organizations in India, working to uplift underprivileged communities.
        </p>

        <div className="sidebar-section">
          <h3>OUR IMPACT</h3>
          <ul className="stats-list">
            <li><strong>2,00,000+</strong> Lives Uplifted</li>
            <li><strong>80G & 12A</strong> Tax Exempted</li>
            <li><strong>Kanpur & Ghaziabad</strong> Operations</li>
          </ul>
        </div>

        <div className="sidebar-section">
          <h3>QUICK LINKS</h3>
          <a id="link-about" href="https://nayepankh.com/about-us" target="_blank" rel="noreferrer">About NayePankh</a>
          <a id="link-certificates" href="https://nayepankh.com/our-certificates" target="_blank" rel="noreferrer">Our Certificates</a>
          <a id="link-donate" href="https://nayepankh.com/donate" target="_blank" rel="noreferrer" className="donate-link">Donate Now →</a>
        </div>

        <div className="sidebar-section">
          <h3>GET IN TOUCH</h3>
          <p>📧 contact@nayepankh.com</p>
          <p>📞 +91-8318500748</p>
        </div>

        <div className="sidebar-footer">
          <p>© 2026 NayePankh Foundation</p>
        </div>
      </div>

      {/* Main Chat Panel */}
      <div className="chat-panel" role="main">
        {/* Header */}
        <div className="header">
          <div className="header-left">
            <div className="avatar">
              <img src={logo} alt="NayePankh Logo" />
            </div>
            <div>
              <h1>Asha</h1>
              <p>NayePankh Foundation Assistant</p>
            </div>
          </div>
          <div className="header-actions">
            <button id="btn-clear-chat" className="clear-chat-btn" onClick={clearChat} title="Clear conversation history">
              <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                <path d="M135.2 17.7C140.6 6.8 151.7 0 163.8 0H284.2c12.1 0 23.2 6.8 28.6 17.7L320 32h96c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 96 0 81.7 0 64S14.3 32 32 32h96l7.2-14.3zM32 128H416V448c0 35.3-28.7 64-64 64H96c-35.3 0-64-28.7-64-64V128zm96 64c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16zm96 0c-8.8 0-16 7.2-16 16V432c0 8.8 7.2 16 16 16s16-7.2 16-16V208c0-8.8-7.2-16-16-16z"/>
              </svg>
              Clear Chat
            </button>
            <a id="btn-visit-site" href="https://nayepankh.com" target="_blank" rel="noreferrer" className="visit-btn">
              Visit NayePankh →
            </a>
          </div>
        </div>

        {/* Chat window */}
        <div className="chat-window">
          {messages.map((msg, idx) => (
            <div key={idx} className={`message ${msg.role}`}>
              {msg.role === "assistant" && (
                <div className="msg-avatar">
                  <img src={logo} alt="Asha Avatar" />
                </div>
              )}
              <div className="bubble-container">
                <div className="bubble">
                  {renderTextWithLinksAndFormatting(msg.content)}
                </div>
                {msg.role === "assistant" && (
                  <button 
                    className="copy-msg-btn" 
                    onClick={() => handleCopy(msg.content, idx)}
                    title="Copy response"
                  >
                    {copiedIndex === idx ? (
                      <svg viewBox="0 0 448 512" className="copied-svg" xmlns="http://www.w3.org/2000/svg">
                        <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z"/>
                      </svg>
                    ) : (
                      <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg">
                        <path d="M208 0H332.1c12.7 0 24.9 5.1 33.9 14.1l67.9 67.9c9 9 14.1 21.2 14.1 33.9V336c0 26.5-21.5 48-48 48H208c-26.5 0-48-21.5-48-48V48c0-26.5 21.5-48 48-48zM48 128h80v64H48v256h192v-32h64v48c0 26.5-21.5 48-48 48H48c-26.5 0-48-21.5-48-48V176c0-26.5 21.5-48 48-48z"/>
                      </svg>
                    )}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Welcome Cards Grid (only shown before user starts the chat) */}
          {messages.length === 1 && (
            <div className="welcome-cards-grid">
              <div className="welcome-card" onClick={() => sendImmediateMessage("How to donate?")} role="button" tabIndex={0}>
                <div className="card-icon">🧡</div>
                <h3>Support Our Cause</h3>
                <p>Learn how to donate, make online contributions, and claim 50% 80G tax savings.</p>
                <span className="card-action">Donate →</span>
              </div>
              <div className="welcome-card" onClick={() => sendImmediateMessage("How to volunteer?")} role="button" tabIndex={0}>
                <div className="card-icon">💙</div>
                <h3>Join the Team</h3>
                <p>Discover volunteering roles, internship certificates, and how to get involved.</p>
                <span className="card-action">Volunteer →</span>
              </div>
              <div className="welcome-card" onClick={() => sendImmediateMessage("What does NayePankh do?")} role="button" tabIndex={0}>
                <div className="card-icon">🤍</div>
                <h3>Our Initiatives</h3>
                <p>Explore our food drives, sanitary napkin campaigns, and clothing events.</p>
                <span className="card-action">Learn More →</span>
              </div>
            </div>
          )}

          {/* Typing indicator */}
          {loading && (
            <div className="message assistant">
              <div className="msg-avatar">
                <img src={logo} alt="Asha Avatar" />
              </div>
              <div className="bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Chat footer area (suggestions + input) */}
        <div className="chat-footer">
          {/* Quick suggestions */}
          <div className="suggestions">
            {["How to volunteer?", "How to donate?", "What does NayePankh do?", "मुझे हिंदी में बताएं"].map(
              (suggestion, idx) => (
                <button
                  key={suggestion}
                  id={`suggestion-btn-${idx}`}
                  className="suggestion-btn"
                  onClick={() => sendImmediateMessage(suggestion)}
                  disabled={loading}
                >
                  {suggestion}
                </button>
              )
            )}
          </div>

          {/* Input area */}
          <div className="input-area">
            <div className="input-container">
              <textarea
                ref={textareaRef}
                id="input-chat"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask Asha anything about NayePankh... (English या हिंदी में)"
                rows={1}
                disabled={loading}
              />
              <button 
                id="btn-send"
                onClick={sendMessage} 
                disabled={loading || !input.trim()} 
                className="send-btn"
              >
                {loading ? "..." : "Send"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}