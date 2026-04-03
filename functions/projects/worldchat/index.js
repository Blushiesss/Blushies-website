export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  
  // API: Get messages
  if (url.pathname === "/projects/worldchat/api/messages" && request.method === "GET") {
    const result = await env.DB.prepare(
      "SELECT id, username, content, created_at FROM messages ORDER BY created_at DESC LIMIT 1000"
    ).all();
    
    const messages = result.results.reverse();
    return Response.json(messages);
  }
  
  // API: Post message
  if (url.pathname === "/projects/worldchat/api/messages" && request.method === "POST") {
    try {
      const { username, content } = await request.json();
      
      if (!username?.trim() || !content?.trim()) {
        return Response.json({ error: "Name and message required" }, { status: 400 });
      }
      
      await env.DB.prepare(
        "INSERT INTO messages (username, content) VALUES (?, ?)"
      ).bind(username.slice(0, 30), content.slice(0, 500)).run();
      
      return Response.json({ success: true });
    } catch (error) {
      return Response.json({ error: "Failed to save" }, { status: 500 });
    }
  }
  
  // Serve the HTML page
  return new Response(getHTML(), {
    headers: { "Content-Type": "text/html" }
  });
}

function getHTML() {
  return `<!DOCTYPE html>
<html>
<head>
    <title>World Chat</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: system-ui, -apple-system, sans-serif;
            background: #1a1a2e;
            min-height: 100vh;
            padding: 20px;
        }
        .chat-container {
            max-width: 800px;
            margin: 0 auto;
            background: #16213e;
            border-radius: 20px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        .chat-header {
            background: #0f3460;
            color: white;
            padding: 20px;
            text-align: center;
        }
        .chat-header h1 { font-size: 1.8rem; }
        .chat-header p { font-size: 0.8rem; opacity: 0.8; margin-top: 5px; }
        .messages {
            height: 500px;
            overflow-y: auto;
            padding: 20px;
            background: #0f172a;
        }
        .message {
            margin-bottom: 15px;
            background: #1e293b;
            padding: 10px 15px;
            border-radius: 12px;
        }
        .username {
            font-weight: bold;
            color: #60a5fa;
            font-size: 0.9rem;
        }
        .timestamp {
            font-size: 0.7rem;
            color: #64748b;
            margin-left: 10px;
        }
        .content {
            color: #e2e8f0;
            margin-top: 5px;
            word-wrap: break-word;
        }
        .input-area {
            padding: 20px;
            background: #1e293b;
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
        }
        input, button {
            padding: 10px 15px;
            border: none;
            border-radius: 8px;
            font-size: 1rem;
        }
        #username {
            flex: 1;
            min-width: 120px;
            background: #0f172a;
            color: white;
            border: 1px solid #334155;
        }
        #message {
            flex: 3;
            min-width: 200px;
            background: #0f172a;
            color: white;
            border: 1px solid #334155;
        }
        button {
            background: #3b82f6;
            color: white;
            cursor: pointer;
            transition: background 0.2s;
        }
        button:hover {
            background: #2563eb;
        }
        .status {
            text-align: center;
            padding: 10px;
            font-size: 0.8rem;
            color: #64748b;
            background: #0f172a;
        }
        ::placeholder {
            color: #475569;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h1>💬 World Chat</h1>
            <p>Messages never clear (last 1000 shown)</p>
        </div>
        <div class="messages" id="messages">
            <div class="status">Loading messages...</div>
        </div>
        <div class="input-area">
            <input type="text" id="username" placeholder="Your name" maxlength="30">
            <input type="text" id="message" placeholder="Type a message..." maxlength="500" onkeypress="if(event.key==='Enter') sendMessage()">
            <button onclick="sendMessage()">Send</button>
        </div>
        <div class="status" id="status">💾 Messages saved in Cloudflare D1</div>
    </div>

    <script>
        async function loadMessages() {
            try {
                const response = await fetch('/projects/worldchat/api/messages');
                const messages = await response.json();
                
                const container = document.getElementById('messages');
                if (messages.length === 0) {
                    container.innerHTML = '<div class="status">No messages yet. Say something!</div>';
                    return;
                }
                
                container.innerHTML = messages.map(msg => {
                    const date = new Date(msg.created_at);
                    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
                    return \`
                        <div class="message">
                            <div class="username">
                                \${escapeHtml(msg.username)}
                                <span class="timestamp">\${timeStr}</span>
                            </div>
                            <div class="content">\${escapeHtml(msg.content)}</div>
                        </div>
                    \`;
                }).join('');
                
                container.scrollTop = container.scrollHeight;
            } catch (error) {
                document.getElementById('messages').innerHTML = '<div class="status">❌ Failed to load messages</div>';
            }
        }
        
        async function sendMessage() {
            const username = document.getElementById('username').value.trim();
            const content = document.getElementById('message').value.trim();
            
            if (!username) {
                showStatus('❌ Please enter your name', true);
                return;
            }
            if (!content) {
                showStatus('❌ Please enter a message', true);
                return;
            }
            
            showStatus('📤 Sending...');
            
            try {
                const response = await fetch('/projects/worldchat/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, content })
                });
                
                if (response.ok) {
                    document.getElementById('message').value = '';
                    showStatus('✅ Message sent!');
                    loadMessages();
                } else {
                    const error = await response.json();
                    showStatus('❌ ' + (error.error || 'Failed to send'), true);
                }
            } catch (error) {
                showStatus('❌ Network error', true);
            }
        }
        
        function showStatus(msg, isError = false) {
            const statusDiv = document.getElementById('status');
            statusDiv.textContent = msg;
            statusDiv.style.color = isError ? '#ef4444' : '#64748b';
            setTimeout(() => {
                if (statusDiv.textContent === msg) {
                    statusDiv.textContent = '💾 Messages saved in Cloudflare D1';
                    statusDiv.style.color = '#64748b';
                }
            }, 2000);
        }
        
        function escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }
        
        loadMessages();
        setInterval(loadMessages, 5000);
    </script>
</body>
</html>`;
}