import { z } from "zod";

// Schema for the clarification agent that decides if questions are needed
export const ClarificationDecisionSchema = z.object({
  needs_clarification: z
    .boolean()
    .describe(
      "Whether the query needs clarification before proceeding with research."
    ),
  reasoning: z
    .string()
    .describe("Brief explanation of why clarification is or isn't needed."),
  clarification_questions: z
    .array(z.string())
    .nullable()
    .describe(
      "List of specific clarifying questions to ask the user. Only provide if needs_clarification is true."
    ),
});

// Schema for the main agent that decides search queries
export const SearchPlanSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "Brief explanation of why these specific queries were chosen and how they cover the research topic."
    ),
  search_queries: z
    .array(z.string())
    .min(1)
    .max(6)
    .describe(
      "List of search queries to execute for comprehensive research. Aim for 2-5 queries that cover different aspects of the topic."
    ),
});

// Schema for the fetch agent that decides which links to fetch
export const FetchDecisionSchema = z.object({
  reasoning: z
    .string()
    .describe(
      "Explanation of why these URLs were selected and how they will contribute to the research."
    ),
  selected_urls: z
    .array(z.string())
    .min(1)
    .max(10)
    .describe(
      "URLs selected for content fetching based on relevance and quality indicators."
    ),
});

// Schema for the research synthesizer
export const ResearchSynthesisSchema = z.object({
  // No explicit reasoning/explanation field in this schema, so order remains unchanged
  title: z
    .string()
    .describe("A clear, descriptive title for the research report."),
  executive_summary: z
    .string()
    .describe("A concise summary of the key findings (2-3 paragraphs)."),
  detailed_findings: z
    .string()
    .describe(
      "Comprehensive analysis of the research with detailed explanations, organized into logical sections."
    ),
  conclusions: z
    .string()
    .describe("Key conclusions and insights drawn from the research."),
  sources_used: z
    .array(z.string())
    .describe("List of source URLs that were actually used in the synthesis."),
});
