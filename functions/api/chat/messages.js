export async function onRequest(context) {
    const { request, env } = context;
    
    // Handle GET request - fetch messages
    if (request.method === 'GET') {
        try {
            const result = await env.DB.prepare(
                "SELECT id, username, content, created_at FROM messages ORDER BY created_at DESC LIMIT 1000"
            ).all();
            
            // Reverse to show oldest first
            const messages = result.results.reverse();
            
            return Response.json(messages);
        } catch (error) {
            console.error('Database error:', error);
            return Response.json({ error: 'Failed to load messages' }, { status: 500 });
        }
    }
    
    // Handle POST request - save new message
    if (request.method === 'POST') {
        try {
            const { username, content } = await request.json();
            
            // Validation
            if (!username?.trim() || !content?.trim()) {
                return Response.json({ error: 'Name and message are required' }, { status: 400 });
            }
            
            // Trim and limit lengths
            const cleanUsername = username.trim().slice(0, 30);
            const cleanContent = content.trim().slice(0, 500);
            
            // Insert into database
            await env.DB.prepare(
                "INSERT INTO messages (username, content) VALUES (?, ?)"
            ).bind(cleanUsername, cleanContent).run();
            
            return Response.json({ success: true });
        } catch (error) {
            console.error('Save error:', error);
            return Response.json({ error: 'Failed to save message' }, { status: 500 });
        }
    }
    
    // Method not allowed
    return Response.json({ error: 'Method not allowed' }, { status: 405 });
}