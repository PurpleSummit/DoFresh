document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('send-btn').addEventListener('click', async () => {
        
        const userPrompt = document.querySelector('#user-input').value;
        const outputElement = document.querySelector('#output');
    
        outputElement.textContent = "Thinking...";
    
        try {
            const response = await fetch('http://localhost:5000/api/respond-chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userMessage : userPrompt })
            });
    
            const data = await response.json();
        
            outputElement.textContent = `${data.result}` || `${data.details}` || '<p>No response returned.';
        } catch (error) {
            outputElement.textContent = 'Error contacting the server.';
        }
    });
});
