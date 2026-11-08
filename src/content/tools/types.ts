// Editorial content shown under each tool. Inline text supports `code` and [link](/path).

export type Block =
  | string
  | { list: string[] }
  | { steps: string[] }
  | { code: string; caption?: string }
  | { table: { head: string[]; rows: string[][] } }
  | { note: string };

export interface ToolContent {
  sections: { title: string; blocks: Block[] }[];
  faq?: { q: string; a: string }[];
  sources?: { label: string; url: string }[];
}

export type ContentMap = Record<string, ToolContent>;
