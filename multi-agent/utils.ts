// In api/utils.ts

import chalk from "chalk";
import fs from "node:fs";
import path from "node:path";

const colors = {
  info: chalk.blue,
  success: chalk.green,
  warning: chalk.yellow,
  error: chalk.red,
  divider: chalk.gray.dim,
  section: chalk.bold.blue,
  user: chalk.bold.cyan,
  agent: chalk.bold.magenta,
  subagent: chalk.cyan,
  lead: chalk.magenta,
  system: chalk.gray,
};

export const log = {
  info: (message: string, ...args: unknown[]) =>
    console.log(colors.info(message), ...args),
  success: (message: string, ...args: unknown[]) =>
    console.log(colors.success(message), ...args),
  warning: (message: string, ...args: unknown[]) =>
    console.log(colors.warning(message), ...args),
  error: (message: string, ...args: unknown[]) =>
    console.log(colors.error(message), ...args),
  divider: (char = "─", length = 50) =>
    console.log(colors.divider(char.repeat(length))),
  section: (title: string) => {
    console.log("\n" + colors.section(`\n== ${title.toUpperCase()} ==`));
  },
  user: (message: string) => colors.user(message),
  agent: (message: string, ...args: unknown[]) =>
    console.log(colors.agent(message), ...args),
  subagent: (message: string, ...args: unknown[]) =>
    console.log(colors.subagent(message), ...args),
  lead: (message: string, ...args: unknown[]) =>
    console.log(colors.lead(message), ...args),
  system: (message: string, ...args: unknown[]) =>
    console.log(colors.system(message), ...args),
};

export const checkAPIKeys = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error(
      "OPENAI_API_KEY is not set, please set it in the .env file"
    );
  }

  if (!process.env.TALIVY_API_KEY) {
    throw new Error(
      "TALIVY_API_KEY is not set, please set it in the .env file"
    );
  }
};

export const saveMarkdown = async (
  content: string,
  query: string
): Promise<string> => {
  try {
    // Create reports directory if it doesn't exist
    const reportsDir = path.join(process.cwd(), "reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    // Create filename with timestamp and sanitized query
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const sanitizedQuery = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .replace(/\s+/g, "-")
      .substring(0, 50);
    const filename = `research-${timestamp}-${sanitizedQuery}.md`;
    const filepath = path.join(reportsDir, filename);

    // Add metadata header to content
    const markdownContent = `# Research Report

**Query:** ${query}  
**Generated:** ${new Date().toLocaleString()}  
**Agent:** Multi-Agent System

---

${content}
`;

    // Write file
    fs.writeFileSync(filepath, markdownContent, "utf-8");

    return filepath;
  } catch (error) {
    log.error("Failed to save markdown file:", error);
    throw error;
  }
};
