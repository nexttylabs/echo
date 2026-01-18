/*
 * Copyright (c) 2026 Echo Team
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <https://www.gnu.org/licenses/>.
 */

/**
 * 重复反馈检测服务
 * 使用 Levenshtein 距离和关键词重叠算法检测重复
 */

export interface DuplicateCandidate {
  feedbackId: number;
  title: string;
  description: string;
  similarity: number;
  reasons: string[];
}

/**
 * Levenshtein 距离算法（字符串相似度）
 */
function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const matrix: number[][] = [];

  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * 计算字符串相似度（0-1）
 */
function stringSimilarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const maxLen = Math.max(len1, len2);

  if (maxLen === 0) return 1;

  const distance = levenshteinDistance(str1.toLowerCase(), str2.toLowerCase());
  return 1 - distance / maxLen;
}

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "in",
  "on",
  "at",
  "to",
  "for",
  "of",
  "with",
  "by",
  "from",
  "as",
  "is",
  "was",
  "are",
  "were",
  "的",
  "了",
  "是",
  "在",
  "和",
  "或",
  "但是",
  "从",
  "为了",
  "关于",
]);

/**
 * 提取关键词（移除停用词）
 */
function extractKeywords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * 计算关键词重叠度 (Jaccard similarity)
 */
function keywordOverlap(text1: string, text2: string): number {
  const keywords1 = new Set(extractKeywords(text1));
  const keywords2 = new Set(extractKeywords(text2));

  if (keywords1.size === 0 && keywords2.size === 0) return 0;

  const intersection = new Set([...keywords1].filter((x) => keywords2.has(x)));
  const union = new Set([...keywords1, ...keywords2]);

  return intersection.size / union.size;
}

/**
 * 计算综合相似度
 */
export function calculateSimilarity(
  title1: string,
  desc1: string,
  title2: string,
  desc2: string,
): { score: number; reasons: string[] } {
  const reasons: string[] = [];
  let totalScore = 0;
  let weightSum = 0;

  // 标题相似度（权重 50%）
  const titleSimilarity = stringSimilarity(title1, title2);
  totalScore += titleSimilarity * 50;
  weightSum += 50;

  if (titleSimilarity > 0.8) {
    reasons.push(
      `Titles are very similar (${Math.round(titleSimilarity * 100)}%)`,
    );
  }

  // 描述相似度（权重 30%）
  const descSimilarity = stringSimilarity(desc1 || "", desc2 || "");
  totalScore += descSimilarity * 30;
  weightSum += 30;

  if (descSimilarity > 0.7) {
    reasons.push(
      `Descriptions are similar (${Math.round(descSimilarity * 100)}%)`,
    );
  }

  // 关键词重叠度（权重 20%）
  const fullText1 = `${title1} ${desc1 || ""}`;
  const fullText2 = `${title2} ${desc2 || ""}`;
  const keywordScore = keywordOverlap(fullText1, fullText2);
  totalScore += keywordScore * 20;
  weightSum += 20;

  if (keywordScore > 0.5) {
    reasons.push(
      `Many keywords in common (${Math.round(keywordScore * 100)}%)`,
    );
  }

  const finalScore = weightSum > 0 ? totalScore / weightSum : 0;

  return {
    score: Math.round(finalScore * 100) / 100,
    reasons,
  };
}

export interface FeedbackForDuplicateCheck {
  feedbackId: number;
  title: string;
  description: string | null;
}

/**
 * 检测与现有反馈的重复
 */
export function findDuplicates(
  title: string,
  description: string | undefined,
  existingFeedbacks: FeedbackForDuplicateCheck[],
  excludeFeedbackId?: number,
  threshold: number = 0.75,
): DuplicateCandidate[] {
  const candidates: DuplicateCandidate[] = [];

  for (const existing of existingFeedbacks) {
    if (excludeFeedbackId && existing.feedbackId === excludeFeedbackId) {
      continue;
    }

    const { score, reasons } = calculateSimilarity(
      title,
      description || "",
      existing.title,
      existing.description || "",
    );

    if (score >= threshold) {
      candidates.push({
        feedbackId: existing.feedbackId,
        title: existing.title,
        description: existing.description || "",
        similarity: Math.round(score * 100),
        reasons,
      });
    }
  }

  return candidates.sort((a, b) => b.similarity - a.similarity);
}

/**
 * 批量检测重复
 */
export function batchFindDuplicates(
  feedbacks: Array<{
    feedbackId: number;
    title: string;
    description?: string;
  }>,
  allFeedbacks: FeedbackForDuplicateCheck[],
  threshold: number = 0.75,
): Array<{ feedbackId: number; duplicates: DuplicateCandidate[] }> {
  return feedbacks.map((fb) => ({
    feedbackId: fb.feedbackId,
    duplicates: findDuplicates(
      fb.title,
      fb.description,
      allFeedbacks,
      fb.feedbackId,
      threshold,
    ),
  }));
}
