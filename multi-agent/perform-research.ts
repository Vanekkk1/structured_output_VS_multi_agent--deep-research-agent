// In api/research-agent.ts

import { run, withTrace } from "@openai/agents";
import { z } from "zod";
import {
  citationAgent,
  createResearchSubagent,
  leadResearcher,
} from "./agents.ts";
import { LeadResearcherOutputSchema } from "./response-schemas.ts";
import { log } from "./utils.ts";

// Context for the entire research process
interface ResearchContext {
  userQuery: string;
  researchLog: string[];
  finalReport: string;
  isComplete: boolean;
}

// The main function for the research process
export async function runResearchProcess(userQuery: string): Promise<string> {
  return await withTrace("Research Process - Multi-Agent", async () => {
    log.section("RESEARCH PROCESS STARTED");
    log.info(`User Query: "${userQuery}"`);

    const researchContext: ResearchContext = {
      userQuery,
      researchLog: [`Initial Query: "${userQuery}"`],
      finalReport: "",
      isComplete: false,
    };

    const MAX_ITERATIONS = 3;
    log.system(`Setting maximum iterations to ${MAX_ITERATIONS}`);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
      log.section(`ITERATION ${i + 1}/${MAX_ITERATIONS}`);

      log.lead("🧠 Invoking Lead Researcher to plan next steps...");
      const leadInput = `Original Query: "${
        researchContext.userQuery
      }"\n\nCurrent Research Log (all findings so far):\n${researchContext.researchLog.join(
        "\n\n"
      )}`;

      log.system("Passing context to Lead Researcher:\n" + leadInput);
      const leadResult = await run(leadResearcher, leadInput);
      const leadOutput = leadResult.finalOutput as z.infer<
        typeof LeadResearcherOutputSchema
      >;

      log.success("Lead Researcher plan received.");

      if (leadOutput.synthesis) {
        log.lead("📝 Lead Researcher Synthesis:\n" + leadOutput.synthesis);
        researchContext.finalReport = leadOutput.synthesis;
      }

      if (
        leadOutput.is_complete ||
        !leadOutput.next_steps ||
        leadOutput.next_steps.length === 0
      ) {
        log.success("✅ Research complete. Finalizing report.");
        break;
      }

      const subTasks = leadOutput.next_steps;
      log.section(`DELEGATING ${subTasks.length} SUB-TASKS`);
      subTasks.forEach((task, idx) => log.info(`  ${idx + 1}. ${task}`));

      const subagentPromises = subTasks.map((task) =>
        run(createResearchSubagent(), `Your task is: ${task}`)
      );

      const subagentResults = await Promise.allSettled(subagentPromises);

      const findingsHeader = `--- Findings from Iteration ${i + 1} ---`;
      researchContext.researchLog.push(findingsHeader);

      subagentResults.forEach((result, index) => {
        const task = subTasks[index];
        if (result.status === "fulfilled") {
          const finding = `Sub-task: ${task}\nResult: ${result.value.finalOutput}\n`;
          researchContext.researchLog.push(finding);
        } else {
          const errorFinding = `Sub-task: ${task}\nResult: FAILED\nError: ${result.reason}`;
          researchContext.researchLog.push(errorFinding);
        }
      });
      if (i === MAX_ITERATIONS - 1) {
        log.warning("🏁 Reached maximum iterations limit. Finalizing report.");
      }
      log.divider();
    }

    log.section("FINAL PROCESSING");
    log.info("✍️ Formatting citations...");

    if (!researchContext.finalReport) {
      log.warning("No final report was synthesized. Returning raw log.");
      return researchContext.researchLog.join("\n\n");
    }

    const citationInput = `<synthesized_text>\n${researchContext.finalReport}\n</synthesized_text>`;
    const citationResult = await run(citationAgent, citationInput);
    const citedReport = citationResult.finalOutput as string;

    log.success("Research process completed!");
    return citedReport;
  });
}
