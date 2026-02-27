// 分析结果类型定义

/** 单个文件的diff信息 */
export interface DiffFile {
  package: string;
  added: number;
  removed: number;
}

/** diff分析结果 */
export interface DiffAnalysis {
  total_files: number;
  total_added: number;
  total_removed: number;
  files: DiffFile[];
}

/** 覆盖详情 */
export interface CoverageDetail {
  method: string;
  description: string;
  is_covered: boolean;
  matched_tests: string[];
}

/** 覆盖分析结果 */
export interface CoverageResult {
  total_changed_methods: number;
  covered: string[];
  uncovered: string[];
  coverage_rate: number;
  details: CoverageDetail[];
}

/** 评分维度 */
export interface ScoreDimension {
  dimension: string;
  score: number;
  weight: number;
  weighted_score: number;
  details: string;
}

/** 评分结果 */
export interface ScoreResult {
  total_score: number;
  grade: string;
  summary: string;
  dimensions: ScoreDimension[];
}

/** AI建议的测试用例 */
export interface SuggestedTestCase {
  test_id: string;
  test_function: string;
  test_steps: string;
  expected_result: string;
}

/** AI分析结果 */
export interface AIAnalysis {
  uncovered_methods?: string[];
  coverage_gaps?: string;
  suggested_test_cases?: SuggestedTestCase[];
  risk_assessment?: string;
  improvement_suggestions?: string[];
  error?: string;
}

/** 成本信息 */
export interface AICost {
  input_cost: number;
  output_cost: number;
  total_cost: number;
  total_tokens: number;
}

/** 完整分析结果 */
export interface AnalyzeData {
  diff_analysis: DiffAnalysis;
  coverage: CoverageResult;
  score: ScoreResult;
  ai_analysis: AIAnalysis | null;
  ai_cost: AICost | null;
  duration_ms: number;
}

/** API响应 */
export interface AnalyzeResponse {
  success: boolean;
  data?: AnalyzeData;
  error?: string;
  duration_ms?: number;
}

/** 项目信息 */
export interface Project {
  id: number;
  name: string;
  description: string;
  mapping_data: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

/** 项目统计 */
export interface ProjectStats {
  analysis_count: number;
  avg_score: number | null;
  latest_analysis: string | null;
}

/** 项目详情（含统计） */
export interface ProjectDetail extends Project {
  stats: ProjectStats;
}

/** 分析记录 */
export interface AnalysisRecord {
  id: number;
  project_id: number;
  code_changes_summary: Record<string, unknown>;
  test_coverage_result: Record<string, unknown>;
  test_score: number;
  ai_suggestions: Record<string, unknown> | null;
  token_usage: number;
  cost: number;
  duration_ms: number;
  created_at: string;
}

/** 分析记录列表项（简要） */
export interface AnalysisRecordSummary {
  id: number;
  project_id: number;
  test_score: number;
  token_usage: number;
  cost: number;
  duration_ms: number;
  created_at: string;
}

/** 带记录ID的分析响应 */
export interface ProjectAnalyzeResponse extends AnalyzeResponse {
  record_id?: number;
}
