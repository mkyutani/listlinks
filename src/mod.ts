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
  await fetch(url)
    .then((res) => {
      if (res.status >= 400) {
        throw res.status;
      }
      const content_type = res.headers.get("Content-type");
      if (content_type) {
        const content_type_array = content_type.split(";");
        if (content_type_array.length < 1) {
          throw "No content-type";
        }
        const mime_type = content_type_array[0].trim().toLowerCase();
        if (mime_type !== "text/html") {
          throw "Unexpected content-type: " + content_type;
        }
        if (content_type_array.length < 2) {
          console.warn("No mime type; assume utf-8");
        } else {
          const charset = content_type_array[1].split("=")[1].trim()
            .toLowerCase();
          if (charset !== "utf-8") {
            throw "Unexpected content-type: " + content_type;
          }
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
          const url_base = urlParse(url);
          Array.from(document.querySelectorAll("body a"))
            .filter((n: Node) => n instanceof Element)
            .map((n: Node) => <Element> n)
            .filter((e: Element) => e.textContent.length > 0)
            .forEach((e: Element) => {
              for (const a of e.attributes) {
                if (
                  a.nodeName == "href" &&
                  a.value.match(/^[^#].*/) &&
                  !a.value.match(/^tel:*/) &&
                  !(a.value.match(/^mailto:*/)) &&
                  !(a.value.match(/^javascript:*/))
                ) {
                  const name = e.textContent.trim();
                  const href = a.value.trim().replace(/[\n\r]/, "");
                  let url;
                  if (href.match(/^[^:]*:/)) {
                    url = href;
                  } else if (href.match(/^\//)) {
                    url = urlJoin(url_base.origin, href);
                  } else {
                    url = urlJoin(
                      url_base.origin,
                      dirname(url_base.pathname),
                      href,
                    );
                  }
                  if (all || url.startsWith(url_base.origin)) {
                    console.log(
                      url + delimiter + name,
                    );
                  }
                }
              }
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
