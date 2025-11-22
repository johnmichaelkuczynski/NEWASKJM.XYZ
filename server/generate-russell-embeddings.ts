import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { db } from "./db";
import { paperChunks } from "@shared/schema";
import OpenAI from "openai";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateRussellEmbeddings() {
  console.log('Starting Bertrand Russell embedding generation...');

  const filePath = join(__dirname, '../attached_assets/Pasted-The-Project-Gutenberg-eBook-of-The-Analysis-of-Mind-This-ebook-is-for-the-use-of-anyone-anywh-1762994514014_1762994514026.txt');
  const content = readFileSync(filePath, 'utf-8');

  // Clean up Project Gutenberg metadata
  const startMarker = 'THE ANALYSIS OF MIND';
  const endMarker = '*** END OF THE PROJECT GUTENBERG EBOOK';
  
  let cleanedContent = content;
  const startIndex = content.indexOf(startMarker);
  if (startIndex !== -1) {
    cleanedContent = content.substring(startIndex);
  }
  
  const endIndex = cleanedContent.indexOf(endMarker);
  if (endIndex !== -1) {
    cleanedContent = cleanedContent.substring(0, endIndex);
  }

  // Split into chunks of approximately 250 words
  const words = cleanedContent.split(/\s+/);
  const chunks: string[] = [];
  const chunkSize = 250;

  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 50) { // Only include substantial chunks
      chunks.push(chunk.trim());
    }
  }

  console.log(`Created ${chunks.length} chunks from The Analysis of Mind`);

  // Process in batches of 16
  const batchSize = 16;
  let processedCount = 0;

  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    
    try {
      // Generate embeddings for the batch
      const embeddingResponse = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: batch,
      });

      // Store each chunk with its embedding
      for (let j = 0; j < batch.length; j++) {
        const embedding = embeddingResponse.data[j].embedding;
        
        await db.insert(paperChunks).values({
          figureId: 'common',
          content: batch[j],
          embedding: embedding as any,
          author: 'Bertrand Russell',
          paperTitle: 'The Analysis of Mind',
          chunkIndex: i + j,
        });

        processedCount++;
      }

      console.log(`Processed ${processedCount}/${chunks.length} chunks`);
      
      // Small delay to respect rate limits
      if (i + batchSize < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`Error processing batch ${i / batchSize + 1}:`, error);
      throw error;
    }
  }

  console.log(`✓ Successfully generated embeddings for ${processedCount} chunks from Bertrand Russell's "The Analysis of Mind"`);
}

generateRussellEmbeddings()
  .then(() => {
    console.log('Bertrand Russell embedding generation complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error generating Russell embeddings:', error);
    process.exit(1);
  });
