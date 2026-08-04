document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', async () => {
        
        const userPrompt = document.querySelector('#user-input').value;
        const outputElement = document.querySelector('#output');
    
        outputElement.innerHTML = "<p>Thinking...</p>";
    
        try {
            const response = await fetch('http://localhost:5000/api/respond-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage : userPrompt })
            });
    
            const data = await response.json();
        
            outputElement.innerHTML = `<pre>${data.result}</pre>` || `<pre>${data.details}</pre>` || '<p>No response returned.</p>';
        } catch (error) {
            outputElement.innerHTML = '<p>Error contacting the server.</p>';
        }
    });
});
