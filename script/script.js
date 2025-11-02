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

let history = []; // 履歴を管理する配列
const maxHistoryLength = 10; // 最大履歴数

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

  const bundleCount = bundleInput ? (parseInt(bundleInput.value) || 0) * 50 : 0;
  const manualCount = manualInput ? (parseInt(manualInput.value) || 0) : 0;

  const totalQuantity = bundleCount + manualCount;
  const totalValue = totalQuantity * denominations[index].value;

  totalQuantityElement.textContent = totalQuantity;
  totalValueElement.textContent = totalValue;

  updateGrandTotal();
}

function updateGrandTotal() {
  let grandTotal = 0;
  denominations.forEach((_, index) => {
    const total = parseInt(document.getElementById(`total-${index}`).textContent) || 0;
    grandTotal += total;
  });
  document.getElementById("grandTotal").textContent = grandTotal;
}

function resetForm() {
  // 現在の総合計を履歴に追加
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
}

function addToHistory(grandTotal) {
  // 履歴配列に追加
  history.push(`総合計: ${grandTotal} 円`);

  // 最大履歴数を超えた場合、古い履歴を削除
  if (history.length > maxHistoryLength) {
    history.shift();
  }

  // 履歴を更新表示
  updateHistoryDisplay();
}

function updateHistoryDisplay() {
  const historyList = document.getElementById("historyList");
  historyList.innerHTML = ""; // 現在の履歴をクリア
  history.forEach((item) => {
    const listItem = document.createElement("li");
    listItem.textContent = item;
    historyList.appendChild(listItem);
  });
}

// 金額の表示整形（3桁区切り）
function formatYen(n) {
  return (Number(n) || 0).toLocaleString("ja-JP");
}

// テキスト生成本体
function getSummaryText() {
  const lines = [];
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mm = String(now.getMinutes()).padStart(2, "0");

  lines.push("【ドロアー君 集計結果】");
  lines.push(`日時: ${y}-${m}-${d} ${hh}:${mm}`);
  lines.push("");

  // 各金種
  denominations.forEach((denom, index) => {
    const qty = parseInt(document.getElementById(`total-quantity-${index}`).textContent) || 0;
    const amount = parseInt(document.getElementById(`total-${index}`).textContent) || 0;
    // 例: 100円: 12枚／1,200円
    lines.push(`${denom.name}: ${qty}枚／${formatYen(amount)}円`);
  });

  lines.push("");
  const grand = parseInt(document.getElementById("grandTotal").textContent) || 0;
  lines.push(`総合計: ${formatYen(grand)}円`);

  return lines.join("\n");
}

// クリップボードへコピー
function exportSummary() {
  const text = getSummaryText();
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => alert("テキストをコピーしました。"))
      .catch(() => fallbackCopy(text));
  } else {
    fallbackCopy(text);
  }
}

// クリップボードAPI非対応時のフォールバック
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  document.body.appendChild(ta);
  ta.select();
  document.execCommand("copy");
  document.body.removeChild(ta);
  alert("テキストをコピーしました。");
}

// .txt でダウンロード
function downloadSummary() {
  const text = getSummaryText();
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0,10); // YYYY-MM-DD
  a.href = url;
  a.download = `drawer-kun-${date}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}


