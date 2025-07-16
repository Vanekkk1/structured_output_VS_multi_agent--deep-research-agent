import { tavily } from "@tavily/core";

const tavilyClient = tavily({});

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
  published_date?: string;
}

export interface FetchResult {
  url: string;
  content: string;
  status: "success" | "error";
  error?: string;
}

// Function to perform web search using Tavily
export async function performWebSearch(query: string): Promise<SearchResult[]> {
  try {
    const results = await tavilyClient.search(query, {
      max_results: 8,
    });

    return results.results.map((result: any) => ({
      title: result.title,
      url: result.url,
      content: result.content,
      score: result.score,
      published_date: result.published_date,
    }));
  } catch (error) {
    console.error(`Search failed for query "${query}":`, error);
    return [];
  }
}

// Function to fetch content from URLs using Tavily
export async function fetchWebContent(urls: string[]): Promise<FetchResult[]> {
  try {
    console.log("Fetching web content for URLs:", urls);

    const response = await tavilyClient.extract(urls, {
      format: "markdown",
    });

    // Handle the correct response structure - extract the results array
    const results = response.results || [];

    return results.map((result: any, index: number) => ({
      url: urls[index],
      content: result.rawContent || "",
      status: result.rawContent ? "success" : "error",
      error: result.rawContent ? undefined : "Failed to extract content",
    }));
  } catch (error) {
    console.error("Fetch failed:", error);
    return urls.map((url) => ({
      url,
      content: "",
      status: "error" as const,
      error: "Network or extraction error",
    }));
  }
}
