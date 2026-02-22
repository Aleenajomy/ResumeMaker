export interface User {
  id: number;
  username: string;
  email: string;
}

export interface Resume {
  id: number;
  original_file: string;
  parsed_content: ParsedResume;
  created_at: string;
  updated_at: string;
}

export interface ParsedResume {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  experience: Experience[];
  education: Education[];
}

export interface Experience {
  title: string;
  company: string;
  duration: string;
  responsibilities: string[];
}

export interface Education {
  degree: string;
  institution: string;
  year: string;
}

export interface JobDescription {
  id: number;
  title: string;
  content: string;
  file?: string;
  extracted_keywords: ExtractedKeywords;
  created_at: string;
}

export interface ExtractedKeywords {
  technical_skills: string[];
  tools: string[];
  soft_skills: string[];
  action_verbs: string[];
}

export interface OptimizedResume {
  id: number;
  original_resume: number;
  job_description: number;
  optimized_content: ParsedResume;
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  pdf_file: string;
  created_at: string;
}

export interface CoverLetter {
  id: number;
  optimized_resume: number;
  content: string;
  pdf_file: string;
  created_at: string;
}
