import { tool } from "@openai/agents";
import { tavily } from "@tavily/core";
import { z } from "zod";

const tavilyClient = tavily({});

export const webSearchTool = tool({
  name: "web_search",
  description:
    "Search the web for up-to-date information using Tavily. Returns a list of relevant results with URLs and initial content, their relevance score and the title of the page.",
  parameters: z.object({
    query: z.string().describe("The search query to look up on the web"),
  }),
  async execute({ query }) {
    const results = await tavilyClient.search(query, {
      max_results: 5,
    });
    return results;
  },
});

export const webFetchTool = tool({
  name: "web_fetch",
  description:
    "Fetch and extract the content of web pages as markdown given a list of URLs.",
  parameters: z.object({
    urls: z
      .array(z.string())
      .describe("A list of URLs to fetch and extract content from"),
  }),
  async execute({ urls }) {
    return await tavilyClient.extract(urls, {
      format: "markdown",
    });
  },
});
