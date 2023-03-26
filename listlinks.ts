import { Command } from "./src/deps.ts";
import { create_link_list } from "./src/mod.ts";

await new Command()
  .name("listlinks")
  .version("0.1.0")
  .description("List links in html")
  .option("-d, --delimiter <delimiter:string>", "Delimiter", {
    default: " ",
  })
  .option("-A, --all [all:boolean]", "List all including external sites", {
    default: false,
  })
  .arguments("<url:string>")
  .action(async (option, url) =>
    await create_link_list(url, option.delimiter, option.all)
  )
  .parse(Deno.args);
