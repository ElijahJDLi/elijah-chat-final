import React, { useState } from 'react';

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setLoading(true);
    setInput('');

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages([...newMessages, { role: 'assistant', content: 'Something went wrong.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-neutral-100 text-gray-800">
      <div className="w-full max-w-2xl">
        <h1 className="text-2xl font-semibold text-center mb-6">Hi, I'm Elijah 👋</h1>
        <div className="bg-white rounded-xl p-4 shadow-md h-[60vh] overflow-y-auto mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`mb-3 ${m.role === 'user' ? 'text-right' : 'text-left'}`}>
              <div className={`inline-block px-4 py-2 rounded-xl ${m.role === 'user' ? 'bg-blue-200' : 'bg-gray-200'}`}>{m.content}</div>
            </div>
          ))}
          {loading && <div className="text-left text-sm text-gray-500">Elijah is typing...</div>}
        </div>
        <textarea
          className="w-full p-3 border rounded-lg shadow-sm focus:outline-none resize-none"
          rows={2}
          placeholder="Ask me anything about my work, projects, or philosophy..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          onClick={sendMessage}
          className="mt-2 px-6 py-2 rounded-lg bg-black text-white font-medium hover:bg-gray-800"
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}