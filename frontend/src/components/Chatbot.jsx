import React, { useState, useEffect, useRef } from 'react';
import logo from '../assets/logo.png';
import '../styles/chatbot.css';

function Chatbot() {
  // === Together API via Hugging Face router ===
  const HF_TOKEN = import.meta.env.VITE_HF_TOKEN; // YourAPI key
  const PROVIDER = 'together';
  const MODEL_ID = 'mistralai/Mistral-7B-Instruct-v0.3';
  const API_URL = `https://router.huggingface.co/${PROVIDER}/v1/chat/completions`;
  const MAX_HISTORY = 10;

  const chatWindowRef = useRef(null);

  // Chat history in OpenAI format
  const [messages, setMessages] = useState([
    { role: 'system', content: 'You are a helpful assistant.' },
    { role: 'assistant', content: 'مرحباً! كيف يمكنني مساعدتك اليوم؟' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle sending a message
  const handleSend = async () => {
    if (input.trim() === '' || loading) return;
    setLoading(true);
    setError(null);
    const userMessage = { role: 'user', content: input.trim() };
    const history = [messages[0], ...messages.slice(-MAX_HISTORY + 1), userMessage];
    setMessages([...history]);
    setInput('');
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL_ID,
          messages: history,
          temperature: 0.7,
          max_tokens: 256,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        setError(`عذراً، حدث خطأ من Together API:\n${errorText}`);
        setMessages(prev => [
          ...prev,
          { role: 'assistant', content: `عذراً، حدث خطأ من Together API:\n${errorText}` },
        ]);
        return;
      }
      const data = await response.json();
      const reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content
        ? data.choices[0].message.content
        : 'عذراً، لم أتمكن من الحصول على رد.';
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: reply },
      ]);
    } catch (_err) {
      setError('عذراً، حدث خطأ أثناء الاتصال بمساعد Together API.');
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'عذراً، حدث خطأ أثناء الاتصال بمساعد Together API.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Auto-scroll to the bottom of the chat window when messages change
  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Function to check if text contains Arabic characters
  const isArabic = (text) => /\p{Script=Arabic}/u.test(text);

  return (
    <div className="chatbot">
      <div className="chatbot-header">Chat</div>
      <div className="chat-window" ref={chatWindowRef}>
        {messages.map((msg, index) => {
          if (msg.role === 'system') return null; // Don't render system messages
          const isUser = msg.role === 'user';
          const hasArabic = isArabic(msg.content);
          const messageContent = (
            <div
              className={`chat-message ${hasArabic ? 'rtl' : 'ltr'} ${isUser ? 'align-right' : 'align-left'}`}
              dir={hasArabic ? 'rtl' : 'ltr'}
            >
              {msg.content}
            </div>
          );

          const avatar = isUser
            ? <div className="avatar">U</div>
            : <img className="avatar avatar-img" src={logo} alt="Bot" />;

          return (
            <div
              key={index}
              className={`chat-message-wrapper ${isUser ? 'user' : 'bot'}`}
            >
              {messageContent}
              {avatar}
            </div>
          );
        })}
        {loading && (
          <div className="chat-message-wrapper bot bot-thinking">
            <img className="avatar avatar-img" src={logo} alt="Bot" />
            <div className="chat-message thinking-bubble">...يفكر</div>
          </div>
        )}
        {error && (
          <div className="chat-message-wrapper bot">
            <img className="avatar avatar-img" src={logo} alt="Bot" />
            <div className="chat-message error-bubble">{String(error)}</div>
          </div>
        )}
      </div>
      <div className="chat-input">
        <button className="add-btn">+</button>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="اكتب رسالتك هنا..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading}>
          إرسال
        </button>
      </div>
    </div>
  );
}

export default Chatbot;