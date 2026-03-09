import assert from "node:assert/strict";
import { auditText, answerFollowup } from "../src/auditEngine.js";
import { startServer } from "../server.js";

function run(name, fn) {
  try {
    const result = fn();

    if (result && typeof result.then === "function") {
      return result
        .then(() => {
          console.log(`PASS ${name}`);
        })
        .catch((error) => {
          console.error(`FAIL ${name}`);
          console.error(error.stack);
          process.exitCode = 1;
        });
    }

    console.log(`PASS ${name}`);
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack);
    process.exitCode = 1;
  }
}

const pending = [];

pending.push(run("flags misleading marketing and overbroad consent", () => {
  const result = auditText({
    doc_type: "marketing_copy",
    scenario: "消费贷拉新",
    content:
      "本平台贷款秒批，稳赚无风险，最低日息万二。勾选后即表示同意我们收集定位、通讯录、相册等全部信息。"
  });

  assert.equal(result.overall_risk, "high");
  assert.ok(result.risk_items.some((item) => item.issue_type === "misleading_marketing"));
}));

pending.push(run("returns low risk for balanced disclosure", () => {
  const result = auditText({
    doc_type: "product_description",
    scenario: "基金代销说明",
    content:
      "产品收益存在波动，不承诺保本保收益。投资前请阅读风险揭示书，确认自身风险承受能力与产品风险等级匹配。相关费用、申购赎回规则和适用条件以正式合同为准。"
  });

  assert.equal(result.overall_risk, "low");
  assert.equal(result.risk_items.length, 0);
}));

pending.push(run("followup cites legal bases", () => {
  const audit = auditText({
    doc_type: "user_agreement",
    content: "最终解释权归本平台所有，本平台不承担任何责任，用户自行承担全部损失。",
    scenario: "支付开户协议"
  });

  const answer = answerFollowup({
    audit,
    question: "为什么这个条款有风险？"
  });

  assert.ok(answer.answer.includes("强调"));
  assert.ok(answer.cited_bases.length > 0);
}));

pending.push(run("end-to-end audit and followup endpoints", async () => {
  const server = await startServer(0);

  try {
    const address = server.address();
    assert.ok(address && typeof address === "object");
    const baseUrl = `http://127.0.0.1:${address.port}`;

    const auditResponse = await fetch(`${baseUrl}/audit/text`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        doc_type: "user_agreement",
        scenario: "支付开户协议",
        content: "最终解释权归本平台所有，本平台不承担任何责任，用户自行承担全部损失。"
      })
    });
    const audit = await auditResponse.json();

    assert.equal(auditResponse.status, 200);
    assert.equal(audit.overall_risk, "high");
    assert.ok(audit.risk_items.some((item) => item.issue_type === "unfair_terms"));

    const followupResponse = await fetch(`${baseUrl}/chat/followup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        audit_id: audit.audit_id,
        question: "为什么有风险？"
      })
    });
    const followup = await followupResponse.json();

    assert.equal(followupResponse.status, 200);
    assert.ok(followup.answer.includes("强调"));
    assert.ok(followup.cited_bases.length > 0);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }
}));

await Promise.all(pending.filter(Boolean));
