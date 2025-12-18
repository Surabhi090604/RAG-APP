import { defineConfig } from "mastra";

export default defineConfig({
  name: "rag-app",
  rag: {
    documents: [],
    retriever: {
      topK: 5,
    },
  },
});
