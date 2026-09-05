/**
 * MITB 人格测试 - 应用逻辑（IPIP 大五人格版）
 *
 * 计分方式: 5 点 Likert 量表，反向题反转计分
 * 维度模型: OCEAN 大五人格
 */

// ===== 状态管理 =====
let currentQuestionIndex = 0;
let answers = new Array(70).fill(null); // null = 未回答, 1-5 = Likert 值
let isAdvancing = false; // 防止快速点击导致跳题的标志
let isPaused = false; // 暂停状态
let timerInterval = null; // 计时器定时器
let questionTimes = new Array(70).fill(0); // 每题作答时间 (毫秒)
let quizStartTime = null; // 测试开始时间
let questionStartTime = null; // 当前题开始时间
let totalElapsed = 0; // 总用时 (毫秒)
let pauseTime = 0; // 暂停时的时间戳
const STORAGE_KEY = 'mitb_quiz_progress';

// ===== 开发者模式 =====
let devModeEnabled = false; // 双击标题后开启

// ===== AI 生成控制 =====
let currentAbortController = null; // 当前AI生成的中断控制器

// ===== 本地存储 =====
function saveProgress() {
  const data = {
    currentQuestionIndex,
    answers,
    questionTimes,
    quizStartTime,
    questionStartTime,
    totalElapsed,
    savedAt: Date.now()
  };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('保存进度失败:', e);
  }
}

function loadProgress() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      currentQuestionIndex = parsed.currentQuestionIndex || 0;
      answers = parsed.answers || new Array(70).fill(null);
      questionTimes = parsed.questionTimes || new Array(70).fill(0);
      quizStartTime = parsed.quizStartTime || null;
      questionStartTime = parsed.questionStartTime || null;
      totalElapsed = parsed.totalElapsed || 0;
      return true;
    }
  } catch (e) {
    console.warn('加载进度失败:', e);
  }
  return false;
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('清除进度失败:', e);
  }
}

// ===== 页面切换 =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ===== 开发者模式 =====
function activateDevMode() {
  if (!devModeEnabled) return; // 未开启开发者模式则忽略

  // 随机生成答案 (1-5)
  for (let i = 0; i < 70; i++) {
    answers[i] = Math.floor(Math.random() * 5) + 1;
    questionTimes[i] = Math.floor(Math.random() * 3000) + 500; // 随机用时 0.5-3.5 秒
  }

  // 模拟总用时
  quizStartTime = Date.now() - 5000; // 模拟 5 秒前开始
  questionStartTime = Date.now();
  totalElapsed = 5000;

  // 跳到最后一题并显示结果
  currentQuestionIndex = 69;
  stopTimer();
  showResult();
}

// ===== 开始测试 =====
function startQuiz() {
  currentQuestionIndex = 0;
  answers = new Array(70).fill(null);
  questionTimes = new Array(70).fill(0);
  quizStartTime = Date.now();
  questionStartTime = Date.now();
  totalElapsed = 0;
  clearProgress();
  showPage('page-quiz');
  renderQuestion();
  startTimer(); // 启动计时器
}

// ===== 启动计时器 =====
function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    if (!isPaused) {
      updateTimerDisplay();
    }
  }, 1000);
}

// ===== 停止计时器 =====
function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

// ===== 渲染题目 =====
function renderQuestion() {
  const q = QUESTIONS[currentQuestionIndex];
  const dim = DIMENSIONS[q.dim];
  const selected = answers[currentQuestionIndex];

  document.getElementById('current-q').textContent = currentQuestionIndex + 1;
  document.getElementById('answered-count').textContent = answers.filter(a => a !== null).length;
  document.getElementById('progress-fill').style.width = ((currentQuestionIndex + 1) / 70 * 100) + '%';
  document.getElementById('q-dim-tag').textContent = dim.name + ' / ' + q.facet;
  document.getElementById('q-text').textContent = q.text;

  // 更新用时显示
  updateTimerDisplay();

  // 渲染 Likert 选项
  const optionsContainer = document.getElementById('q-options');
  let html = '<div class="likert-scale">';
  LIKERT_OPTIONS.forEach(opt => {
    const isSelected = selected === opt.value;
    html += `<div class="likert-option ${isSelected ? 'selected' : ''}" onclick="selectLikert(${opt.value})">
      <div class="likert-circle">${opt.short}</div>
      <span class="likert-label">${opt.label}</span>
    </div>`;
  });
  html += '</div>';

  // 反向题提示
  if (q.reverse) {
    html += '<div class="reverse-hint">提示: 此题为反向计分题，请根据实际情况作答即可。</div>';
  }

  optionsContainer.innerHTML = html;

  // 按钮状态
  document.getElementById('btn-prev').disabled = currentQuestionIndex === 0;
  const btnNext = document.getElementById('btn-next');
  if (currentQuestionIndex === 69) {
    btnNext.textContent = '查看结果';
  } else {
    btnNext.textContent = '下一题';
  }
}

// ===== 更新计时显示 =====
function updateTimerDisplay() {
  const timerEl = document.getElementById('quiz-timer');
  if (timerEl && quizStartTime) {
    const elapsed = Date.now() - quizStartTime;
    timerEl.textContent = formatTime(elapsed);
  }
}

// ===== 格式化时间 =====
function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  if (hours > 0) {
    return `${hours}时${minutes}分${seconds}秒`;
  }
  return `${minutes}分${seconds}秒`;
}

// ===== 选择 Likert 值 =====
function selectLikert(value) {
  // 防止快速点击导致跳题
  if (isAdvancing) return;
  isAdvancing = true;

  // 记录作答时间
  const now = Date.now();
  questionTimes[currentQuestionIndex] = now - questionStartTime;
  totalElapsed = now - quizStartTime;

  answers[currentQuestionIndex] = value;
  renderQuestion();
  saveProgress(); // 保存进度

  setTimeout(() => {
    if (currentQuestionIndex < 69) {
      currentQuestionIndex++;
      questionStartTime = Date.now(); // 记录新题开始时间
      renderQuestion();
    }
    isAdvancing = false;
  }, 300);
}

// ===== 上一题 =====
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    questionStartTime = Date.now(); // 重置计时
    renderQuestion();
  }
}

// ===== 下一题 / 查看结果 =====
function nextQuestion() {
  if (answers[currentQuestionIndex] === null) {
    return;
  }
  if (currentQuestionIndex < 69) {
    currentQuestionIndex++;
    renderQuestion();
  } else {
    const unanswered = answers.filter(a => a === null).length;
    if (unanswered > 0) {
      const firstUnanswered = answers.indexOf(null);
      currentQuestionIndex = firstUnanswered;
      renderQuestion();
      return;
    }
    showResult();
  }
}

// ===== 正态分布累积函数近似 (Abramowitz & Stegun) =====
function normalCDF(x, mean, sd) {
  const z = (x - mean) / sd;
  const t = 1 / (1 + 0.2316419 * Math.abs(z));
  const d = 0.3989423 * Math.exp(-z * z / 2);
  let p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  if (z > 0) p = 1 - p;
  return Math.max(0.01, Math.min(0.99, p));
}

// ===== 计算结果 =====
function calculateResult() {
  const dimScores = {};
  const dimDetails = {};

  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    dimScores[dimCode] = { total: 0, count: 0, items: [] };
  }

  // 计算每题得分 (反向题反转)
  QUESTIONS.forEach((q, i) => {
    if (answers[i] === null) return;
    let score = answers[i];
    if (q.reverse) {
      score = 6 - score; // 1->5, 2->4, 3->3, 4->2, 5->1
    }
    dimScores[q.dim].total += score;
    dimScores[q.dim].count++;
    dimScores[q.dim].items.push({ id: q.id, facet: q.facet, rawScore: answers[i], scoredScore: score, reverse: q.reverse, text: q.text });
  });

  // 计算每个维度的统计量
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const ds = dimScores[dimCode];
    const dimInfo = DIMENSIONS[dimCode];
    const avgScore = ds.count > 0 ? ds.total / ds.count : 3; // 平均分 (1-5)
    const totalScore = ds.total; // 总分 (14-70)
    const percentile = Math.round(normalCDF(totalScore, dimInfo.norm.mean, dimInfo.norm.sd) * 100);
    const level = percentile >= 66 ? 'high' : (percentile <= 33 ? 'low' : 'mid');

    dimDetails[dimCode] = {
      code: dimCode,
      name: dimInfo.name,
      fullName: dimInfo.fullName,
      desc: dimInfo.desc,
      totalScore: totalScore,
      maxScore: 70,
      avgScore: avgScore.toFixed(2),
      percentile: percentile,
      level: level,
      levelText: level === 'high' ? '高于常模' : (level === 'low' ? '低于常模' : '接近常模'),
      highDesc: dimInfo.highDesc,
      lowDesc: dimInfo.lowDesc,
      normMean: dimInfo.norm.mean,
      normSd: dimInfo.norm.sd,
      items: ds.items
    };
  }

  // 找出最突出的维度 (离常模均值最远)
  let dominantDim = 'O';
  let maxDeviation = 0;
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const d = dimDetails[dimCode];
    const deviation = Math.abs(d.totalScore - d.normMean);
    if (deviation > maxDeviation) {
      maxDeviation = deviation;
      dominantDim = dimCode;
    }
  }

  // 映射 MBTI 代号
  const mbti = getMBTIType(dimDetails);

  return { dimDetails, dominantDim, answers, scores: dimScores, mbti, questionTimes, totalElapsed };
}

// ===== 显示用时统计 =====
function displayTimeStats(totalElapsed, questionTimes) {
  const container = document.getElementById('time-stats');
  if (!container) return;

  const answeredCount = questionTimes.filter(t => t > 0).length;
  const avgTime = answeredCount > 0 ? Math.round(questionTimes.reduce((a, b) => a + b, 0) / answeredCount / 1000) : 0;

  container.innerHTML = `
    <div class="time-stats-card">
      <div class="time-stat">
        <span class="time-label">总用时</span>
        <span class="time-value">${formatTime(totalElapsed)}</span>
      </div>
      <div class="time-stat">
        <span class="time-label">已答题数</span>
        <span class="time-value">${answeredCount} / 70</span>
      </div>
      <div class="time-stat">
        <span class="time-label">平均每题用时</span>
        <span class="time-value">${avgTime}秒</span>
      </div>
    </div>
  `;
}

// ===== 显示答题回顾 =====
function displayReview(answers, questionTimes) {
  const container = document.getElementById('review-content');
  if (!container) return;

  let html = '<div class="review-list">';
  QUESTIONS.forEach((q, i) => {
    const answer = answers[i];
    const time = questionTimes[i];
    const dim = DIMENSIONS[q.dim];
    const isAnswered = answer !== null;
    const scored = q.reverse && isAnswered ? (6 - answer) : answer;

    html += `<div class="review-item ${isAnswered ? 'answered' : 'unanswered'}">
      <div class="review-header">
        <span class="review-q-num">第${i + 1}题</span>
        <span class="review-dim">${dim.name} / ${q.facet}</span>
        <span class="review-time">${time > 0 ? (time / 1000).toFixed(1) + '秒' : '未计时'}</span>
      </div>
      <div class="review-question">${q.text}${q.reverse ? ' (反向题)' : ''}</div>
      <div class="review-answer">
        ${isAnswered ? `你的回答: <strong>${LIKERT_OPTIONS[answer - 1].label}</strong> (计分: ${scored}分)` : '<span class="no-answer">未作答</span>'}
      </div>
    </div>`;
  });
  html += '</div>';
  container.innerHTML = html;
}

// ===== 渲染维度得分 =====
function renderDimensionScores(dimDetails) {
  const container = document.getElementById('dim-scores');
  const dimOrder = ['O', 'C', 'E', 'A', 'N'];
  const colors = { O: '#9b59b6', C: '#3498db', E: '#f39c12', A: '#2ecc71', N: '#e74c3c' };
  let html = '';
  for (const dimCode of dimOrder) {
    const d = dimDetails[dimCode];
    const pct = d.percentile;
    const barWidth = pct;
    const color = colors[dimCode];
    html += `
      <div class="dim-score-row">
        <div class="dim-score-label">
          <span class="dim-code" style="background:${color};">${dimCode}</span>
          <span class="dim-name">${d.name}</span>
        </div>
        <div class="dim-score-bar-bg">
          <div class="dim-score-bar-fill" style="width:${barWidth}%;background:${color};"></div>
        </div>
        <div class="dim-score-value">
          <span class="dim-score-num">${d.totalScore}/${d.maxScore}</span>
          <span class="dim-score-pct">${pct}%</span>
        </div>
      </div>
    `;
  }
  container.innerHTML = html;
}

// ===== 切换答题回顾 =====
function toggleReview() {
  const content = document.getElementById('review-content');
  const arrow = document.getElementById('review-arrow');
  if (content.style.display === 'none') {
    content.style.display = 'block';
    arrow.textContent = '▲';
  } else {
    content.style.display = 'none';
    arrow.textContent = '▼';
  }
}

// ===== 显示结算界面 =====
function showResult() {
  const result = calculateResult();

  // 显示 MBTI 代号
  document.getElementById('type-code').textContent = result.mbti.code;
  document.getElementById('type-name').textContent = result.mbti.name;

  // 生成人格画像摘要
  let profileHtml = `<p style="margin-bottom:12px;"><strong style="color:var(--primary-light);">MBTI 映射: ${result.mbti.code} - ${result.mbti.name}</strong><br>${result.mbti.desc}</p>`;
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const d = result.dimDetails[dimCode];
    const profileKey = d.level === 'high' ? 'high_' + dimCode : 'low_' + dimCode;
    profileHtml += `<p><strong>${d.name} ${d.level === 'high' ? '(高)' : (d.level === 'low' ? '(低)' : '(中)')}</strong>: ${PERSONALITY_PROFILES[profileKey] || d.desc}</p>`;
  }
  document.getElementById('type-desc').innerHTML = profileHtml;

  // 渲染维度得分
  renderDimensionScores(result.dimDetails);

  // 显示用时统计
  displayTimeStats(result.totalElapsed, result.questionTimes);

  // 显示答题回顾
  displayReview(result.answers, result.questionTimes);

  // 重置报告区域
  document.getElementById('report-section').innerHTML = '';
  document.getElementById('api-hint').classList.add('no-api');
  document.getElementById('api-hint').textContent = '尚未配置 API，无法生成分析报告。请填写以下信息后点击"生成分析报告"。';

  // 清除进度
  clearProgress();

  showPage('page-result');
}

// ===== 厂商/模型下拉列表 =====
function toggleProviderList(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('provider-dropdown');
  const modelDropdown = document.getElementById('model-dropdown');
  modelDropdown.style.display = 'none';

  if (dropdown.style.display === 'none') {
    dropdown.innerHTML = PROVIDERS.map((p, i) =>
      `<div class="dropdown-item" onclick="selectProvider(${i})">
        <span class="dropdown-item-name">${p.name}</span>
        <span class="dropdown-item-url">${p.url}</span>
      </div>`
    ).join('');
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

function selectProvider(index) {
  const p = PROVIDERS[index];
  document.getElementById('api-url').value = p.url;
  document.getElementById('provider-dropdown').style.display = 'none';

  // 同时刷新模型列表
  const modelDropdown = document.getElementById('model-dropdown');
  modelDropdown.innerHTML = p.models.map(m =>
    `<div class="dropdown-item" onclick="selectModel('${m}')">
      <span class="dropdown-item-name">${m}</span>
    </div>`
  ).join('');
  // 自动填充第一个模型
  document.getElementById('api-model').value = p.models[0];
}

function toggleModelList(event) {
  event.stopPropagation();
  const dropdown = document.getElementById('model-dropdown');
  const providerDropdown = document.getElementById('provider-dropdown');
  providerDropdown.style.display = 'none';

  if (dropdown.style.display === 'none') {
    // 如果已填了 URL，尝试匹配厂商；否则展示所有模型
    const currentUrl = document.getElementById('api-url').value.trim();
    const matched = PROVIDERS.find(p => p.url === currentUrl);
    let models;
    if (matched) {
      models = matched.models.map(m => ({ name: m, provider: matched.name }));
    } else {
      models = PROVIDERS.flatMap(p => p.models.map(m => ({ name: m, provider: p.name })));
    }
    dropdown.innerHTML = models.map(m =>
      `<div class="dropdown-item" onclick="selectModel('${m.name}')">
        <span class="dropdown-item-name">${m.name}</span>
        <span class="dropdown-item-url">${m.provider}</span>
      </div>`
    ).join('');
    dropdown.style.display = 'block';
  } else {
    dropdown.style.display = 'none';
  }
}

function selectModel(modelName) {
  document.getElementById('api-model').value = modelName;
  document.getElementById('model-dropdown').style.display = 'none';
}

// 点击页面其他位置关闭下拉
document.addEventListener('click', () => {
  document.getElementById('provider-dropdown').style.display = 'none';
  document.getElementById('model-dropdown').style.display = 'none';
});

// ===== 停止 AI 生成 =====
function stopGenerate() {
  if (currentAbortController) {
    currentAbortController.abort();
    currentAbortController = null;
  }
}

// ===== 生成 AI 分析报告 =====
async function generateReport() {
  const apiUrl = document.getElementById('api-url').value.trim();
  const apiModel = document.getElementById('api-model').value.trim();
  const apiKey = document.getElementById('api-key').value.trim();

  if (!apiUrl || !apiModel) {
    const hint = document.getElementById('api-hint');
    hint.classList.add('no-api');
    hint.textContent = '请填写 API URL 和模型名称后重试。未配置 API 无法生成分析报告。';
    return;
  }

  const hint = document.getElementById('api-hint');
  hint.classList.remove('no-api');
  hint.textContent = 'API 已配置，正在生成报告...';

  const reportSection = document.getElementById('report-section');
  const resultActions = document.querySelector('.result-actions');
  
  reportSection.innerHTML = `
    <div class="report-streaming">
      <div class="streaming-header">
        <div class="spinner spinner-sm"></div>
        <span>AI 正在分析你的答题数据，文字实时生成中...</span>
      </div>
      <div class="streaming-progress" id="streaming-progress">
        <span class="progress-item">Token消耗: <strong id="generated-tokens">0</strong></span>
        <span class="progress-item">预计剩余: <strong id="estimated-time">计算中...</strong></span>
      </div>
      <div class="streaming-text" id="streaming-text"></div>
    </div>
  `;

  // 在操作按钮区域添加"停止生成"按钮
  const stopBtn = document.createElement('button');
  stopBtn.className = 'btn btn-stop';
  stopBtn.id = 'btn-stop-generate';
  stopBtn.textContent = '停止生成';
  stopBtn.onclick = stopGenerate;
  
  // 隐藏其他按钮，只显示停止按钮
  const originalButtons = Array.from(resultActions.children);
  originalButtons.forEach(btn => btn.style.display = 'none');
  resultActions.appendChild(stopBtn);

  const btnAnalyze = document.getElementById('btn-analyze');
  btnAnalyze.disabled = true;
  btnAnalyze.textContent = '分析中...';

  // 创建新的中断控制器
  currentAbortController = new AbortController();

  // 进度追踪
  const startTime = Date.now();
  let lastUpdateChars = 0;
  let lastUpdateTime = startTime;
  let speed = 0; // 字符/秒
  let finalUsage = null; // 最终 token 消耗

  try {
    const result = calculateResult();
    let fullText = ''; // 最终报告正文（不含思考过程）
    let displayText = ''; // 流式显示文本（含思考过程）
    await callAIApiStream(apiUrl, apiModel, apiKey, result, (chunk, isReasoning, usage) => {
      // 处理实际 token 消耗
      if (usage) {
        finalUsage = usage;
        const tokensEl = document.getElementById('generated-tokens');
        if (tokensEl) tokensEl.textContent = usage.completion_tokens || usage.total_tokens || 0;
        const timeEl = document.getElementById('estimated-time');
        if (timeEl) timeEl.textContent = '已完成';
        return;
      }

      if (isReasoning) {
        // 思考过程只显示不保存
        displayText += chunk;
      } else {
        // 正文内容既显示又保存
        fullText += chunk;
        displayText += chunk;
      }
      const el = document.getElementById('streaming-text');
      if (el) {
        el.innerHTML = markdownToHtml(displayText) + '<span class="streaming-cursor"></span>';
        el.parentElement.scrollTop = el.parentElement.scrollHeight;
      }

      // 更新进度显示
      const currentChars = fullText.length;
      const currentTime = Date.now();
      const elapsed = (currentTime - startTime) / 1000; // 秒
      const intervalElapsed = (currentTime - lastUpdateTime) / 1000;

      if (intervalElapsed >= 0.5) { // 每0.5秒更新一次速度
        const charsDiff = currentChars - lastUpdateChars;
        speed = charsDiff / intervalElapsed;
        lastUpdateChars = currentChars;
        lastUpdateTime = currentTime;
      }

      // 估算Token数 (中文约1.5字符/token，英文约4字符/token，取平均约2.5)
      const estimatedTokens = Math.ceil(currentChars / 2.5);
      const tokensEl = document.getElementById('generated-tokens');
      if (tokensEl) tokensEl.textContent = estimatedTokens;

      // 估算剩余时间 (假设总Token约1500-2000)
      const estimatedTotalTokens = 1800;
      const remainingTokens = Math.max(0, estimatedTotalTokens - estimatedTokens);
      const estimatedSeconds = speed > 0 ? Math.ceil(remainingTokens / (speed / 2.5)) : 0;
      const timeEl = document.getElementById('estimated-time');
      if (timeEl) {
        if (estimatedSeconds > 60) {
          const mins = Math.floor(estimatedSeconds / 60);
          const secs = estimatedSeconds % 60;
          timeEl.textContent = `${mins}分${secs}秒`;
        } else if (estimatedSeconds > 0) {
          timeEl.textContent = `${estimatedSeconds}秒`;
        } else {
          timeEl.textContent = '即将完成';
        }
      }
    }, currentAbortController.signal);
    // 最终报告只用正文内容，不含思考过程
    displayReport(fullText, finalUsage);
    hint.textContent = '分析报告已生成！';
  } catch (error) {
    if (error.name === 'AbortError') {
      reportSection.innerHTML = `
        <div class="report-stopped">
          <strong>报告生成已停止</strong><br><br>
          您可以点击"生成分析报告"按钮重新开始。
        </div>
      `;
      hint.textContent = '报告生成已停止，可重新开始。';
    } else {
      reportSection.innerHTML = `
        <div class="report-error">
          <strong>报告生成失败</strong><br><br>
          ${escapeHtml(error.message)}<br><br>
          请检查 API URL、模型名称和 API Key 是否正确，然后重试。
        </div>
      `;
      hint.classList.add('no-api');
      hint.textContent = 'API 调用失败，请检查配置后重试。';
    }
  } finally {
    currentAbortController = null;
    btnAnalyze.disabled = false;
    btnAnalyze.textContent = '生成分析报告';
    
    // 恢复原来的按钮
    const stopBtnEl = document.getElementById('btn-stop-generate');
    if (stopBtnEl) stopBtnEl.remove();
    originalButtons.forEach(btn => btn.style.display = '');
  }
}

// ===== 调用 AI API =====
async function callAIApi(apiUrl, model, apiKey, result) {
  // 构建维度得分摘要
  const dimSummary = [];
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const d = result.dimDetails[dimCode];
    dimSummary.push(`${d.name}(${d.fullName}): 总分 ${d.totalScore}/${d.maxScore}, 均分 ${d.avgScore}, 百分位 ${d.percentile}%, 水平: ${d.levelText}, 常模均值 ${d.normMean}(SD=${d.normSd})`);
  }

  // MBTI 映射信息
  const mbtiInfo = result.mbti ? `MBTI 映射代号: ${result.mbti.code} (${result.mbti.name})\nMBTI 类型描述: ${result.mbti.desc}\n映射逻辑: 大五外向性->E/I, 开放性->S/N, 宜人性->T/F, 尽责性->J/P` : '';

  // 构建答题明细
  const answerDetails = QUESTIONS.map((q, i) => {
    const raw = result.answers[i];
    const scored = q.reverse ? (6 - raw) : raw;
    return `${i + 1}. [${DIMENSIONS[q.dim].name}/${q.facet}] ${q.text}${q.reverse ? '(反向题)' : ''} -> ${raw}分 (计分: ${scored})`;
  }).join('\n');

  // 参考文献
  const refs = REFERENCES.join('\n');

  const prompt = `你是一位持有执业资格的人格心理学分析师，精通大五人格模型 (Big Five / Five-Factor Model) 和 IPIP 量表。请根据以下用户的 IPIP 大五人格测试结果，撰写一份专业且通俗易懂的人格分析报告。

## 测试量表信息
本测试使用 International Personality Item Pool (IPIP) 公共领域量表，基于大五人格模型 (OCEAN)，共 70 题，每维度 14 题，采用 5 点 Likert 计分，含反向题。

## 用户维度得分
${dimSummary.join('\n')}

## MBTI 映射结果
${mbtiInfo}

## 答题明细
${answerDetails}

## 参考文献来源
${refs}

## 报告要求

请用中文撰写一份结构清晰、专业且有深度的分析报告。**重要: 在分析中必须引用具体的心理学理论和研究依据**，例如:
- 引用 Costa & McCrae (1992) 的 NEO-PI-R 理论框架解释各维度
- 引用 Goldberg (1992) 的大五因素结构研究
- 引用 McCrae & John (1992) 对五因素模型的理论阐述
- 在解释具体维度表现时引用对应的子维度 (facet) 理论
- 在给出建议时引用相关的人格心理学研究结论

报告需包含以下部分:

### 1. 人格类型判定
首先给出用户的大五人格维度组合标签（如"高开放性-高尽责性-低外向性"型），然后给出系统映射的 MBTI 4 字母代号（${result.mbti ? result.mbti.code : ''}）及其昵称（${result.mbti ? result.mbti.name : ''}），解释这个 MBTI 代号与用户大五维度得分的对应关系（E/I<-外向性, S/N<-开放性, T/F<-宜人性, J/P<-尽责性），并说明该 MBTI 类型的典型特征。引用五因素模型理论和 MBTI 理论说明判定依据。

### 2. 核心总结
用 3-5 句话精炼概括用户的人格全貌，包括最突出的 1-2 个维度特征、整体人格风格印象，让用户一眼看到关键结论。

### 3. 五维度深度分析
逐一分析 O/C/E/A/N 每个维度:
- 解释该维度的心理学定义 (引用理论)
- 解读用户的得分水平和百分位含义
- 结合具体答题倾向分析子维度 (facet) 表现
- 与常模对比的意义

### 4. 优势与潜能
列出用户人格结构中的优势 (3-5条)，引用相关研究说明为何这些特质是优势。

### 5. 挑战与成长空间
指出可能的困难和盲区 (3-5条)，引用心理学研究提供依据。

### 6. 职业发展建议
基于人格特征推荐适合的职业方向，引用 Holland 职业类型理论或相关研究。

### 7. 人际关系分析
分析该人格在社交和亲密关系中的特点，引用依恋理论或人际互动研究。

### 8. 个性化成长建议
给出 3-5 条具体的自我提升建议，每条需有心理学依据。

### 9. 参考文献
列出报告中引用的文献。

请使用 Markdown 格式输出。语言温暖、专业、有洞察力，适合非专业人士阅读。`;

  const requestBody = {
    model: model,
    messages: [
      {
        role: 'system',
        content: '你是一位持有执业资格的人格心理学分析师，精通大五人格模型 (Big Five / Five-Factor Model)、IPIP 量表和 NEO-PI-R 理论。你的分析必须引用具体的心理学理论和研究文献，使用中文回答，使用 Markdown 格式。'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 4096
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API 返回错误 ${response.status}: ${errText.substring(0, 200)}`);
  }

  const data = await response.json();

  if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
    return data.choices[0].message.content;
  }
  if (data.content) return data.content;
  if (data.result) return data.result;
  if (data.response) return data.response;

  throw new Error('无法解析 API 返回的数据格式，请确认 API 兼容 OpenAI Chat Completions 标准。');
}

// ===== 调用 AI API (流式版) =====
async function callAIApiStream(apiUrl, model, apiKey, result, onChunk, signal) {
  // 复用 callAIApi 的 prompt 构建逻辑
  const dimSummary = [];
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const d = result.dimDetails[dimCode];
    dimSummary.push(`${d.name}(${d.fullName}): 总分 ${d.totalScore}/${d.maxScore}, 均分 ${d.avgScore}, 百分位 ${d.percentile}%, 水平: ${d.levelText}, 常模均值 ${d.normMean}(SD=${d.normSd})`);
  }

  const answerDetails = QUESTIONS.map((q, i) => {
    const raw = result.answers[i];
    const scored = q.reverse ? (6 - raw) : raw;
    return `${i + 1}. [${DIMENSIONS[q.dim].name}/${q.facet}] ${q.text}${q.reverse ? '(反向题)' : ''} -> ${raw}分 (计分: ${scored})`;
  }).join('\n');

  // MBTI 映射信息
  const mbtiInfo = result.mbti ? `MBTI 映射代号: ${result.mbti.code} (${result.mbti.name})\nMBTI 类型描述: ${result.mbti.desc}\n映射逻辑: 大五外向性->E/I, 开放性->S/N, 宜人性->T/F, 尽责性->J/P` : '';

  const refs = REFERENCES.join('\n');

  const prompt = `你是一位持有执业资格的人格心理学分析师，精通大五人格模型 (Big Five / Five-Factor Model) 和 IPIP 量表。请根据以下用户的 IPIP 大五人格测试结果，撰写一份专业且通俗易懂的人格分析报告。

## 测试量表信息
本测试使用 International Personality Item Pool (IPIP) 公共领域量表，基于大五人格模型 (OCEAN)，共 70 题，每维度 14 题，采用 5 点 Likert 计分，含反向题。

## 用户维度得分
${dimSummary.join('\n')}

## MBTI 映射结果
${mbtiInfo}

## 答题明细
${answerDetails}

## 参考文献来源
${refs}

## 报告要求

请用中文撰写一份结构清晰、专业且有深度的分析报告。**重要: 在分析中必须引用具体的心理学理论和研究依据**，例如:
- 引用 Costa & McCrae (1992) 的 NEO-PI-R 理论框架解释各维度
- 引用 Goldberg (1992) 的大五因素结构研究
- 引用 McCrae & John (1992) 对五因素模型的理论阐述
- 在解释具体维度表现时引用对应的子维度 (facet) 理论
- 在给出建议时引用相关的人格心理学研究结论

报告需包含以下部分:

### 1. 人格类型判定
首先给出用户的大五人格维度组合标签（如"高开放性-高尽责性-低外向性"型），然后给出系统映射的 MBTI 4 字母代号（${result.mbti ? result.mbti.code : ''}）及其昵称（${result.mbti ? result.mbti.name : ''}），解释这个 MBTI 代号与用户大五维度得分的对应关系（E/I<-外向性, S/N<-开放性, T/F<-宜人性, J/P<-尽责性），并说明该 MBTI 类型的典型特征。引用五因素模型理论和 MBTI 理论说明判定依据。

### 2. 核心总结
用 3-5 句话精炼概括用户的人格全貌，包括最突出的 1-2 个维度特征、整体人格风格印象，让用户一眼看到关键结论。

### 3. 五维度深度分析
逐一分析 O/C/E/A/N 每个维度:
- 解释该维度的心理学定义 (引用理论)
- 解读用户的得分水平和百分位含义
- 结合具体答题倾向分析子维度 (facet) 表现
- 与常模对比的意义

### 4. 优势与潜能
列出用户人格结构中的优势 (3-5条)，引用相关研究说明为何这些特质是优势。

### 5. 挑战与成长空间
指出可能的困难和盲区 (3-5条)，引用心理学研究提供依据。

### 6. 职业发展建议
基于人格特征推荐适合的职业方向，引用 Holland 职业类型理论或相关研究。

### 7. 人际关系分析
分析该人格在社交和亲密关系中的特点，引用依恋理论或人际互动研究。

### 8. 个性化成长建议
给出 3-5 条具体的自我提升建议，每条需有心理学依据。

### 9. 参考文献
列出报告中引用的文献。

请使用 Markdown 格式输出。语言温暖、专业、有洞察力，适合非专业人士阅读。`;

  const requestBody = {
    model: model,
    messages: [
      {
        role: 'system',
        content: '你是一位持有执业资格的人格心理学分析师，精通大五人格模型 (Big Five / Five-Factor Model)、IPIP 量表和 NEO-PI-R 理论。你的分析必须引用具体的心理学理论和研究文献，使用中文回答，使用 Markdown 格式。'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.7,
    max_tokens: 8192,
    stream: true,
    stream_options: { include_usage: true }
  };

  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(requestBody),
    signal: signal
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`API 返回错误 ${response.status}: ${errText.substring(0, 200)}`);
  }

  // 检查是否支持流式响应
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/event-stream') && !response.body) {
    // 不支持流式，回退到非流式解析
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      onChunk(data.choices[0].message.content, false);
      return;
    }
    throw new Error('API 不支持流式响应且返回格式无法解析。');
  }

  // 读取 SSE 流
  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';

  while (true) {
    if (signal && signal.aborted) {
      throw new DOMException('生成已被用户中断', 'AbortError');
    }
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });

    // 按行处理 SSE 数据
    const lines = buffer.split('\n');
    buffer = lines.pop() || ''; // 保留不完整的最后一行

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data:')) continue;

      const dataStr = trimmed.slice(5).trim();
      if (dataStr === '[DONE]') return;

      try {
        const json = JSON.parse(dataStr);
        // 兼容 OpenAI 流式格式
        if (json.choices && json.choices[0] && json.choices[0].delta) {
          const delta = json.choices[0].delta;
          if (delta.content) {
            onChunk(delta.content, false); // 正文
          }
          // 智谱 GLM 系列可能返回 reasoning_content (思考过程)
          if (delta.reasoning_content) {
            onChunk(delta.reasoning_content, true); // 思考过程
          }
        }
        // 兼容其他可能格式
        if (json.content) {
          onChunk(json.content, false);
        }
        // 读取实际 token 消耗 (通常在最后一个 chunk 返回)
        if (json.usage) {
          onChunk(null, false, json.usage);
        }
      } catch (e) {
        // JSON 解析失败，跳过该行 (可能是心跳或注释)
      }
    }
  }
}

// ===== 渲染报告 =====
function displayReport(markdownText, usage) {
  const reportSection = document.getElementById('report-section');
  const wrapper = document.createElement('div');
  wrapper.className = 'report-content';
  const pre = document.createElement('pre');
  pre.style.whiteSpace = 'pre-wrap';
  pre.style.wordBreak = 'break-word';
  pre.style.margin = '0';
  pre.textContent = markdownText;
  wrapper.appendChild(pre);

  // 添加 token 消耗统计
  if (usage) {
    const stats = document.createElement('div');
    stats.className = 'report-token-stats';
    stats.innerHTML = `
      <div class="token-stat-item">
        <span class="token-label">总消耗:</span>
        <span class="token-value">${usage.total_tokens || 0} tokens</span>
      </div>
    `;
    wrapper.appendChild(stats);
  }

  reportSection.innerHTML = '';
  reportSection.appendChild(wrapper);
}

// ===== 简易 Markdown 转 HTML =====
function markdownToHtml(md) {
  let html = escapeHtml(md);

  html = html.replace(/```[\s\S]*?```/g, m => `<pre><code>${m.slice(3, -3)}</code></pre>`);
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  const lines = html.split('\n');
  let result = [];
  let listStack = [];

  function closeListsUpTo(indent) {
    while (listStack.length > 0 && listStack[listStack.length - 1].indent >= indent) {
      const top = listStack.pop();
      result.push(top.type === 'ul' ? '</ul>' : '</ol>');
    }
  }

  function openList(type, indent) {
    listStack.push({type, indent});
    result.push(type === 'ul' ? '<ul>' : '<ol>');
  }

  function isNumberedHeading(content) {
    if (!content) return false;
    const trimmed = content.trim();
    if (trimmed.length > 30) return false;
    if (trimmed.includes(':') || trimmed.includes('：')) return false;
    if (trimmed.match(/[。！？.!?]$/)) return false;
    return true;
  }

  for (let line of lines) {
    const ulMatch = line.match(/^(\s*)[-*]\s+(.+)/);
    const olMatch = line.match(/^(\s*)(\d+)\.\s+(.+)/);

    if (ulMatch) {
      const indent = ulMatch[1].length;
      const content = ulMatch[2];

      closeListsUpTo(indent);

      if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
        openList('ul', indent);
      } else if (listStack[listStack.length - 1].type !== 'ul') {
        closeListsUpTo(indent);
        openList('ul', indent);
      }

      result.push(`<li>${content}</li>`);
    } else if (olMatch) {
      const indent = olMatch[1].length;
      const num = olMatch[2];
      const content = olMatch[3];

      if (indent === 0 && isNumberedHeading(content)) {
        closeListsUpTo(0);
        result.push(`<h2>${num}. ${content}</h2>`);
      } else {
        closeListsUpTo(indent);

        if (listStack.length === 0 || listStack[listStack.length - 1].indent < indent) {
          openList('ol', indent);
        } else if (listStack[listStack.length - 1].type !== 'ol') {
          closeListsUpTo(indent);
          openList('ol', indent);
        }

        result.push(`<li>${content}</li>`);
      }
    } else {
      closeListsUpTo(0);
      if (line.trim()) {
        result.push(`<p>${line}</p>`);
      }
    }
  }
  closeListsUpTo(0);

  return result.join('\n');
}

// ===== HTML 转义 =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== 重新测试 =====
function restartQuiz() {
  currentQuestionIndex = 0;
  answers = new Array(70).fill(null);
  document.getElementById('report-section').innerHTML = '';
  showPage('page-start');
}

// ===== 导出结果 =====
function exportResult() {
  const result = calculateResult();
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');
  const timeStr = now.toLocaleTimeString('zh-CN');

  let content = `MITB 人格测试结果\n`;
  content += `测试时间: ${dateStr} ${timeStr}\n`;
  content += `${'='.repeat(50)}\n\n`;

  content += `MBTI 映射: ${result.mbti.code} - ${result.mbti.name}\n`;
  content += `${result.mbti.desc}\n\n`;

  content += `五维度得分:\n`;
  content += `${'-'.repeat(40)}\n`;
  for (const dimCode of ['O', 'C', 'E', 'A', 'N']) {
    const d = result.dimDetails[dimCode];
    content += `${d.name} (${d.fullName}): ${d.totalScore}/${d.maxScore} (百分位 ${d.percentile}%, ${d.levelText})\n`;
  }

  content += `\n用时统计:\n`;
  content += `${'-'.repeat(40)}\n`;
  content += `总用时: ${formatTime(result.totalElapsed)}\n`;
  const answeredCount = result.questionTimes.filter(t => t > 0).length;
  const avgTime = answeredCount > 0 ? Math.round(result.questionTimes.reduce((a, b) => a + b, 0) / answeredCount / 1000) : 0;
  content += `平均每题: ${avgTime}秒\n`;

  content += `\n答题明细:\n`;
  content += `${'-'.repeat(40)}\n`;
  QUESTIONS.forEach((q, i) => {
    const answer = result.answers[i];
    const scored = q.reverse && answer ? (6 - answer) : answer;
    const time = result.questionTimes[i];
    content += `第${i + 1}题 [${DIMENSIONS[q.dim].name}/${q.facet}] ${q.text}\n`;
    content += `  回答: ${answer ? LIKERT_OPTIONS[answer - 1].label + ` (${scored}分)` : '未作答'} 用时: ${time > 0 ? (time / 1000).toFixed(1) + '秒' : 'N/A'}\n`;
  });

  // 创建下载
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `MITB人格测试结果_${dateStr.replace(/\//g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ===== 分享结果 =====
function shareResult() {
  const result = calculateResult();
  const now = new Date();
  const dateStr = now.toLocaleDateString('zh-CN');

  let text = `🧠 MITB 人格测试报告\n`;
  text += `📅 测试日期: ${dateStr}\n`;
  text += `${'━'.repeat(25)}\n\n`;

  text += `🎭 MBTI 类型: ${result.mbti.code} - ${result.mbti.name}\n`;
  text += `${result.mbti.desc}\n\n`;

  text += `📊 五维度分析:\n`;
  text += `${'─'.repeat(30)}\n`;

  // 五维度得分表格（不依赖字符宽度对齐）
  const dimNames = ['开放性 Openness', '尽责性 Conscientiousness', '外向性 Extraversion', '宜人性 Agreeableness', '神经质 Neuroticism'];
  const levelLabels = { high: '高于常模', low: '低于常模', mid: '接近常模' };
  for (let i = 0; i < 5; i++) {
    const dimCode = ['O', 'C', 'E', 'A', 'N'][i];
    const d = result.dimDetails[dimCode];
    text += `${dimNames[i]}\n`;
    text += `  得分: ${d.totalScore}/${d.maxScore} | 百分位: ${d.percentile}% | ${levelLabels[d.level]}\n`;
  }

  text += `\n⏱️ 测试用时: ${formatTime(result.totalElapsed)}\n`;

  // 最突出维度
  const dominant = result.dimDetails[result.dominantDim];
  text += `\n💡 最突出特质: ${dominant.name} ${dominant.levelText}\n`;

  text += `\n${'━'.repeat(25)}\n`;
  text += `✨ 来试试这个测试，了解真实的自己吧!`;

  // 尝试使用 Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showToast('结果已复制到剪贴板!');
    }).catch(() => {
      fallbackCopy(text);
    });
  } else {
    fallbackCopy(text);
  }
}

// ===== 备用复制方法 =====
function fallbackCopy(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  try {
    document.execCommand('copy');
    showToast('结果已复制到剪贴板!');
  } catch (e) {
    showToast('复制失败，请手动复制');
  }
  document.body.removeChild(textarea);
}

// ===== 显示提示 =====
function showToast(message) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}

// ===== 切换暂停 =====
function togglePause() {
  if (isPaused) {
    // 继续测试
    isPaused = false;
    const pauseDuration = Date.now() - pauseTime;
    quizStartTime += pauseDuration; // 调整开始时间，扣除暂停时间
    questionStartTime += pauseDuration; // 调整当前题开始时间
    showPage('page-quiz');
    renderQuestion();
  } else {
    // 暂停测试
    isPaused = true;
    pauseTime = Date.now();
    saveProgress();
    showPage('page-pause');
  }
}

// ===== 退出测试 =====
function exitQuiz() {
  if (confirm('确定要退出测试吗？退出后你的答题进度将会丢失。')) {
    isPaused = false;
    stopTimer(); // 停止计时器
    clearProgress();
    currentQuestionIndex = 0;
    answers = new Array(70).fill(null);
    questionTimes = new Array(70).fill(0);
    quizStartTime = null;
    questionStartTime = null;
    totalElapsed = 0;
    showPage('page-start');
  }
}

// ===== 键盘快捷键 =====
/**
 * 监听键盘事件，用于在测验页面中进行导航和选择
 * 当测验处于活动状态时，允许用户使用数字键选择Likert选项，使用左右箭头键导航
 */
document.addEventListener('keydown', (e) => {
  // 开发者模式快捷键: 按 m 键跳过所有题目
  if ((e.key === 'm' || e.key === 'M') && devModeEnabled) {
    e.preventDefault();
    activateDevMode();
    return;
  }

  // 暂停页面快捷键
  const pauseActive = document.getElementById('page-pause').classList.contains('active');
  if (pauseActive) {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      togglePause(); // 继续测试
    }
    return;
  }

  // 检查测验页面是否处于活动状态
  const quizActive = document.getElementById('page-quiz').classList.contains('active');
  // 如果测验未处于活动状态，则直接返回，不执行任何操作
  if (!quizActive) return;

  // ESC 键暂停
  if (e.key === 'Escape') {
    e.preventDefault();
    togglePause();
    return;
  }

  // 定义键盘按键与Likert选项的映射关系
  const keyMap = { '1': 1, '2': 2, '3': 3, '4': 4, '5': 5 };
  // 如果按下的键在keyMap中存在，则调用selectLikert函数选择对应的选项
  if (keyMap[e.key]) {
    selectLikert(keyMap[e.key]);
  } else if (e.key === 'ArrowLeft') {
    // 如果按下左箭头键，调用prevQuestion函数显示上一题
    prevQuestion();
  } else if (e.key === 'ArrowRight') {
    if (answers[currentQuestionIndex] !== null) nextQuestion();
  }
});

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  if (typeof QUESTIONS === 'undefined' || QUESTIONS.length !== 70) {
    console.error('题目数据加载失败');
    return;
  }

  // 尝试恢复进度
  if (loadProgress()) {
    const hasAnswers = answers.some(a => a !== null);
    if (hasAnswers) {
      const answeredCount = answers.filter(a => a !== null).length;
      const shouldResume = confirm(`检测到上次未完成的测试进度（已完成 ${answeredCount}/70 题），是否继续？`);
      if (shouldResume) {
        quizStartTime = Date.now() - totalElapsed; // 恢复开始时间
        questionStartTime = Date.now(); // 当前题重新开始计时
        showPage('page-quiz');
        renderQuestion();
        return;
      } else {
        clearProgress(); // 用户选择不继续，清除进度
      }
    }
  }
});

// ===== 开发者模式：双击标题开启 =====
document.getElementById('start-title').addEventListener('dblclick', () => {
  devModeEnabled = !devModeEnabled;
});