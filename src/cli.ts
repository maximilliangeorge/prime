#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { graphCommand } from "./commands/graph.js";
import { showCommand } from "./commands/show.js";
import { browseCommand } from "./commands/browse.js";
import { pluckCommand } from "./commands/pluck.js";

const program = new Command();

program
  .name("prime")
  .description("Make argument structure explicit and machine-readable")
  .version("0.1.0");

program
  .command("init")
  .argument("[directory]", "local directory or remote URL", ".")
  .description("Initialize a new prime repository")
  .action(initCommand);

program
  .command("validate")
  .argument("[directory]", "local directory or remote URL", ".")
  .description("Validate the argument graph")
  .action(validateCommand);

program
  .command("graph")
  .argument("[directory]", "local directory or remote URL", ".")
  .option("-f, --format <format>", "output format: list, tree, dot, json", "list")
  .option("-d, --depth <depth>", "max tree depth (tree format only)", parseInt)
  .description("Display the argument graph")
  .action(graphCommand);

program
  .command("show")
  .argument("<reference>", "local path or prime:// URI")
  .description("Show the content of a node")
  .action(showCommand);

program
  .command("pluck")
  .argument("<reference>", "local path to a node file")
  .option("-d, --depth <depth>", "max premise depth (-1 for unlimited)", parseInt)
  .description("Extract a claim and its premises as a self-contained document")
  .action(pluckCommand);

program
  .command("browse")
  .argument("[directory]", "local directory or remote URL", ".")
  .description("Interactively browse the argument graph")
  .action(browseCommand);

program.parse();
