const pool = require('./dist/config/database.js').default;
const { ProposalService } = require('./dist/services/proposal.js');

async function debugProposalGeneration() {
  console.log('🔍 Debugging proposal generation process...');
  
  try {
    // Create test users and outcomes
    const user1Result = await pool.query(`
      INSERT INTO users (email, password_hash) 
      VALUES ('debug1@example.com', 'hashedpassword1') 
      RETURNING id
    `);
    const user1Id = user1Result.rows[0].id;

    const user2Result = await pool.query(`
      INSERT INTO users (email, password_hash) 
      VALUES ('debug2@example.com', 'hashedpassword2') 
      RETURNING id
    `);
    const user2Id = user2Result.rows[0].id;

    // Create very similar outcomes
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where every child has access to quality education', 5)
    `, [user1Id]);
    
    await pool.query(`
      INSERT INTO outcomes (user_id, statement, importance) VALUES
      ($1, 'I want a world where all children can get excellent education', 4)
    `, [user2Id]);

    console.log('✅ Test data created');

    // Get all outcomes to verify
    const allOutcomes = await pool.query('SELECT * FROM outcomes ORDER BY created_at');
    console.log('📊 All outcomes in database:');
    allOutcomes.rows.forEach((outcome, index) => {
      console.log(`  ${index + 1}. User ${outcome.user_id}: "${outcome.statement}" (importance: ${outcome.importance})`);
    });

    // Test the proposal service with very low similarity threshold
    const proposalService = new ProposalService(pool);
    
    console.log('\n🤖 Testing proposal generation with low similarity threshold...');
    const proposals = await proposalService.generateProposals({
      minSimilarityScore: 0.1, // Very low threshold
      maxUsers: 10
    });

    console.log(`📋 Generated ${proposals.length} proposals`);
    
    if (proposals.length > 0) {
      proposals.forEach((proposal, index) => {
        console.log(`\n--- Proposal ${index + 1} ---`);
        console.log(`Title: ${proposal.title}`);
        console.log(`Description: ${proposal.description.substring(0, 300)}...`);
        console.log(`Contributing Users: ${proposal.contributingUsers.length}`);
        console.log(`Shared Themes: ${proposal.similarityAnalysis.sharedThemes?.join(', ') || 'None'}`);
        console.log(`Similarity Score: ${proposal.similarityAnalysis.overallSimilarityScore?.toFixed(2) || 'N/A'}`);
      });
    } else {
      console.log('❌ No proposals generated. Let me check what might be wrong...');
      
      // Let's manually test the similarity analysis
      console.log('\n🔬 Testing similarity analysis manually...');
      
      // We need to access the private method, so let's create a simple test
      const outcome1 = allOutcomes.rows[0];
      const outcome2 = allOutcomes.rows[1];
      
      console.log(`Comparing outcomes:`);
      console.log(`  1: "${outcome1.statement}"`);
      console.log(`  2: "${outcome2.statement}"`);
      
      // Since analyzeSimilarity is private, let's test the AI service directly
      const { AIService } = require('./dist/services/ai.js');
      
      const analysisPrompt = {
        role: 'system',
        content: `Analyze the semantic similarity between these two desired outcomes. 

Return a JSON object with:
{
  "similarityScore": 0.0-1.0 (how similar the underlying desires are),
  "sharedThemes": ["theme1", "theme2"] (common themes/values)
}

Guidelines:
- Focus on underlying values and desired end states, not specific wording
- Score 0.8+ for very similar desires (same core goal)
- Score 0.6-0.8 for related desires (complementary goals)
- Score 0.4-0.6 for somewhat related (shared themes but different focus)
- Score below 0.4 for unrelated desires
- Identify 2-4 shared themes when similarity > 0.6

Example themes: "equality", "education", "environment", "health", "safety", "freedom", "community", "innovation"`
      };

      const userMessage = {
        role: 'user',
        content: `Outcome 1: "${outcome1.statement}"
Outcome 2: "${outcome2.statement}"`
      };

      const response = await AIService.chat([analysisPrompt, userMessage]);
      console.log('🤖 AI Similarity Analysis Response:', response.message);
      
      try {
        const analysis = JSON.parse(response.message);
        console.log('📊 Parsed Analysis:', analysis);
      } catch (parseError) {
        console.log('❌ Failed to parse AI response as JSON');
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    // Clean up
    await pool.query('DELETE FROM proposal_users');
    await pool.query('DELETE FROM proposals');
    await pool.query('DELETE FROM outcomes');
    await pool.query('DELETE FROM users WHERE email LIKE \'debug%@example.com\'');
    console.log('\n🧹 Test data cleaned up');
    pool.end();
  }
}

debugProposalGeneration();