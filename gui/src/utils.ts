import { marked } from "marked";
import { unified } from "unified";
import remarkParse from "remark-parse";
import type { Contact, Education, Experience, Project, Resume, Skill, SkillEnums } from "./types";

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

function extractRealVars(raw: string): Record<string, string> {
  const text = raw.replace(/<!--[\s\S]*?-->/g, "");
  const vars: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const match = line.match(/^@([A-Z_]+)=(.*)$/);
    if (!match) continue;
    const [, key, value] = match;
    if (key === "REDACTED") continue;
    const [real] = value.split("||");
    vars[key] = real.trim();
  }
  return vars;
}

function requireVar(vars: Record<string, string>, key: string): string {
  const value = vars[key];
  if (!value) throw new Error(`Missing required @${key} variable in resume markdown`);
  return value;
}

const SECTION_HEADING_RE = /^##\s+(.+)$/;
const EDU_H3_RE =
  /^###\s+(.+?)\s*<span class="spacer"><\/span><span class="normal">Graduation:\s*(.+?)<\/span>\s*$/;
const EDU_H4_RE = /^####\s+(.+?),\s*GPA:\s*([0-9.]+)<span class="spacer">/;
const EXP_H3_RE = /^###\s+(.+?)\s*<span class="spacer"><\/span><span class="normal">\s*(.+?)\s*<\/span>\s*$/;
const EXP_H4_RE = /^####\s+(.+?)\s*<span class="spacer"><\/span>\s*(.+?)\s*$/;
const PROJ_H3_RE =
  /^###\s+\[(.+?)\]\((.+?)\)\s*<span class="spacer"><\/span><span class="normal">(.+?)<\/span>\s*$/;
const BULLET_RE = /^-\s+(.+)$/;
const SKILL_RE = /^\*\*(.+?)\*\*:\s*(.+)$/;
const SKILL_ENUMS: SkillEnums[] = ["Languages", "Frameworks", "Technologies"];

function nextNonBlank(lines: string[], start: number): { line: string; index: number } {
  let i = start;
  while (i < lines.length && lines[i].trim() === "") i++;
  return { line: (lines[i] ?? "").trim(), index: i };
}

function readBullets(lines: string[], start: number): { bullets: string[]; next: number } {
  const bullets: string[] = [];
  let i = start;
  while (i < lines.length) {
    const trimmed = lines[i].trim();
    if (trimmed === "") {
      i++;
      continue;
    }
    const match = trimmed.match(BULLET_RE);
    if (!match) break;
    bullets.push(match[1].trim());
    i++;
  }
  return { bullets, next: i };
}

export function mdToResume(raw: string): Resume {
  const vars = extractRealVars(raw);
  const name = requireVar(vars, "NAME");
  const contact: Contact = {
    email: requireVar(vars, "EMAIL"),
    phone: requireVar(vars, "PHONE"),
    portfolio: requireVar(vars, "PORTFOLIO"),
    linkedin: requireVar(vars, "LINKEDIN"),
    github: requireVar(vars, "GITHUB"),
  };

  const lines = renderToMarkdown(raw).split("\n");

  const education: Education[] = [];
  const experience: Experience[] = [];
  const projects: Project[] = [];
  const skills: Skill[] = [];

  type Section = "education" | "experience" | "projects" | "skills" | null;
  let section: Section = null;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) {
      i++;
      continue;
    }

    const sectionMatch = line.match(SECTION_HEADING_RE);
    if (sectionMatch) {
      const heading = sectionMatch[1].trim().toLowerCase();
      if (heading === "education") section = "education";
      else if (heading === "experience") section = "experience";
      else if (heading === "projects") section = "projects";
      else if (heading === "technical skills") section = "skills";
      else section = null;
      i++;
      continue;
    }

    if (section === "education") {
      const h3 = line.match(EDU_H3_RE);
      if (h3) {
        const { line: h4Line, index: h4Index } = nextNonBlank(lines, i + 1);
        const h4 = h4Line.match(EDU_H4_RE);
        if (!h4) throw new Error(`Expected degree/GPA line after education heading: "${line}"`);
        education.push({
          name: h3[1].trim(),
          degree: h4[1].trim(),
          gpa: Number(h4[2]),
          end_date: h3[2].trim(),
        });
        i = h4Index + 1;
        continue;
      }
      i++;
      continue;
    }

    if (section === "experience") {
      const h3 = line.match(EXP_H3_RE);
      if (h3) {
        const { line: h4Line, index: h4Index } = nextNonBlank(lines, i + 1);
        const h4 = h4Line.match(EXP_H4_RE);
        if (!h4) throw new Error(`Expected company/location line after experience heading: "${line}"`);
        const [start_date, end_date] = h3[2].split("&ndash;").map((s) => s.trim());
        if (!start_date || !end_date) {
          throw new Error(`Expected "start &ndash; end" date range in: "${h3[2]}"`);
        }
        const { bullets, next } = readBullets(lines, h4Index + 1);
        experience.push({
          title: h3[1].trim(),
          company: h4[1].trim(),
          location: h4[2].trim(),
          start_date,
          end_date,
          bullets,
        });
        i = next;
        continue;
      }
      i++;
      continue;
    }

    if (section === "projects") {
      const h3 = line.match(PROJ_H3_RE);
      if (h3) {
        const { bullets, next } = readBullets(lines, i + 1);
        projects.push({
          name: h3[1].trim(),
          link: h3[2].trim(),
          stack: h3[3].trim(),
          bullets,
        });
        i = next;
        continue;
      }
      i++;
      continue;
    }

    if (section === "skills") {
      const skillMatch = line.match(SKILL_RE);
      if (skillMatch) {
        const label = skillMatch[1].trim();
        if (!SKILL_ENUMS.includes(label as SkillEnums)) {
          throw new Error(`Unrecognized skill category: "${label}"`);
        }
        const items = skillMatch[2]
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        skills.push({ type: label as SkillEnums, items });
      }
      i++;
      continue;
    }

    i++;
  }

  return { name, contact, education, experience, projects, skills };
}
