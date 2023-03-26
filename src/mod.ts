import {
  dirname,
  DOMParser,
  Element,
  flags_parse,
  HTMLDocument,
  Node,
  urlJoin,
  urlParse,
} from "./deps.ts";

async function create_link_list(url: string, delimiter: string) {
  await fetch(url)
    .then((res) => {
      if (res.status >= 400) {
        throw res.status;
      }
      const content_type = res.headers.get("Content-type");
      if (content_type) {
        const content_type_array = content_type.split(";");
        const mime_type = content_type_array[0].trim().toLowerCase();
        const charset = content_type_array[1].split("=")[1].trim()
          .toLowerCase();
        if (mime_type !== "text/html" || charset !== "utf-8") {
          throw "Unexpected content-type: " + content_type;
        }
        return res.text();
      }
    })
    .then((text) => {
      if (text && text.length > 0) {
        const parser: DOMParser = new DOMParser();
        const document: HTMLDocument | null = parser.parseFromString(
          text,
          "text/html",
        );
        if (document !== null) {
          const elements = new Map(
            Array.from(document.querySelectorAll("body a"))
              .filter((n: Node) => n instanceof Element)
              .map((n: Node) => <Element> n)
              .filter((e: Element) => e.textContent.length > 0)
              .filter((e: Element) => e.attributes[0].nodeName == "href")
              .filter((e: Element) => e.attributes[0].value.match(/^[^#].*/))
              .filter((e: Element) => !(e.attributes[0].value.match(/^tel:*/)))
              .filter((e: Element) =>
                !(e.attributes[0].value.match(/^mailto:*/))
              )
              .filter((e: Element) =>
                !(e.attributes[0].value.match(/^javascript:*/))
              )
              .map((e: Element) => [e.attributes[0].value, e]),
          );
          const url_base = urlParse(url);
          elements.forEach((e) => {
            const href = e.attributes[0].value.trim().replace(
              /[\n\r]/,
              "",
            );
            let link;
            if (href.match(/^[^:]*:/)) {
              link = href;
            } else if (href.match(/^\//)) {
              link = urlJoin(url_base.origin, href);
            } else {
              link = urlJoin(url_base.origin, dirname(url_base.pathname), href);
            }
            console.log(
              link + delimiter + e.textContent.trim(),
            );
          });
        }
      }
    })
    .catch((reason) => {
      console.error(reason);
      return 1;
    });
  return 0;
}

const flags = flags_parse(Deno.args, {
  //boolean: ["help"],
  string: ["delimiter"],
  default: { delimiter: " " },
});

flags._.forEach((url) => {
  create_link_list(<string> url, flags.delimiter);
});
