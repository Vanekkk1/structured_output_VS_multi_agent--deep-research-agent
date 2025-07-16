import { Agent } from "@openai/agents";
import {
  CITATION_AGENT_PROMPT,
  LEAD_RESEARCHER_PROMPT,
  SUBAGENT_PROMPT_TEMPLATE,
  USER_INTERACT_PROMPT,
} from "./prompts.ts";
import {
  LeadResearcherOutputSchema,
  mainAgentResponseSchema,
} from "./response-schemas.ts";
import { webFetchTool, webSearchTool } from "./tools.ts";

export const mainAgent = Agent.create({
  name: "MainAgent",
  instructions: USER_INTERACT_PROMPT,
  outputType: mainAgentResponseSchema,
  model: "gpt-4.1",
});

// The Lead Researcher agent, responsible for orchestration
export const leadResearcher = new Agent({
  name: "LeadResearcher",
  instructions: LEAD_RESEARCHER_PROMPT(),
  model: "gpt-4.1",
  outputType: LeadResearcherOutputSchema,
});

// A factory function to create new sub-agents for specific tasks
export const createResearchSubagent = () => {
  return new Agent({
    name: `SubAgent`, // Name can be generic, as its role is defined by the prompt
    instructions: SUBAGENT_PROMPT_TEMPLATE(),
    model: "gpt-4.1",
    tools: [webSearchTool, webFetchTool],
  });
};

// The Citation Agent, responsible for formatting the final report
export const citationAgent = new Agent({
  name: "CitationAgent",
  instructions: CITATION_AGENT_PROMPT,
  model: "gpt-4.1",
});
