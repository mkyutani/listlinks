import { Command } from "./src/deps.ts";
import { create_link_list } from "./src/mod.ts";

await new Command()
  .name("listlinks")
  .version("0.1.0")
  .description("List links in html")
  .option("-d, --delimiter <delimiter:string>", "Delimiter", {
    default: " ",
  })
  .option("-E, --exclude", "List all excluding external sites")
  .arguments("<url:string>")
  .action(async (options, ...args) => {
    await create_link_list(
      args[0],
      options.delimiter,
      !(options.exclude ?? false),
    );
  })
  .parse(Deno.args);
