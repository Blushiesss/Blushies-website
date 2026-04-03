// Chat functionality for /projects/worldchat

async function loadMessages() {
    try {
        const response = await fetch('/api/chat/messages');
        
        if (!response.ok) {
            throw new Error('Failed to fetch');
        }
        
        const messages = await response.json();
        
        const container = document.getElementById('messages');
        if (messages.length === 0) {
            container.innerHTML = '<div class="status">No messages yet. Say something!</div>';
            return;
        }
        
        container.innerHTML = messages.map(msg => {
            const date = new Date(msg.created_at);
            const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' });
            return `
                <div class="message">
                    <div class="username">
                        ${escapeHtml(msg.username)}
                        <span class="timestamp">${timeStr}</span>
                    </div>
                    <div class="content">${escapeHtml(msg.content)}</div>
                </div>
            `;
        }).join('');
        
        //container.scrollTop = container.scrollHeight;
    } catch (error) {
        console.error('Load error:', error);
        document.getElementById('messages').innerHTML = '<div class="status">Failed to load messages</div>';
    }
}

async function sendMessage() {
    const username = document.getElementById('username').value.trim();
    const content = document.getElementById('message').value.trim();
    
    if (!username) {
        showStatus('Please enter your name', true);
        return;
    }
    if (!content) {
        showStatus('Please enter a message', true);
        return;
    }
    
    showStatus('Sending...');
    
    try {
        const response = await fetch('/api/chat/messages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, content })
        });
        
        if (response.ok) {
            document.getElementById('message').value = '';
            showStatus('Message sent!');
            loadMessages();
        } else {
            const error = await response.json();
            showStatus((error.error || 'Failed to send'), true);
        }
    } catch (error) {
        console.error('Send error:', error);
        showStatus('Network error', true);
    }
}

function showStatus(msg, isError = false) {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = msg;
    statusDiv.style.color = isError ? '#ef4444' : '#64748b';
    setTimeout(() => {
        if (statusDiv.textContent === msg) {
            statusDiv.textContent = 'Messages are live';
            statusDiv.style.color = '#64748b';
        }
    }, 2000);
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// Load messages when page loads
loadMessages();

// Only auto-scroll if user was already near the bottom
let wasAtBottom = true;

setInterval(async () => {
    const messagesDiv = document.getElementById('messages');
    // Check if user is within 100px of bottom
    wasAtBottom = (messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight) < 100;
    console.log('Auto-refreshing messages. User was at bottom:', wasAtBottom);
    console.log('Before refresh - scrollTop:', messagesDiv.scrollTop, 'scrollHeight:', messagesDiv.scrollHeight, 'clientHeight:', messagesDiv.clientHeight);
    console.log('Before refresh - distance from bottom:', messagesDiv.scrollHeight - messagesDiv.scrollTop - messagesDiv.clientHeight);
    
    await loadMessages();
    
    // Only auto-scroll if they were near bottom before refresh
    // no need to autoscoll at all
    // if (wasAtBottom) {
    //     messagesDiv.scrollTop = messagesDiv.scrollHeight;
    // }
}, 5000);