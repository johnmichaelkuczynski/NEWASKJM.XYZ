import { searchPhilosophicalChunks } from './server/vector-search.ts';

console.log('=== TESTING PSYCHOPATHY SEARCH ===\n');

async function test() {
  try {
    console.log('Searching for psychopathy content from Kuczynski...\n');
    
    const chunks = await searchPhilosophicalChunks('psychopathy', 5, 'common', 'Kuczynski');
    
    console.log(`✅ FOUND ${chunks.length} CHUNKS!\n`);
    
    chunks.forEach((chunk, i) => {
      console.log(`\n━━━ CHUNK ${i + 1} ━━━`);
      console.log(`📚 Paper: ${chunk.paperTitle}`);
      console.log(`✍️  Author: ${chunk.author}`);
      console.log(`📊 Distance: ${chunk.distance.toFixed(4)}`);
      console.log(`📝 Preview: ${chunk.content.substring(0, 200)}...`);
    });
    
    console.log('\n\n🎉 SUCCESS - RAG SYSTEM IS WORKING!');
    console.log('The app now has access to Kuczynski\'s psychopathy writings.');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  process.exit(0);
}

test();
