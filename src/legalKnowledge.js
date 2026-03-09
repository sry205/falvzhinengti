export const legalKnowledge = [
  {
    id: "pipl-consent",
    lawTitle: "《中华人民共和国个人信息保护法》",
    article: "第十三条、第二十九条",
    issueType: "invalid_consent",
    keywords: ["同意", "授权", "默认", "勾选", "个人信息", "敏感个人信息"],
    summary: "处理个人信息应具备合法基础，涉及敏感个人信息时需要充分告知并取得单独同意。",
    guidance: "避免默认勾选或一次性捆绑授权，单独说明收集目的、方式、范围和必要性。"
  },
  {
    id: "pipl-minimum",
    lawTitle: "《中华人民共和国个人信息保护法》",
    article: "第六条、第十九条",
    issueType: "privacy_overcollection",
    keywords: ["收集", "必要", "手机号", "通讯录", "定位", "相册", "设备信息"],
    summary: "个人信息处理应当具有明确、合理的目的，并限于实现处理目的的最小范围。",
    guidance: "只收集完成金融服务所必需的信息，并对额外权限说明必要性与拒绝影响。"
  },
  {
    id: "consumer-disclosure",
    lawTitle: "《中华人民共和国消费者权益保护法》",
    article: "第八条、第二十条",
    issueType: "insufficient_disclosure",
    keywords: ["费用", "利率", "风险", "期限", "罚息", "服务内容", "真实"],
    summary: "经营者应真实、全面向消费者提供商品或者服务信息，不得作引人误解的说明。",
    guidance: "在核心展示区域清楚写明费用、风险、期限、适用条件和限制条款。"
  },
  {
    id: "advertising-misleading",
    lawTitle: "《中华人民共和国广告法》",
    article: "第四条、第二十八条",
    issueType: "misleading_marketing",
    keywords: ["保本", "稳赚", "无风险", "最高收益", "秒批", "100%", "绝对化"],
    summary: "广告不得含有虚假或者引人误解的内容，不得欺骗、误导消费者。",
    guidance: "删除绝对化、收益承诺式表达，改为条件明确、风险揭示充分的表述。"
  },
  {
    id: "consumer-fairness",
    lawTitle: "《中华人民共和国消费者权益保护法》",
    article: "第二十六条",
    issueType: "unfair_terms",
    keywords: ["免责", "最终解释权", "不承担责任", "单方修改", "全部损失"],
    summary: "经营者不得以格式条款排除或者限制消费者权利、减轻或者免除自身责任。",
    guidance: "删除一刀切免责和单方扩权条款，明确双方权利义务与救济路径。"
  },
  {
    id: "financial-consumer",
    lawTitle: "金融消费者权益保护相关监管要求",
    article: "信息披露、适当性、营销宣传原则",
    issueType: "insufficient_disclosure",
    keywords: ["适当性", "风险评级", "金融消费者", "风险承受能力", "宣传"],
    summary: "金融机构应充分披露产品风险、收益不确定性与适用对象，避免误导销售。",
    guidance: "针对金融产品增加风险等级、适当性提示、收益不确定性和适用客群说明。"
  }
];
