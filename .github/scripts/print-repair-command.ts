import { readFileSync } from "node:fs";
import { extractRepairCommand } from "./extract-repair-command.ts";

const [, , logPath] = process.argv;
const log = readFileSync(logPath, "utf8");
const command = extractRepairCommand(log);

if (command) {
  process.stdout.write(command);
}
