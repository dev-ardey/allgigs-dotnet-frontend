export interface Job {
  id: number;
  Title?: string;
  Company?: string;
  Location?: string;
  Description?: string;
  Summary?: string;
  Salary?: string;
  Type?: string;
  created_at?: string;
  URL?: string;
  Source?: string;
  Industry?: string;
  hours?: string;
  duration?: string;
  UNIQUE_ID?: string;
}

export interface JobData {
  id: number;
  Industy?: string;
  Source?: string;
  company_name?: string;
  title?: string;
  location?: string;
  created_at?: string;
}

export interface IndustryStats {
  industry: string;
  count: number;
  percentage: number;
}

export interface SourceJobStats {
  [source: string]: {
    [industry: string]: number;
    total: number;
  };
}
