// Test just the chat API
const testChatAPI = async () => {
  try {
    console.log('Testing AI Chat API...')
    
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello',
        userId: 'test-user-id'
      }),
    })

    console.log('Response status:', response.status)
    console.log('Response headers:', Object.fromEntries(response.headers.entries()))
    
    const text = await response.text()
    console.log('Response body:', text)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = JSON.parse(text)
    console.log('✅ Chat API Response:', data.response)
    
    return true
  } catch (error) {
    console.error('❌ Chat API Error:', error.message)
    return false
  }
}

setTimeout(testChatAPI, 1000)