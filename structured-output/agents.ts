import { Agent } from "@openai/agents";
import {
  CLARIFICATION_AGENT_PROMPT,
  FETCH_DECISION_PROMPT,
  RESEARCH_SYNTHESIZER_PROMPT,
  SEARCH_PLANNER_PROMPT,
} from "./prompts.ts";
import {
  ClarificationDecisionSchema,
  FetchDecisionSchema,
  ResearchSynthesisSchema,
  SearchPlanSchema,
} from "./schemas.ts";

// Agent that decides if clarification is needed before research
export const clarificationAgent = Agent.create({
  name: "ClarificationAgent",
  instructions: CLARIFICATION_AGENT_PROMPT,
  outputType: ClarificationDecisionSchema,
  model: "gpt-4.1",
});

// Main agent that produces search queries and decides how many
export const searchPlannerAgent = Agent.create({
  name: "SearchPlanner",
  instructions: SEARCH_PLANNER_PROMPT,
  outputType: SearchPlanSchema,
  model: "gpt-4.1",
});

// Agent that decides which links to fetch from search results
export const fetchDecisionAgent = Agent.create({
  name: "FetchAgent",
  instructions: FETCH_DECISION_PROMPT,
  outputType: FetchDecisionSchema,
  model: "gpt-4.1",
});

// Agent that synthesizes research into markdown report
export const researchSynthesizerAgent = Agent.create({
  name: "ResearchSynthesizer",
  instructions: RESEARCH_SYNTHESIZER_PROMPT,
  outputType: ResearchSynthesisSchema,
  model: "gpt-4.1",
});
