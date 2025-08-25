import { MongoClient } from "mongodb";
import { getEmbedding } from "./embedData.js";
import { Embeddings } from "@langchain/core/embeddings"
import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import dotenv from 'dotenv'

dotenv.config()

export class CustomEmbeddings extends Embeddings {
    constructor() {
        super({})
    }
    async embedQuery( text : string ): Promise<number[]> {
        const embeddedText = await getEmbedding(text);
        return embeddedText.embedding;
    }

    async embedDocuments(texts: string[]): Promise<number[][]> {
        const promises = texts.map(async text => {
            const result = await getEmbedding(text);
            return result.embedding;
        });
        return await Promise.all(promises);
    }
}

let mongoClient: MongoClient | null = null

export async function createVectorStore(sessionId: string): Promise<MongoDBAtlasVectorSearch> {
    if(!mongoClient){
        mongoClient = new MongoClient(process.env.MONGODB_URI!);
        await mongoClient.connect()
    }

    const db = mongoClient.db("ChatBotData");
    const collection = db.collection(sessionId);

    const embeddings = new CustomEmbeddings();

    return new MongoDBAtlasVectorSearch(embeddings, {
        collection: collection,
        indexName: "vector_index",
        textKey: "pageContent",
        embeddingKey: "embedding",
    })

}

export async function storeWikipediaSections(
  vectorStore: MongoDBAtlasVectorSearch, 
  sections: any[], 
  sessionId: string
) {
  const validSections = sections.filter(section => 
    section.headingContent && section.headingContent.trim().length > 0
  );
  
  const documents = validSections.map(section => ({
    pageContent: section.headingContent.trim(), 
    metadata: {
      heading: section.heading,
      sessionId: sessionId
    }
  }));

  await vectorStore.addDocuments(documents);
}

export async function queryVectorStore(
  vectorStore: MongoDBAtlasVectorSearch, 
  question: string, 
  numResults: number = 3
) {
  console.log(`🔍 Searching for: "${question}"`);
  
  const results = await vectorStore.similaritySearch(question, numResults);
  
  console.log(`📋 Found ${results.length} relevant sections:`);
  
  results.forEach((result, index) => {
    console.log(`\n--- Result ${index + 1} ---`);
    console.log(`Heading: ${result.metadata.heading}`);
    console.log(`Content: ${result.pageContent.substring(0, 200)}...`);
  });
  
  return results;
}

export async function closeConnection() {
    if (mongoClient) {
        await mongoClient.close();
        mongoClient = null;
    }
}