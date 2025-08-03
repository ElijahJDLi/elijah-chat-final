export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { messages } = req.body;
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ reply: 'Missing OpenAI API key' });
  }

  try {
    // Create a new thread
    const threadRes = await fetch('https://api.openai.com/v1/threads', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({ messages })
    });
    const threadData = await threadRes.json();
    const threadId = threadData.id;

    // Start a run using the assistant
    const runRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
        'OpenAI-Beta': 'assistants=v2'
      },
      body: JSON.stringify({
        assistant_id: 'asst_u6oAZEJ8BEZtVj5IYCrkfbpT',
        tool_choice: "auto"
      })
    });

    const runData = await runRes.json();
    const runId = runData.id;

    // Poll run status until completed or timeout after 45s
    const start = Date.now();
    let status = runData.status;

    while (status !== 'completed' && status !== 'failed' && Date.now() - start < 45000) {
      await new Promise(r => setTimeout(r, 1000));
      const checkRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'OpenAI-Beta': 'assistants=v2'
        }
      });
      const checkData = await checkRes.json();
      status = checkData.status;
    }

    if (status !== 'completed') {
      return res.status(500).json({ reply: 'The assistant did not respond in time.' });
    }

    // Retrieve assistant's message
    const msgRes = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'OpenAI-Beta': 'assistants=v2'
      }
    });

    const msgData = await msgRes.json();
    const lastMessage = msgData.data.find(m => m.role === 'assistant');
    const reply = lastMessage?.content?.[0]?.text?.value || 'No response available.';

    res.status(200).json({ reply });

  } catch (err) {
    const errorBody = await err.response?.text?.() || '';
    let errorMessage = err.message;
try {
  const text = await err?.response?.text?.();
  if (text) {
    console.error('OpenAI Error Body:', text);
    errorMessage += ' | ' + text;
  }
} catch (e) {
  console.error('Failed to parse error body');
}

console.error('Final Error:', errorMessage);
res.status(500).json({ reply: 'Server error: ' + errorMessage });

  }
}
