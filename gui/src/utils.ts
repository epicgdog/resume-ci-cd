import { marked } from "marked";
import { unified } from "unified";
import remarkParse from "remark-parse";

marked.setOptions({ breaks: false });

export function renderToMarkdown(raw: string): string {
  let text = raw.replace(/<!--[\s\S]*?-->/g, "");

  const vars: Record<string, string> = {};
  let redacted = false;
  const remaining: string[] = [];

  for (const line of text.split("\n")) {
    const match = line.match(/^@([A-Z_]+)=(.*)$/);
    if (!match) {
      remaining.push(line);
      continue;
    }
    const [, key, value] = match;
    if (key === "REDACTED") {
      redacted = value.trim().toLowerCase() === "true";
    } else {
      const [real, fake] = value.split("||");
      vars[key] = (redacted && fake !== undefined ? fake : real).trim();
    }
  }
  text = remaining.join("\n");
  text = text.replace(/\{([A-Z_]+)\}/g, (_, key) => vars[key] ?? "");

  return text;
}

export function renderResumeMarkdown(raw: string): string {
  let text = renderToMarkdown(raw);

  text = text.replace(
    /<div class="section headerInfo">([\s\S]*?)<\/div>/,
    (_, inner) => `<div class="section headerInfo">${marked.parse(inner.trim()) as string}</div>`,
  );

  return marked.parse(text) as string;
}

interface ResumeSection {
  heading: string;
  level: number;
  content: string[];
  children: ResumeSection[];
}

function textOf(node: any): string {
  if (typeof node.value === "string") return node.value;
  if (Array.isArray(node.children)) return node.children.map(textOf).join("");
  return "";
}

function walkToSections(tree: any): ResumeSection[] {
  const root: ResumeSection = { heading: "root", level: 0, content: [], children: [] };
  const stack: ResumeSection[] = [root];

  for (const node of tree.children as any[]) {
    if (node.type === "heading") {
      const section: ResumeSection = {
        heading: textOf(node).trim(),
        level: node.depth,
        content: [],
        children: [],
      };
      while (stack.length > 1 && stack[stack.length - 1].level >= section.level) {
        stack.pop();
      }
      stack[stack.length - 1].children.push(section);
      stack.push(section);
      continue;
    }

    const current = stack[stack.length - 1];
    if (node.type === "list") {
      for (const item of node.children as any[]) {
        const value = textOf(item).trim();
        if (value) current.content.push(value);
      }
    } else if (node.type === "paragraph") {
      const value = textOf(node).trim();
      if (value) current.content.push(value);
    } else if (node.type === "html") {
      const value = (node.value as string).trim();
      if (value) current.content.push(value);
    }
  }

  return root.children;
}

export function mdToJson(raw: string): ResumeSection[] {
  const text = renderToMarkdown(raw);
  const tree = unified().use(remarkParse).parse(text);
  return walkToSections(tree);
}
