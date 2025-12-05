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
  { file: "Freud_Cocaine_Papers.txt", title: "Über Coca (Cocaine Papers)", year: "1884" },
  { file: "Freud_Project_Scientific_Psychology.txt", title: "Project for a Scientific Psychology", year: "1895" },
  { file: "Freud_Dora.txt", title: "Fragment of an Analysis of a Case of Hysteria (Dora)", year: "1905" },
  { file: "Freud_Future_Illusion.txt", title: "The Future of an Illusion", year: "1927" },
  { file: "Freud_Moses_Monotheism.txt", title: "Moses and Monotheism", year: "1939" },
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
  console.log("Starting Freud batch 2 embedding...\n");
  
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
        if (successCount % 20 === 0) console.log(`  Progress: ${successCount}/${positions.length}`);
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
