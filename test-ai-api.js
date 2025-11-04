// Simple test script to verify AI API endpoints work
const testChatAPI = async () => {
  try {
    console.log('Testing AI Chat API...')
    
    const response = await fetch('http://localhost:3000/api/ai/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Hello, can you help me with my tasks?',
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        conversationHistory: []
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Chat API Response:', data.response)
    console.log('📊 Context:', data.context)
    
    return true
  } catch (error) {
    console.error('❌ Chat API Error:', error.message)
    return false
  }
}

const testTaskSuggestionsAPI = async () => {
  try {
    console.log('\nTesting AI Task Suggestions API...')
    
    const response = await fetch('http://localhost:3000/api/ai/task-suggestions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input: 'HVAC unit not working at building A',
        userId: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID format
        userRole: 'technician',
        existingTasks: []
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    console.log('✅ Task Suggestions API Response:')
    data.suggestions.forEach((suggestion, index) => {
      console.log(`  ${index + 1}. ${suggestion.title} (${suggestion.priority})`)
      console.log(`     ${suggestion.description}`)
    })
    
    return true
  } catch (error) {
    console.error('❌ Task Suggestions API Error:', error.message)
    return false
  }
}

// Run tests
const runTests = async () => {
  console.log('🚀 Starting AI API Tests...\n')
  
  const chatResult = await testChatAPI()
  const taskResult = await testTaskSuggestionsAPI()
  
  console.log('\n📋 Test Results:')
  console.log(`Chat API: ${chatResult ? '✅ PASSED' : '❌ FAILED'}`)
  console.log(`Task Suggestions API: ${taskResult ? '✅ PASSED' : '❌ FAILED'}`)
  
  if (chatResult && taskResult) {
    console.log('\n🎉 All AI API tests passed! The fallback system is working correctly.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the error messages above.')
  }
}

// Wait a moment for the server to be ready, then run tests
setTimeout(runTests, 2000)