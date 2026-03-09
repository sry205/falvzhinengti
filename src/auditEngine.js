import crypto from "node:crypto";
import { auditRules } from "./rules.js";
import { legalKnowledge } from "./legalKnowledge.js";

const severityWeight = {
  low: 1,
  medium: 2,
  high: 3
};

const financialKeywords = [
  "贷款",
  "授信",
  "理财",
  "基金",
  "收益",
  "支付",
  "消费金融",
  "分期",
  "利率",
  "额度",
  "风控",
  "平台"
];

const docTypeFinanceHints = new Set([
  "marketing_copy",
  "product_description",
  "user_agreement",
  "privacy_policy"
]);

export class ValidationError extends Error {}

function normalizeInput(value) {
  return typeof value === "string" ? value.trim() : "";
}

function excerptAround(content, matchText) {
  const idx = content.indexOf(matchText);
  if (idx === -1) {
    return content.slice(0, 80);
  }

  const start = Math.max(0, idx - 18);
  const end = Math.min(content.length, idx + matchText.length + 22);
  return content.slice(start, end);
}

function getPatternMatch(content, pattern, negationPrefixes = []) {
  const match = pattern.exec(content);
  if (!match) {
    return null;
  }

  const prefix = content.slice(Math.max(0, match.index - 6), match.index);
  const negated = negationPrefixes.some((token) => prefix.includes(token));
  return negated ? null : match;
}

function retrieveLegalBases({ issueType, content, scenario }) {
  const haystack = `${content} ${scenario}`.toLowerCase();

  return legalKnowledge
    .map((item) => {
      let score = item.issueType === issueType ? 3 : 0;
      for (const keyword of item.keywords) {
        if (haystack.includes(keyword.toLowerCase())) {
          score += 1;
        }
      }
      return { ...item, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map((item) => ({
      law_title: item.lawTitle,
      article: item.article,
      summary: item.summary,
      guidance: item.guidance
    }));
}

function detectRiskItems({ docType, content, scenario }) {
  const lowerDocType = normalizeInput(docType) || "marketing_copy";
  const riskItems = [];

  for (const rule of auditRules) {
    if (!rule.docTypes.includes(lowerDocType)) {
      continue;
    }

    const matchedEntry = rule.patterns
      .map((pattern) => ({ pattern, match: getPatternMatch(content, pattern, rule.negationPrefixes) }))
      .find((entry) => entry.match);

    let triggered = Boolean(matchedEntry);
    let excerpt = matchedEntry ? excerptAround(content, matchedEntry.match[0]) : content.slice(0, 80);

    if (matchedEntry && rule.missingSignals) {
      const missingCount = rule.missingSignals.filter((signal) => !content.includes(signal)).length;
      triggered = missingCount >= Math.ceil(rule.missingSignals.length / 2);
      excerpt = excerptAround(content, matchedEntry.match[0]);
    }

    if (!triggered) {
      continue;
    }

    const legalBasis = retrieveLegalBases({
      issueType: rule.issueType,
      content,
      scenario
    });

    riskItems.push({
      title: rule.title,
      excerpt,
      issue_type: rule.issueType,
      severity: rule.severity,
      legal_basis: legalBasis,
      explanation: rule.explanation,
      rewrite_suggestion: rule.rewriteSuggestion
    });
  }

  return riskItems;
}

function summarizeAudit({ docType, content, riskItems }) {
  if (content.length < 15) {
    return "文本过短，当前结论仅供初筛，建议补充完整业务表述后再次审查。";
  }

  if (riskItems.length === 0) {
    return `未发现明显高风险表述。当前 ${docType} 文本整体较克制，但仍建议人工复核费用披露、授权边界和风险提示是否完整。`;
  }

  const highCount = riskItems.filter((item) => item.severity === "high").length;
  if (highCount > 0) {
    return `检测到 ${highCount} 项高风险问题，重点集中在营销承诺、消费者信息披露或个人信息授权边界，建议先整改再外发或上线。`;
  }

  return `检测到 ${riskItems.length} 项中低风险问题，主要属于披露不足或授权说明不充分，适合在上线前统一修订。`;
}

function deriveOverallRisk(riskItems, content) {
  if (content.length < 8) {
    return "medium";
  }

  const maxWeight = riskItems.reduce((max, item) => Math.max(max, severityWeight[item.severity] || 0), 0);

  if (maxWeight >= 3) {
    return "high";
  }
  if (maxWeight === 2) {
    return "medium";
  }
  return "low";
}

function createGeneralAdvisory({ docType, content, scenario }) {
  const combinedContext = `${content} ${scenario}`;
  const isFinancial =
    docTypeFinanceHints.has(docType) ||
    financialKeywords.some((keyword) => combinedContext.includes(keyword));

  if (isFinancial) {
    return null;
  }

  return {
    title: "文本可能不是典型金融场景，建议补充业务上下文",
    excerpt: content.slice(0, 80),
    issue_type: "context_warning",
    severity: "low",
    legal_basis: [
      {
        law_title: "金融消费者权益保护相关监管要求",
        article: "适当性与信息披露原则",
        summary: "金融业务合规审查需要结合产品类型、交易流程和披露对象判断。",
        guidance: "请补充该文本对应的金融场景，例如贷款宣传、支付开户或理财销售。"
      }
    ],
    explanation: "当前文本金融属性不强，系统难以准确应用金融消费者保护规则。",
    rewrite_suggestion: "补充产品类型、目标用户、费用或授权场景后重新审查。"
  };
}

export function auditText(input = {}) {
  const docType = normalizeInput(input.doc_type) || "marketing_copy";
  const content = normalizeInput(input.content);
  const scenario = normalizeInput(input.scenario);

  if (!content) {
    throw new ValidationError("待审查文本不能为空。");
  }

  const riskItems = detectRiskItems({ docType, content, scenario });
  const advisory = createGeneralAdvisory({ docType, content, scenario });
  const finalRiskItems = advisory ? [...riskItems, advisory] : riskItems;
  const overallRisk = deriveOverallRisk(finalRiskItems, content);
  const summary = summarizeAudit({ docType, content, riskItems: finalRiskItems });

  return {
    audit_id: crypto.randomUUID(),
    overall_risk: overallRisk,
    summary,
    risk_items: finalRiskItems
  };
}

export function answerFollowup({ audit, question }) {
  const normalizedQuestion = normalizeInput(question);

  if (!normalizedQuestion) {
    return {
      answer: "请输入你想追问的具体问题，例如“为什么这句话有风险”或“怎么改更稳妥”。",
      cited_bases: []
    };
  }

  if (audit.risk_items.length === 0) {
    return {
      answer: "这次审查没有命中明显风险规则。若你希望更严格地看费用披露、授权边界或适当性提示，建议贴出更完整的上下文。",
      cited_bases: []
    };
  }

  const topItem = [...audit.risk_items].sort(
    (a, b) => (severityWeight[b.severity] || 0) - (severityWeight[a.severity] || 0)
  )[0];

  const citedBases = topItem.legal_basis.map((item) => `${item.law_title}${item.article}`);
  let answer = `当前最值得优先处理的是“${topItem.title}”。${topItem.explanation}`;

  if (normalizedQuestion.includes("怎么改") || normalizedQuestion.includes("修改")) {
    answer = `建议优先这样改：${topItem.rewrite_suggestion}。同时保留必要的费用、风险和授权边界说明，避免只删风险词而不补充真实披露。`;
  } else if (normalizedQuestion.includes("为什么") || normalizedQuestion.includes("依据")) {
    const basisText = topItem.legal_basis
      .map((item) => `${item.law_title}${item.article}强调：${item.summary}`)
      .join(" ");
    answer = `${topItem.explanation}${basisText}`;
  } else if (normalizedQuestion.includes("先处理") || normalizedQuestion.includes("优先")) {
    answer = `建议先处理高风险项“${topItem.title}”，因为它最可能直接影响营销真实性、授权有效性或消费者公平保护。整改后再统一优化其他披露细节。`;
  }

  return {
    answer,
    cited_bases: citedBases
  };
}
