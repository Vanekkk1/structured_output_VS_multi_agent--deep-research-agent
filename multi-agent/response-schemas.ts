import { z } from "zod";

export const mainAgentResponseSchema = z.object({
  direct_response: z
    .string()
    .nullable()
    .describe(
      "A direct response to the user when research is not needed, for example, if they ask a follow-up question about a completed research report or when they are chatting about generic things."
    ),
  clarification_questions: z
    .string()
    .nullable()
    .describe(
      "Clarification questions to ask the user to improve the quality of the research."
    ),
  needs_research: z
    .boolean()
    .describe("Whether this query requires delegation to the research team."),
  research_task: z
    .string()
    .nullable()
    .describe(
      "A clear and full research task description for the lead researcher."
    ),
});

// Schema for the lead researcher's structured output
export const LeadResearcherOutputSchema = z.object({
  synthesis: z
    .string()
    .nullable()
    .describe(
      "A cumulative synthesis of all research findings so far. Be comprehensive."
    ),
  is_complete: z
    .boolean()
    .describe(
      "Set to true ONLY when you have a comprehensive final answer and no more research is needed."
    ),
  next_steps: z
    .array(z.string())
    .nullable()
    .describe(
      "A list of specific, parallelizable, and distinct research tasks for sub-agents. This should be empty if the research is complete. This should not mention anything but the task itself, for example, 'research the latest developments in AI safety research'."
    ),
});
