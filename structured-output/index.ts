import { run, withTrace } from "@openai/agents";
import "dotenv/config";
import readline from "node:readline/promises";
import type { z } from "zod";
import {
  clarificationAgent,
  fetchDecisionAgent,
  researchSynthesizerAgent,
  searchPlannerAgent,
} from "./agents.ts";
import type {
  ClarificationDecisionSchema,
  FetchDecisionSchema,
  ResearchSynthesisSchema,
  SearchPlanSchema,
} from "./schemas.ts";
import { fetchWebContent, performWebSearch } from "./tools.ts";
import { checkAPIKeys, log, saveMarkdownReport } from "./utils.ts";

async function runStructuredResearch(
  originalQuery: string,
  rl: readline.Interface
): Promise<void> {
  return await withTrace("Research Process - Structured Output", async () => {
    try {
      log.section("STRUCTURED OUTPUT RESEARCH SYSTEM");
      log.info(`Starting research for: "${originalQuery}"`);
      log.divider();

      let finalQuery = originalQuery;

      // Step 1: Check if clarification is needed
      log.section("STEP 1: CLARIFICATION CHECK");
      log.info("🤔 Analyzing query to determine if clarification is needed...");

      const clarificationResult = await run(clarificationAgent, originalQuery);
      const clarificationDecision = clarificationResult.finalOutput as z.infer<
        typeof ClarificationDecisionSchema
      >;

      log.system(`Reasoning: ${clarificationDecision.reasoning}`);

      if (
        clarificationDecision.needs_clarification &&
        clarificationDecision.clarification_questions
      ) {
        log.info("❓ Clarification needed. Asking follow-up questions...");
        log.divider();

        console.log(
          log.agent("I need some clarification to provide better research:")
        );
        console.log();

        clarificationDecision.clarification_questions.forEach(
          (question, index) => {
            console.log(`${index + 1}. ${question}`);
          }
        );
        console.log();

        const clarificationResponse = await rl.question(
          "Please provide clarification (or press Enter to continue with original query): "
        );

        if (clarificationResponse.trim()) {
          finalQuery = `${originalQuery}\n\nAdditional context: ${clarificationResponse.trim()}`;
          log.success(
            "Clarification received! Proceeding with enhanced query."
          );
        } else {
          log.info(
            "No clarification provided. Proceeding with original query."
          );
        }
      } else {
        log.success("No clarification needed. Query is sufficiently clear.");
      }

      log.divider();

      // Step 2: Generate search plan
      log.section("STEP 2: SEARCH PLANNING");
      log.info("🧠 Analyzing query and creating search plan...");

      const searchPlanResult = await run(searchPlannerAgent, finalQuery);
      const searchPlan = searchPlanResult.finalOutput as z.infer<
        typeof SearchPlanSchema
      >;

      log.success(
        `Search plan created with ${searchPlan.search_queries.length} queries:`
      );
      searchPlan.search_queries.forEach((q, i) => log.info(`  ${i + 1}. ${q}`));
      log.system(`Reasoning: ${searchPlan.reasoning}`);
      log.divider();

      // Step 3: Execute search queries
      log.section("STEP 3: WEB SEARCH EXECUTION");
      log.info("🔍 Executing search queries in parallel...");

      const searchPromises = searchPlan.search_queries.map(
        async (query, index) => {
          log.system(`Searching: ${query}`);
          const results = await performWebSearch(query);
          log.info(`Query ${index + 1} returned ${results.length} results`);
          return results;
        }
      );

      const allSearchResults = await Promise.all(searchPromises);
      const flatSearchResults = allSearchResults.flat();

      log.success(
        `Total search results collected: ${flatSearchResults.length}`
      );
      log.divider();

      // Step 4: Decide which links to fetch
      log.section("STEP 4: CONTENT SELECTION");
      log.info("🎯 Analyzing search results and selecting content to fetch...");

      const searchResultsForAgent = JSON.stringify(
        flatSearchResults.map((r) => ({
          title: r.title,
          url: r.url,
          content: r.content,
          score: r.score,
          published_date: r.published_date,
        })),
        null,
        2
      );

      const fetchDecisionResult = await run(
        fetchDecisionAgent,
        `Analyze these search results and select the best URLs to fetch:\n\n${searchResultsForAgent}`
      );
      const fetchDecision = fetchDecisionResult.finalOutput as z.infer<
        typeof FetchDecisionSchema
      >;

      log.success(
        `Selected ${fetchDecision.selected_urls.length} URLs for content fetching:`
      );
      fetchDecision.selected_urls.forEach((url, i) =>
        log.info(`  ${i + 1}. ${url}`)
      );
      log.system(`Selection reasoning: ${fetchDecision.reasoning}`);
      log.divider();

      // Step 5: Fetch content from selected URLs
      log.section("STEP 5: CONTENT FETCHING");
      log.info("📥 Fetching detailed content from selected URLs...");

      const fetchResults = await fetchWebContent(fetchDecision.selected_urls);
      const successfulFetches = fetchResults.filter(
        (r) => r.status === "success"
      );
      const failedFetches = fetchResults.filter((r) => r.status === "error");

      log.success(
        `Successfully fetched: ${successfulFetches.length}/${fetchResults.length} URLs`
      );
      if (failedFetches.length > 0) {
        log.warning(`Failed to fetch ${failedFetches.length} URLs`);
        failedFetches.forEach((f) => log.error(`  - ${f.url}: ${f.error}`));
      }
      log.divider();

      // Step 6: Synthesize research report
      log.section("STEP 6: RESEARCH SYNTHESIS");
      log.info("📝 Synthesizing research report from fetched content...");

      const contentForSynthesis = successfulFetches
        .map(
          (fetch) =>
            `URL: ${fetch.url}\n\nContent:\n${fetch.content}\n\n---\n\n`
        )
        .join("");

      const synthesisInput = `Original Query: ${originalQuery}\n\nFetched Content:\n\n${contentForSynthesis}`;

      const synthesisResult = await run(
        researchSynthesizerAgent,
        synthesisInput
      );
      const synthesis = synthesisResult.finalOutput as z.infer<
        typeof ResearchSynthesisSchema
      >;

      log.success("Research synthesis completed!");
      log.divider();

      // Step 7: Create final markdown report
      log.section("STEP 7: REPORT GENERATION");
      log.info("📄 Creating final markdown report...");

      const fullReport = `${synthesis.executive_summary}\n\n${synthesis.detailed_findings}\n\n## Conclusions\n\n${synthesis.conclusions}`;

      // Save to markdown file
      const savedPath = await saveMarkdownReport(
        synthesis.title,
        fullReport,
        originalQuery,
        synthesis.sources_used
      );

      log.success(`Research report saved to: ${savedPath}`);
      log.divider();

      // Display the report
      log.section("FINAL RESEARCH REPORT");
      console.log(`\n# ${synthesis.title}\n`);
      console.log(fullReport);

      if (synthesis.sources_used.length > 0) {
        console.log("\n## Sources\n");
        synthesis.sources_used.forEach((url, index) => {
          console.log(`${index + 1}. ${url}`);
        });
      }
    } catch (error) {
      log.error("Research process failed:", error);
      throw error;
    }
  });
}

export async function runStructuredOutputSystem() {
  checkAPIKeys();

  log.info("Starting Structured Output Research System. Type 'exit' to quit.");
  log.divider();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  while (true) {
    const userInput = await rl.question("Enter your research query: ");

    if (userInput.toLowerCase() === "exit") {
      log.info("Exiting research system. Goodbye!");
      break;
    }

    if (!userInput.trim()) {
      log.warning("Please enter a valid research query.");
      continue;
    }

    try {
      await runStructuredResearch(userInput.trim(), rl);
      log.divider();
      log.success("Research completed! Enter another query or 'exit' to quit.");
    } catch (error) {
      log.error("Research failed:", error);
      log.info("Please try again with a different query.");
    }

    log.divider();
  }

  rl.close();
}

async function main() {
  try {
    await runStructuredOutputSystem();
  } catch (error) {
    console.error("System initialization failed:", error);
    process.exit(1);
  }
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
