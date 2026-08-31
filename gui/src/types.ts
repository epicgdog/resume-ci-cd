export type Contact = {
  email: string;
  phone: string;
  portfolio: string;
  linkedin: string;
  github: string;
};

export type Education = {
  name: string;
  degree: string;
  gpa: number;
  end_date: string;
};

export type Experience = {
  title: string; // SWE intern, FDE, Quant Trader, etc...
  company: string;
  location: string;
  start_date: string;
  end_date: string; // "Present" is a valid value for current roles
  bullets: string[];
};

export type Project = {
  name: string;
  link?: string;
  stack?: string;
  bullets: string[];
};

export type SkillEnums = "Languages" | "Frameworks" | "Technologies";

export type Skill = {
  type: SkillEnums;
  items: string[];
};

export type Resume = {
  name: string;
  contact: Contact;
  education: Education[];
  experience: Experience[];
  projects: Project[];
  skills: Skill[];
};
