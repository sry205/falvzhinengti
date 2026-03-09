const auditForm = document.querySelector("#audit-form");
const followupForm = document.querySelector("#followup-form");
const statusText = document.querySelector("#status-text");
const summaryPanel = document.querySelector("#summary-panel");
const riskList = document.querySelector("#risk-list");
const chatLog = document.querySelector("#chat-log");
const submitButton = document.querySelector("#submit-button");

let currentAuditId = null;

function riskLabel(value) {
  if (value === "high") return "高风险";
  if (value === "medium") return "中风险";
  if (value === "low") return "低风险";
  return "未开始";
}

function escapeHtml(text) {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function renderRiskItems(items) {
  if (!items.length) {
    riskList.innerHTML = '<div class="empty-state">未命中明确规则，建议继续人工复核关键条款。</div>';
    return;
  }

  riskList.innerHTML = items
    .map((item) => {
      const legalBasisHtml = item.legal_basis
        .map(
          (basis) => `
            <li>
              <strong>${escapeHtml(basis.law_title)} ${escapeHtml(basis.article)}</strong>
              <span>${escapeHtml(basis.summary)}</span>
            </li>
          `
        )
        .join("");

      return `
        <article class="risk-item ${item.severity}">
          <div class="risk-head">
            <span class="risk-badge ${item.severity}">${riskLabel(item.severity)}</span>
            <h3>${escapeHtml(item.title)}</h3>
          </div>
          <p class="excerpt">命中文本：${escapeHtml(item.excerpt)}</p>
          <p>${escapeHtml(item.explanation)}</p>
          <div class="subsection">
            <h4>法律依据</h4>
            <ul class="basis-list">${legalBasisHtml}</ul>
          </div>
          <div class="subsection">
            <h4>修改建议</h4>
            <p>${escapeHtml(item.rewrite_suggestion)}</p>
          </div>
        </article>
      `;
    })
    .join("");
}

function appendChatBubble(role, text, citedBases = []) {
  const wrapper = document.createElement("div");
  wrapper.className = `chat-bubble ${role}`;
  wrapper.innerHTML = `
    <span class="chat-role">${role === "user" ? "你" : "智能体"}</span>
    <p>${escapeHtml(text)}</p>
    ${
      citedBases.length
        ? `<div class="chat-citations">${citedBases.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`
        : ""
    }
  `;
  chatLog.prepend(wrapper);
}

auditForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  submitButton.disabled = true;
  submitButton.textContent = "审查中...";
  statusText.textContent = "系统正在做规则匹配与法规检索。";

  const payload = {
    doc_type: document.querySelector("#doc-type").value,
    scenario: document.querySelector("#scenario").value,
    content: document.querySelector("#content").value
  };

  try {
    const response = await fetch("/audit/text", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "审查失败");
    }

    currentAuditId = data.audit_id || data.auditId;
    statusText.textContent = "已完成审查，可以继续追问。";
    summaryPanel.className = `summary-panel ${data.overall_risk}`;
    summaryPanel.innerHTML = `
      <span class="risk-badge ${data.overall_risk}">${riskLabel(data.overall_risk)}</span>
      <p>${escapeHtml(data.summary)}</p>
    `;
    renderRiskItems(data.risk_items);
    appendChatBubble("assistant", `已完成审查：${data.summary}`);
  } catch (error) {
    statusText.textContent = "审查失败。";
    summaryPanel.className = "summary-panel empty";
    summaryPanel.innerHTML = `<span class="risk-badge neutral">失败</span><p>${escapeHtml(error.message)}</p>`;
    riskList.innerHTML = "";
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "开始审查";
  }
});

followupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const questionInput = document.querySelector("#followup-question");
  const question = questionInput.value.trim();

  if (!question) {
    return;
  }

  appendChatBubble("user", question);
  questionInput.value = "";

  if (!currentAuditId) {
    appendChatBubble("assistant", "请先完成一次文本审查，再基于结果继续追问。");
    return;
  }

  try {
    const response = await fetch("/chat/followup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        auditId: currentAuditId,
        audit_id: currentAuditId,
        question
      })
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "追问失败");
    }

    appendChatBubble("assistant", data.answer, data.cited_bases);
  } catch (error) {
    appendChatBubble("assistant", error.message);
  }
});
