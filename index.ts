import chalk from "chalk";
import "dotenv/config";
import readline from "node:readline/promises";

// Import the two implementations
import { runMultiAgentSystem } from "./multi-agent/index.ts";
import { runStructuredOutputSystem } from "./structured-output/index.ts";

const colors = {
  title: chalk.bold.cyan,
  menu: chalk.yellow,
  option: chalk.green,
  info: chalk.blue,
  error: chalk.red,
  divider: chalk.gray.dim,
};

function displayWelcome() {
  console.clear();
  console.log(colors.title("🤖 AI Research Agent Tutorial Series"));
  console.log(colors.divider("=".repeat(50)));
  console.log(
    colors.info("Choose which implementation you'd like to explore:\n")
  );
}

function displayMenu() {
  console.log(colors.menu("Available Implementations:"));
  console.log();
  console.log(colors.option("1. Multi-Agent System"));
  console.log(
    "   • Sophisticated orchestration with multiple specialized agents"
  );
  console.log("   • Dynamic planning and iterative research");
  console.log("   • Conversation memory and adaptive responses");
  console.log("   • Best for: Complex research requiring multiple rounds\n");

  console.log(colors.option("2. Structured Output System"));
  console.log("   • Linear pipeline with structured decision-making");
  console.log("   • Predictable flow through research stages");
  console.log("   • Single-pass comprehensive synthesis");
  console.log("   • Best for: Straightforward research with known scope\n");

  console.log(colors.option("3. Exit"));
  console.log();
}

async function getChoice(rl: readline.Interface): Promise<string> {
  while (true) {
    const choice = await rl.question("Enter your choice (1, 2, or 3): ");

    if (["1", "2", "3"].includes(choice.trim())) {
      return choice.trim();
    }

    console.log(colors.error("Invalid choice. Please enter 1, 2, or 3."));
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    while (true) {
      displayWelcome();
      displayMenu();

      const choice = await getChoice(rl);

      console.log(colors.divider("-".repeat(50)));

      switch (choice) {
        case "1":
          console.log(colors.info("🚀 Starting Multi-Agent System...\n"));
          await runMultiAgentSystem();
          break;

        case "2":
          console.log(colors.info("🚀 Starting Structured Output System...\n"));
          await runStructuredOutputSystem();
          break;

        case "3":
          console.log(
            colors.info(
              "👋 Thanks for exploring the AI Research Agent tutorial!"
            )
          );
          console.log(
            colors.info(
              "Visit the README.md for more details about each implementation."
            )
          );
          rl.close();
          return;
      }

      // After running an implementation, ask if they want to try another
      console.log("\n" + colors.divider("-".repeat(50)));
      const tryAnother = await rl.question(
        "Would you like to try the other implementation? (y/n): "
      );

      if (!tryAnother.toLowerCase().startsWith("y")) {
        console.log(
          colors.info("👋 Thanks for exploring the AI Research Agent tutorial!")
        );
        break;
      }
    }
  } catch (error) {
    console.error(colors.error("An error occurred:"), error);
  } finally {
    rl.close();
  }
}

main().catch(console.error);
