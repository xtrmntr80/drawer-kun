const denominations = [
  { name: "10,000円", value: 10000, hasBundle: false },
  { name: "5,000円", value: 5000, hasBundle: false },
  { name: "2,000円", value: 2000, hasBundle: false },
  { name: "1,000円", value: 1000, hasBundle: false },
  { name: "500円", value: 500, hasBundle: true },
  { name: "100円", value: 100, hasBundle: true },
  { name: "50円", value: 50, hasBundle: true },
  { name: "10円", value: 10, hasBundle: true },
  { name: "5円", value: 5, hasBundle: true },
  { name: "1円", value: 1, hasBundle: true },
];

let history = [];
const maxHistoryLength = 10;

const coinTable = document.getElementById("coinTable");
denominations.forEach((denomination, index) => {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><span class="denomination-name">${denomination.name}</span></td>
    <td>${denomination.hasBundle ? `<input type="number" id="bundle-${index}" min="0" value="0" onchange="calculateRow(${index})" />` : ""}</td>
    <td><input type="number" id="manual-${index}" min="0" value="0" onchange="calculateRow(${index})" /></td>
    <td id="total-quantity-${index}">0</td>
    <td id="total-${index}">0</td>
  `;
  coinTable.appendChild(row);
});

function calculateRow(index) {
  const bundleInput = document.getElementById(`bundle-${index}`);
  const manualInput = document.getElementById(`manual-${index}`);
  const totalQuantityElement = document.getElementById(`total-quantity-${index}`);
  const totalValueElement = document.getElementById(`total-${index}`);
  const bundleCount = bundleInput ? (parseInt(bundleInput.value, 10) || 0) * 50 : 0;
  const manualCount = manualInput ? (parseInt(manualInput.value, 10) || 0) : 0;
  const totalQuantity = bundleCount + manualCount;
  const totalValue = totalQuantity * denominations[index].value;
  totalQuantityElement.textContent = totalQuantity;
  totalValueElement.textContent = totalValue;
  updateGrandTotal();
}

function updateGrandTotal() {
  let grandTotal = 0;
  denominations.forEach((_, index) => {
    const total = parseInt(document.getElementById(`total-${index}`).textContent, 10) || 0;
    grandTotal += total;
  });
  document.getElementById("grandTotal").textContent = grandTotal;
}

function resetForm() {
  const grandTotal = document.getElementById("grandTotal").textContent;
  addToHistory(grandTotal);
  denominations.forEach((_, index) => {
    const bundleInput = document.getElementById(`bundle-${index}`);
    const manualInput = document.getElementById(`manual-${index}`);
    document.getElementById(`total-quantity-${index}`).textContent = "0";
    document.getElementById(`total-${index}`).textContent = "0";
    if (bundleInput) bundleInput.value = "0";
    if (manualInput) manualInput.value = "0";
  });
  document.getElementById("grandTotal").textContent = "0";
  // 次の実査に前回の異常記録が混ざらないよう、差異情報だけ初期化する
  const status = document.getElementById("differenceStatus");
  const note = document.getElementById("differenceNote");
  if (status) status.value = "normal";
  if (note) note.value = "";
  updateDifferenceFields();
}

function addToHistory(grandTotal) {
  history.push(`総合計: ${grandTotal} 円`);
  if (history.length > maxHistoryLength) history.shift();
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = "";
  history.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    historyList.appendChild(listItem);
  });
}

function formatYen(n) {
  return (Number(n) || 0).toLocaleString("ja-JP");
}

function getLocalDateTimeString(date = new Date()) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function getCheckDateTime() {
  return document.getElementById("checkDateTime")?.value || getLocalDateTimeString();
}

function getSelectedRegister() {
  return document.getElementById("registerName")?.value || "";
}

function requireRegister() {
  const register = getSelectedRegister();
  if (register) return true;
  alert("チェック対象のレジを選択してください。");
  document.getElementById("registerName")?.focus();
  return false;
}

// ファイル検索専用の単語。理由文の日本語と衝突しないよう英数字を使用する。
// DKALERT = 全過不足、DKPLUS = 過剰、DKMINUS = 不足
const DIFFERENCE_TYPES = {
  normal: { label: "正常", tag: "" },
  excess: { label: "過剰", tag: "DKPLUS" },
  shortage: { label: "不足", tag: "DKMINUS" },
};

function getDifference() {
  const key = document.getElementById("differenceStatus")?.value || "normal";
  const type = DIFFERENCE_TYPES[key] ? key : "normal";
  const note = document.getElementById("differenceNote")?.value.trim() || "";
  return { key: type, ...DIFFERENCE_TYPES[type], note };
}

function updateDifferenceFields() {
  const isNormal = getDifference().key === "normal";
  const details = document.getElementById("differenceDetails");
  if (details) details.hidden = isNormal;
}

// 検索を覚えなくてよいように、対象のファイル名に付く専用タグをコピーする。
// 理由文に「過剰」「不足」と書かれていても、ファイル名の専用タグで識別できる。
const DIFFERENCE_SEARCH_TAGS = Object.freeze({
  shortage: "DKMINUS",
  excess: "DKPLUS",
  all: "DKALERT",
});

async function copyDifferenceSearchTag(kind) {
  const tag = DIFFERENCE_SEARCH_TAGS[kind];
  if (!tag) return;
  const message = document.getElementById("differenceSearchFeedback");
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(tag);
    } else {
      const field = document.createElement("textarea");
      field.value = tag;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand("copy");
      field.remove();
      if (!ok) throw new Error("コピーに失敗しました");
    }
    if (message) message.textContent = `「${tag}」をコピーしました。保存先フォルダの検索欄に貼り付けてください。`;
  } catch (error) {
    if (message) message.textContent = `コピーできませんでした。検索欄に「${tag}」を入力してください。`;
  }
}

function validateBeforeExport() {
  return requireRegister();
}

// 保存・コピー時の共通テキストを生成する
function getSummaryText() {
  const lines = [];
  const dt = getCheckDateTime().replace("T", " ");
  const checker = document.getElementById("checkerName")?.value.trim() || "(未入力)";
  const register = getSelectedRegister();
  const difference = getDifference();

  lines.push("【ドロアー君 集計結果】");
  lines.push(`チェック日時: ${dt}`);
  lines.push(`チェック者: ${checker}`);
  lines.push(`チェック対象: ${register}`);
  lines.push(`実査結果: ${difference.label}`);
  if (difference.tag) {
    lines.push(`検索タグ（過不足共通）: DKALERT`);
    lines.push(`検索タグ（種別）: ${difference.tag}`);
    if (difference.note) {
      lines.push("理由・状況:");
      lines.push(difference.note);
    }
  }
  lines.push("");

  denominations.forEach((denom, index) => {
    const qty = parseInt(document.getElementById(`total-quantity-${index}`).textContent, 10) || 0;
    const amount = parseInt(document.getElementById(`total-${index}`).textContent, 10) || 0;
    lines.push(`${denom.name}: ${qty}枚／${formatYen(amount)}円`);
  });

  lines.push("");
  const grand = parseInt(document.getElementById("grandTotal").textContent, 10) || 0;
  lines.push(`総合計: ${formatYen(grand)}円`);
  return lines.join("\n");
}

function exportSummary() {
  if (!validateBeforeExport()) return;
  const text = getSummaryText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert("テキストをコピーしました。"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  const success = document.execCommand("copy");
  document.body.removeChild(ta);
  alert(success ? "テキストをコピーしました。" : "コピーできませんでした。手動でコピーしてください。");
}

function downloadSummary() {
  if (!validateBeforeExport()) return;
  const text = getSummaryText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  // 日付＋時刻で同日・同レジの複数回実査でも区別しやすくする
  const dateTime = getCheckDateTime();
  const date = dateTime.slice(0, 10);
  const time = dateTime.slice(11, 16).replace(":", "");
  const register = getSelectedRegister().replace(/[\\/:*?"<>|\x00-\x1F]/g, "_");
  const tag = getDifference().tag;
  a.href = url;
  a.download = `drawer-kun-${date}-${time}-${register}${tag ? `-DKALERT-${tag}` : ""}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // ダウンロード開始後にURLを解放
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function initCheckMeta() {
  const dt = document.getElementById("checkDateTime");
  const nm = document.getElementById("checkerName");
  const reg = document.getElementById("registerName");
  if (!dt || !nm || !reg) return;

  try {
    const savedName = localStorage.getItem("drawerKunCheckerName");
    if (savedName) nm.value = savedName;
  } catch (e) {
    // ストレージが利用できない場合も実査は可能
  }
  if (!dt.value) dt.value = getLocalDateTimeString();
  nm.addEventListener("change", () => {
    try { localStorage.setItem("drawerKunCheckerName", nm.value.trim()); } catch (e) { /* 保存不可なら無視 */ }
  });
  // レジは誤入力防止のため起動ごとに必ず選択する
  updateDifferenceFields();
}
window.addEventListener("DOMContentLoaded", initCheckMeta);
