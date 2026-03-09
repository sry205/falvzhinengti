export const auditRules = [
  {
    id: "guaranteed-return",
    title: "收益或审批结果存在绝对化承诺",
    issueType: "misleading_marketing",
    severity: "high",
    docTypes: ["marketing_copy", "product_description"],
    patterns: [/保本保收益/iu, /稳赚不赔/iu, /无风险/iu, /100%通过/iu, /秒批/iu, /稳赚/iu],
    negationPrefixes: ["不承诺", "不保证", "并非", "并不", "不得", "禁止"],
    explanation: "金融营销文案中出现收益或审批结果的绝对化承诺，容易构成误导性宣传。",
    rewriteSuggestion: "改为说明收益并非保证实现，审批结果取决于资质审核，并补充主要风险提示。"
  },
  {
    id: "missing-fee-disclosure",
    title: "费用、利率或风险披露不足",
    issueType: "insufficient_disclosure",
    severity: "high",
    docTypes: ["marketing_copy", "product_description", "user_agreement"],
    patterns: [/低息/iu, /超低费率/iu, /极速到账/iu, /日息/iu, /月费率/iu],
    missingSignals: ["年化", "综合成本", "服务费", "罚息", "风险提示"],
    explanation: "文案强调低门槛或低成本，但未同步说明真实成本、限制条件或风险。",
    rewriteSuggestion: "补充年化成本口径、费用构成、违约后果、适用条件及核心风险揭示。"
  },
  {
    id: "default-consent",
    title: "授权同意存在捆绑或默认勾选风险",
    issueType: "invalid_consent",
    severity: "high",
    docTypes: ["privacy_policy", "user_agreement"],
    patterns: [/默认同意/iu, /视为同意/iu, /一经登录即同意/iu, /勾选即表示同意全部授权/iu],
    explanation: "涉及个人信息处理的授权应充分告知并取得真实、自愿、明确的同意。",
    rewriteSuggestion: "将核心授权拆分展示，对敏感信息单独征得同意，并提供拒绝后的影响说明。"
  },
  {
    id: "over-collection",
    title: "个人信息收集范围可能超出必要限度",
    issueType: "privacy_overcollection",
    severity: "medium",
    docTypes: ["privacy_policy", "user_agreement", "product_description"],
    patterns: [/通讯录/iu, /相册/iu, /精准定位/iu, /通话记录/iu, /剪贴板/iu],
    explanation: "文本涉及高敏感权限或与基础金融服务弱相关的数据字段，存在过度收集风险。",
    rewriteSuggestion: "说明每一项权限与金融服务功能之间的必要联系，并为非必要权限提供拒绝选项。"
  },
  {
    id: "unfair-exemption",
    title: "格式条款疑似过度免责或单方扩权",
    issueType: "unfair_terms",
    severity: "high",
    docTypes: ["user_agreement", "privacy_policy"],
    patterns: [/最终解释权归本平台所有/iu, /本平台不承担任何责任/iu, /有权随时单方修改/iu, /用户自行承担全部损失/iu],
    explanation: "平台通过格式条款过度免除自身责任或扩大单方权利，可能损害金融消费者合法权益。",
    rewriteSuggestion: "保留必要的责任边界，同时增加变更通知、用户救济和争议解决机制。"
  },
  {
    id: "missing-suitability",
    title: "未体现产品适当性和风险承受能力提示",
    issueType: "insufficient_disclosure",
    severity: "medium",
    docTypes: ["marketing_copy", "product_description"],
    patterns: [/理财/iu, /基金/iu, /投资/iu, /收益/iu],
    missingSignals: ["风险承受能力", "适当性", "产品风险等级"],
    explanation: "金融产品宣传如果缺少适当性提示，容易弱化消费者对风险和适用对象的理解。",
    rewriteSuggestion: "补充产品风险等级、适用客群和投资者风险承受能力要求。"
  }
];
