/*
 * Copyright (c) 2026 Nexttylabs Team
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
 * 基于关键词的反馈自动分类
 * MVP 实现：使用简单的关键词匹配
 */

export type FeedbackType = "bug" | "feature" | "issue" | "other";
export type FeedbackPriority = "low" | "medium" | "high";

const BUG_KEYWORDS = [
  // 中文
  "崩溃",
  "错误",
  "无法",
  "失败",
  "异常",
  "故障",
  "不能",
  "不工作",
  "没反应",
  "卡住",
  "卡死",
  "闪退",
  "黑屏",
  "白屏",
  "显示错误",
  "报错",
  "无法访问",
  "无法登录",
  "无法打开",
  "无法加载",
  "无法保存",
  "无法提交",
  // 英文
  "bug",
  "crash",
  "error",
  "broken",
  "fail",
  "failure",
  "not working",
  "doesn't work",
  "unable to",
  "cannot",
  "exception",
  "freeze",
  "stuck",
  "blank",
  "glitch",
];

const FEATURE_KEYWORDS = [
  // 中文
  "希望",
  "建议",
  "添加",
  "增加",
  "新增",
  "功能",
  "改进",
  "优化",
  "增强",
  "支持",
  "能否",
  "可以",
  "最好",
  "如果",
  "愿望",
  "期待",
  "想要",
  "需要",
  // 英文
  "feature",
  "add",
  "improve",
  "enhance",
  "suggest",
  "wish",
  "would like",
  "request",
  "support",
  "implement",
];

const ISSUE_KEYWORDS = [
  // 中文
  "问题",
  "疑问",
  "困惑",
  "不清楚",
  "不知道",
  "如何",
  "怎么",
  "怎样",
  "咨询",
  "问",
  "求助",
  // 英文
  "issue",
  "question",
  "help",
  "how to",
  "confused",
  "unclear",
  "problem",
  "trouble",
];

const HIGH_PRIORITY_KEYWORDS = [
  // 中文
  "紧急",
  "严重",
  "重要",
  "关键",
  "无法使用",
  "完全不能",
  "影响",
  "阻塞",
  "阻碍",
  "核心",
  "主要",
  // 英文
  "urgent",
  "critical",
  "severe",
  "important",
  "blocking",
  "major",
  "cannot use",
  "unable to work",
];

const LOW_PRIORITY_KEYWORDS = [
  // 中文
  "建议",
  "可选",
  "也许",
  "可能",
  "或者",
  "轻微",
  "小",
  "次要",
  "非紧急",
  "不急",
  // 英文
  "suggestion",
  "optional",
  "minor",
  "nice to have",
  "low",
  "not urgent",
  "whenever",
  "eventually",
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fa5]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function calculateScore(text: string, keywords: string[]): number {
  const normalized = normalizeText(text);
  const words = normalized.split(" ");

  let score = 0;
  for (const keyword of keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalized.includes(normalizedKeyword)) {
      score += 2;
    }
    for (const word of words) {
      if (
        word.includes(normalizedKeyword) ||
        normalizedKeyword.includes(word)
      ) {
        score += 0.5;
      }
    }
  }

  return score;
}

export function classifyType(title: string, description?: string): FeedbackType {
  const text = `${title} ${description || ""}`;

  const bugScore = calculateScore(text, BUG_KEYWORDS);
  const featureScore = calculateScore(text, FEATURE_KEYWORDS);
  const issueScore = calculateScore(text, ISSUE_KEYWORDS);

  if (bugScore > featureScore && bugScore > issueScore) {
    return "bug";
  } else if (featureScore > bugScore && featureScore > issueScore) {
    return "feature";
  } else if (issueScore > bugScore && issueScore > featureScore) {
    return "issue";
  }

  return "other";
}

export function classifyPriority(
  title: string,
  description?: string,
): FeedbackPriority {
  const text = `${title} ${description || ""}`;

  const highScore = calculateScore(text, HIGH_PRIORITY_KEYWORDS);
  const lowScore = calculateScore(text, LOW_PRIORITY_KEYWORDS);

  if (highScore > 0 && highScore > lowScore * 2) {
    return "high";
  } else if (lowScore > 0 && lowScore > highScore * 2) {
    return "low";
  }

  return "medium";
}

export interface ClassificationResult {
  type: FeedbackType;
  priority: FeedbackPriority;
  confidence: number;
  reasons: string[];
}

export function classifyFeedback(
  title: string,
  description?: string,
): ClassificationResult {
  const text = `${title} ${description || ""}`;
  const normalized = normalizeText(text);

  const type = classifyType(title, description);
  const priority = classifyPriority(title, description);

  const keywords =
    type === "bug"
      ? BUG_KEYWORDS
      : type === "feature"
        ? FEATURE_KEYWORDS
        : type === "issue"
          ? ISSUE_KEYWORDS
          : [];

  const confidence =
    keywords.length > 0
      ? Math.min(calculateScore(text, keywords) / keywords.length, 1)
      : 0;

  const reasons: string[] = [];
  for (const keyword of keywords) {
    if (normalized.includes(keyword.toLowerCase())) {
      reasons.push(`Matched keyword: "${keyword}"`);
    }
  }

  return {
    type,
    priority,
    confidence: Math.round(confidence * 100) / 100,
    reasons: reasons.slice(0, 3),
  };
}

export async function batchClassifyFeedback(
  feedbacks: Array<{
    feedbackId: string;
    title: string;
    description?: string;
  }>,
): Promise<Array<{ feedbackId: string; classification: ClassificationResult }>> {
  return feedbacks.map((feedback) => ({
    feedbackId: feedback.feedbackId,
    classification: classifyFeedback(feedback.title, feedback.description),
  }));
}
