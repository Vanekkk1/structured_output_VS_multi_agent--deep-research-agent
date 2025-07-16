import type { AgentInputItem } from "@openai/agents";
import { assistant, run, user } from "@openai/agents";
import "dotenv/config";
import readline from "node:readline/promises";
import { mainAgent } from "./agents.ts";
import { runResearchProcess } from "./perform-research.ts";
import { checkAPIKeys, log, saveMarkdown } from "./utils.ts";

export async function runMultiAgentSystem() {
  log.info("Starting Multi-Agent System. Type 'exit' to quit.");
  log.divider();

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  // The conversation history is maintained here
  let conversationHistory: AgentInputItem[] = [];

  while (true) {
    const userInput = await rl.question("You: ");

    if (userInput.toLowerCase() === "exit") {
      log.info("Exiting agent system. Goodbye!");
      break;
    }

    // Add user's message to the history
    conversationHistory.push(user(userInput));

    try {
      const mainAgentRun = await run(mainAgent, conversationHistory, {
        maxTurns: 1, // We want the main agent to decide the next step in one turn
      });

      // The structured output from the mainAgent
      const mainOutput = mainAgentRun.finalOutput as {
        direct_response: string | null;
        clarification_questions: string | null;
        needs_research: boolean;
        research_task: string | null;
      };

      // IMPORTANT: Update the history with the main agent's turn to provide context for the next interaction
      conversationHistory = mainAgentRun.history;

      if (mainOutput.needs_research && mainOutput.research_task) {
        log.agent(
          `Assistant: I need to do some research for that. Starting the research process for: "${mainOutput.research_task}"`
        );
        log.divider();

        // Delegate to the research process
        const finalReport = await runResearchProcess(mainOutput.research_task);

        log.divider();
        log.agent("Assistant: Here is the final research report:");
        console.log(finalReport);

        // Save the research report to markdown file
        try {
          const savedPath = await saveMarkdown(
            finalReport,
            mainOutput.research_task
          );
          log.success(`Research report saved to: ${savedPath}`);
        } catch (error) {
          log.error("Failed to save research report:", error);
        }

        log.divider();

        // Add the final report to the conversation history as an assistant message
        conversationHistory.push(assistant(finalReport));
      } else if (mainOutput.clarification_questions) {
        log.agent(`Assistant: ${mainOutput.clarification_questions}`);
        // The clarification question is already in the history, just display it
      } else if (mainOutput.direct_response) {
        log.agent(`Assistant: ${mainOutput.direct_response}`);
        // The direct response is also already in the history
      } else {
        log.error(
          "The main agent did not produce a valid response. Let's try again."
        );
        // Remove the last user message to allow retrying
        conversationHistory.pop();
      }
    } catch (error) {
      log.error("An error occurred during the agent run:", error);
      // To prevent a broken state, we can rollback the last user message
      conversationHistory.pop();
    }
    log.divider();
  }

  rl.close();
}

async function main() {
  await runMultiAgentSystem();
}

// Only run main if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
