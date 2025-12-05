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

interface WorkConfig {
  file: string;
  title: string;
  year: string;
}

const works: WorkConfig[] = [
  { file: "Freud_Beyond_Pleasure_NEW.txt", title: "Beyond the Pleasure Principle", year: "1920" },
  { file: "Freud_Group_Psychology.txt", title: "Group Psychology and the Analysis of the Ego", year: "1921" },
  { file: "Freud_Inhibitions_Symptoms_Anxiety.txt", title: "Inhibitions, Symptoms and Anxiety", year: "1926" },
  { file: "Freud_Jokes.txt", title: "Jokes and Their Relation to the Unconscious", year: "1905" },
];

async function parsePositions(filePath: string): Promise<string[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const positions: string[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^(?:Position\s+)?(\d+)[:.]\s*(.+)$/i);
    if (match && match[2].length > 20) {
      positions.push(match[2]);
    }
  }
  
  return positions;
}

async function embedAll() {
  console.log("Starting batch Freud embedding...\n");
  
  let totalSuccess = 0;
  
  for (const work of works) {
    const filePath = path.join(__dirname, "../data/freud", work.file);
    
    if (!fs.existsSync(filePath)) {
      console.log(`File not found: ${work.file}`);
      continue;
    }
    
    const positions = await parsePositions(filePath);
    console.log(`${work.title}: ${positions.length} positions`);
    
    let successCount = 0;
    
    for (let i = 0; i < positions.length; i++) {
      try {
        const embedding = await getEmbedding(positions[i]);
        
        await db.insert(paperChunks).values({
          figureId: "freud",
          author: "Sigmund Freud",
          paperTitle: work.title,
          content: positions[i],
          embedding: embedding,
          chunkIndex: i,
          domain: "psychoanalysis",
          significance: "HIGH",
          sourceWork: `Freud - ${work.title} (${work.year})`
        });
        
        successCount++;
        await new Promise(resolve => setTimeout(resolve, 60));
      } catch (error: any) {
        if (!error.message?.includes("duplicate")) {
          console.error(`Error: ${error.message}`);
        }
      }
    }
    
    console.log(`  ✓ Embedded: ${successCount}\n`);
    totalSuccess += successCount;
  }
  
  console.log(`=== COMPLETE: ${totalSuccess} total positions embedded ===`);
}

embedAll().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
