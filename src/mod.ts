import {
  dirname,
  DOMParser,
  Element,
  HTMLDocument,
  Node,
  urlJoin,
  urlParse,
} from "./deps.ts";

export async function create_link_list(
  url: string,
  delimiter: string,
  all: boolean,
) {
  try {
    const res = await fetch(url);
    if (res.status >= 400) {
      throw res.status;
    }

    const content_type = res.headers.get("Content-type");
    if (!content_type) {
      throw new Error("No content-type");
    }
    const mime_type = content_type.split(";")[0].trim().toLowerCase();
    if (mime_type !== "text/html") {
      throw new Error(`Unexpected mime type: ${content_type}`);
    }
    const charset = content_type.split(";")[1]?.split("=")[1]?.trim()
      .toLowerCase();
    if (charset && charset !== "utf-8") {
      throw new Error(`Unexpected charset: ${content_type}`);
    }

    const text = await res.text();
    if (!text || text.length == 0) {
      throw new Error("No text");
    }

    const parser: DOMParser = new DOMParser();
    const document: HTMLDocument | null = parser.parseFromString(
      text,
      "text/html",
    );
    if (!document) {
      throw new Error("Failed to parse document");
    }

    const urlBase = urlParse(url);
    const urlDir = url.endsWith("/")
      ? urlBase.pathname
      : dirname(urlBase.pathname);
    Array.from(document.querySelectorAll("body a"))
      .filter((n: Node): n is Element => n instanceof Element)
      .filter((e: Element) => e.textContent?.length > 0)
      .forEach((e: Element) => {
        for (const a of e.attributes) {
          if (
            a.nodeName == "href" &&
            !/^#|tel:|mailto:|javascript:/i.test(a.value)
          ) {
            const name = e.textContent.trim();
            const href = a.value.trim().replace(/[\n\r]/g, "");
            let link: string;
            if (href.match(/^[^:]*:/)) {
              link = href;
            } else if (href.match(/^\/\//)) {
              link = urlBase.protocol + href;
            } else if (href.match(/^\//)) {
              link = urlJoin(urlBase.origin, href);
            } else {
              link = urlJoin(urlBase.origin, urlDir, href);
            }
            if (all || link.startsWith(urlBase.origin)) {
              console.log(link + delimiter + name);
            }
          }
        }
      });
  } catch (reason) {
    console.error(reason);
    return 1;
  }
  return 0;
}
