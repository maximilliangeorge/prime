#!/usr/bin/env node

import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { validateCommand } from "./commands/validate.js";
import { graphCommand } from "./commands/graph.js";
import { showCommand } from "./commands/show.js";
import { browseCommand } from "./commands/browse.js";

const program = new Command();

program
  .name("prime")
  .description("Make argument structure explicit and machine-readable")
  .version("0.1.0");

program
  .command("init")
  .argument("[directory]", "target directory", ".")
  .description("Initialize a new prime repository")
  .action(initCommand);

program
  .command("validate")
  .argument("[directory]", "target directory", ".")
  .description("Validate the argument graph")
  .action(validateCommand);

program
  .command("graph")
  .argument("[directory]", "target directory", ".")
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
  .command("browse")
  .argument("[directory]", "target directory", ".")
  .description("Interactively browse the argument graph")
  .action(browseCommand);

program.parse();
