const { AIService } = require('./dist/services/ai.js');

async function testAIService() {
  console.log('Testing AI Service...');
  
  try {
    // Test basic chat functionality
    const chatResponse = await AIService.chat([
      { role: 'user', content: 'Hello, can you respond with just "AI service working"?' }
    ]);
    
    console.log('✅ AI Chat Response:', chatResponse.message);
    
    // Test similarity analysis with a simple example
    const outcome1 = {
      statement: 'I want a world where every child has access to quality education'
    };
    
    const outcome2 = {
      statement: 'I want a world where all children can get good schooling'
    };
    
    // Test outcome extraction
    const conversationText = "I really want to see a world where everyone has access to clean water. It's so important for health and dignity.";
    const aiService = new AIService();
    const extractedOutcomes = await aiService.extractOutcomes(conversationText);
    console.log('✅ Extracted Outcomes:', extractedOutcomes);
    
  } catch (error) {
    console.error('❌ AI Service test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testAIService();