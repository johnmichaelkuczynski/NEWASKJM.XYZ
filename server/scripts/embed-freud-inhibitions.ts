import OpenAI from "openai";
import { db } from "../db";
import { paperChunks } from "@shared/schema";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function getEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-ada-002",
    input: text,
  });
  return response.data[0].embedding;
}

async function embedInhibitions() {
  console.log("Embedding Inhibitions, Symptoms and Anxiety...");
  
  const filePath = path.join(__dirname, "../data/freud/Freud_Inhibitions_Symptoms_Anxiety.txt");
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  
  const positions: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length > 40 && !trimmed.startsWith("POSITION") && !trimmed.startsWith("===")) {
      positions.push(trimmed);
    }
  }
  
  console.log(`Parsed ${positions.length} positions`);
  
  let successCount = 0;
  
  for (let i = 0; i < positions.length; i++) {
    try {
      const embedding = await getEmbedding(positions[i]);
      
      await db.insert(paperChunks).values({
        figureId: "freud",
        author: "Sigmund Freud",
        paperTitle: "Inhibitions, Symptoms and Anxiety",
        content: positions[i],
        embedding: embedding,
        chunkIndex: i,
        domain: "psychoanalysis",
        significance: "HIGH",
        sourceWork: "Freud - Inhibitions, Symptoms and Anxiety (1926)"
      });
      
      successCount++;
      if (successCount % 10 === 0) console.log(`Progress: ${successCount}/${positions.length}`);
      await new Promise(resolve => setTimeout(resolve, 60));
    } catch (error: any) {
      if (!error.message?.includes("duplicate")) {
        console.error(`Error: ${error.message}`);
      }
    }
  }
  
  console.log(`\n=== COMPLETE: ${successCount} positions embedded ===`);
}

embedInhibitions().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
