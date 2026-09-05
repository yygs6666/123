/**
 * MITB 人格测试 - 题库（IPIP 大五人格量表版）
 *
 * 基于 International Personality Item Pool (IPIP) 公共领域量表改编
 * 采用大五人格模型 (Big Five / OCEAN)：开放性、尽责性、外向性、宜人性、神经质
 * 共 70 题，每个维度 14 题，5 点 Likert 计分
 *
 * 参考文献:
 * 1. Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure.
 *    Psychological Assessment, 4(1), 26-42.
 * 2. John, O. P., & Srivastava, S. (1999). The Big Five Trait taxonomy: History, measurement,
 *    and theoretical perspectives. In L. A. Pervin & O. P. John (Eds.), Handbook of personality
 *    (2nd ed., pp. 102-138). New York: Guilford.
 * 3. Goldberg, L. R., et al. (2006). The International Personality Item Pool and the future of
 *    public-domain personality measures. Journal of Research in Personality, 40, 84-96.
 * 4. IPIP 官方网站: https://ipip.ori.org/
 *
 * 常模参考数据基于 John & Srivastava (1999) BFI 验证样本近似值，用于百分位换算
 */

// Likert 量表选项
const LIKERT_OPTIONS = [
  { value: 1, label: "非常不同意", short: "1" },
  { value: 2, label: "不同意", short: "2" },
  { value: 3, label: "中立", short: "3" },
  { value: 4, label: "同意", short: "4" },
  { value: 5, label: "非常同意", short: "5" }
];

/**
 * @typedef {Object} Question
 * @property {number} id - 题号
 * @property {string} dim - 维度代码 (O/C/E/A/N)
 * @property {string} facet - 子维度名称
 * @property {string} text - 题目文本
 * @property {boolean} reverse - 是否反向计分
 */
const QUESTIONS = [
  // ===== 开放性 O (Openness to Experience) - 14题 =====
  { id: 1,  dim: "O", facet: "想象力",   text: "我拥有丰富的想象力。", reverse: false },
  { id: 2,  dim: "O", facet: "艺术兴趣", text: "我对艺术、音乐或文学有深厚的兴趣。", reverse: false },
  { id: 3,  dim: "O", facet: "情感丰富", text: "我能敏锐地感受自己的内心情感变化。", reverse: false },
  { id: 4,  dim: "O", facet: "冒险尝试", text: "我喜欢尝试新奇的食物和体验。", reverse: false },
  { id: 5,  dim: "O", facet: "思想探索", text: "我喜欢思考抽象的哲学和理论问题。", reverse: false },
  { id: 6,  dim: "O", facet: "价值多元", text: "我愿意了解不同文化和价值观。", reverse: false },
  { id: 7,  dim: "O", facet: "想象力",   text: "我经常有天马行空的想法。", reverse: false },
  { id: 8,  dim: "O", facet: "艺术兴趣", text: "我觉得诗歌和艺术品很有感染力。", reverse: false },
  { id: 9,  dim: "O", facet: "思想探索", text: "我喜欢思考事物的本质和深层含义。", reverse: false },
  { id: 10, dim: "O", facet: "价值多元", text: "我倾向于挑战传统观念和权威。", reverse: false },
  { id: 11, dim: "O", facet: "艺术兴趣", text: "我对艺术活动几乎没有兴趣。", reverse: true },
  { id: 12, dim: "O", facet: "冒险尝试", text: "我更喜欢熟悉和常规的事物，而非新鲜事物。", reverse: true },
  { id: 13, dim: "O", facet: "思想探索", text: "我很少深入思考抽象的概念和理论。", reverse: true },
  { id: 14, dim: "O", facet: "想象力",   text: "我的思维方式比较具体，很少幻想。", reverse: true },

  // ===== 尽责性 C (Conscientiousness) - 14题 =====
  { id: 15, dim: "C", facet: "自我效能", text: "我相信自己有能力完成目标。", reverse: false },
  { id: 16, dim: "C", facet: "条理性",   text: "我做事有条不紊，注重计划。", reverse: false },
  { id: 17, dim: "C", facet: "责任感",   text: "我遵守承诺，说到做到。", reverse: false },
  { id: 18, dim: "C", facet: "追求成就", text: "我为实现目标会付出持久的努力。", reverse: false },
  { id: 19, dim: "C", facet: "自律",     text: "我能长时间专注于困难的任务。", reverse: false },
  { id: 20, dim: "C", facet: "谨慎",     text: "我做决定前会仔细权衡利弊。", reverse: false },
  { id: 21, dim: "C", facet: "条理性",   text: "我保持工作和生活空间的整洁有序。", reverse: false },
  { id: 22, dim: "C", facet: "责任感",   text: "我总是按时完成自己的任务。", reverse: false },
  { id: 23, dim: "C", facet: "自律",     text: "即使不情愿，我也能坚持完成该做的事。", reverse: false },
  { id: 24, dim: "C", facet: "追求成就", text: "我对自己有很高的标准。", reverse: false },
  { id: 25, dim: "C", facet: "条理性",   text: "我的物品常常杂乱无章。", reverse: true },
  { id: 26, dim: "C", facet: "自律",     text: "我经常拖延到最后一刻才行动。", reverse: true },
  { id: 27, dim: "C", facet: "追求成就", text: "我做事常常半途而废。", reverse: true },
  { id: 28, dim: "C", facet: "谨慎",     text: "我做决定时往往冲动行事。", reverse: true },

  // ===== 外向性 E (Extraversion) - 14题 =====
  { id: 29, dim: "E", facet: "热情",     text: "我对人友好，容易与人亲近。", reverse: false },
  { id: 30, dim: "E", facet: "合群",     text: "我在人群中感到自在和充满活力。", reverse: false },
  { id: 31, dim: "E", facet: "果断",     text: "我乐于主动发起活动和对话。", reverse: false },
  { id: 32, dim: "E", facet: "活跃",     text: "我精力充沛，喜欢忙碌。", reverse: false },
  { id: 33, dim: "E", facet: "寻求刺激", text: "我喜欢刺激和冒险的体验。", reverse: false },
  { id: 34, dim: "E", facet: "积极情绪", text: "我经常感到快乐和乐观。", reverse: false },
  { id: 35, dim: "E", facet: "热情",     text: "我在社交场合善于活跃气氛。", reverse: false },
  { id: 36, dim: "E", facet: "合群",     text: "我乐于结识新朋友。", reverse: false },
  { id: 37, dim: "E", facet: "果断",     text: "我说话做事充满自信。", reverse: false },
  { id: 38, dim: "E", facet: "积极情绪", text: "我对生活充满热情。", reverse: false },
  { id: 39, dim: "E", facet: "合群",     text: "我更喜欢独处而非与人交往。", reverse: true },
  { id: 40, dim: "E", facet: "热情",     text: "在陌生人面前我通常比较沉默。", reverse: true },
  { id: 41, dim: "E", facet: "活跃",     text: "我倾向于安静低调，不喜欢引人注目。", reverse: true },
  { id: 42, dim: "E", facet: "寻求刺激", text: "激烈热闹的活动让我感到不适。", reverse: true },

  // ===== 宜人性 A (Agreeableness) - 14题 =====
  { id: 43, dim: "A", facet: "信任",     text: "我相信大多数人本质是善良的。", reverse: false },
  { id: 44, dim: "A", facet: "坦率",     text: "我与人交往真诚直接。", reverse: false },
  { id: 45, dim: "A", facet: "利他",     text: "我乐于花时间帮助他人。", reverse: false },
  { id: 46, dim: "A", facet: "顺从",     text: "我愿意与人合作，而非争锋相对。", reverse: false },
  { id: 47, dim: "A", facet: "谦逊",     text: "我对人谦虚有礼。", reverse: false },
  { id: 48, dim: "A", facet: "共情",     text: "我能设身处地为他人着想。", reverse: false },
  { id: 49, dim: "A", facet: "信任",     text: "我对他人普遍持信任态度。", reverse: false },
  { id: 50, dim: "A", facet: "利他",     text: "我做事会考虑对他人是否有帮助。", reverse: false },
  { id: 51, dim: "A", facet: "顺从",     text: "我尽量避免与他人发生冲突。", reverse: false },
  { id: 52, dim: "A", facet: "共情",     text: "我会认真倾听他人的烦恼并给予安慰。", reverse: false },
  { id: 53, dim: "A", facet: "信任",     text: "我常怀疑别人的动机不纯。", reverse: true },
  { id: 54, dim: "A", facet: "顺从",     text: "我认为与人合作很困难。", reverse: true },
  { id: 55, dim: "A", facet: "谦逊",     text: "我有时觉得自己比别人优越。", reverse: true },
  { id: 56, dim: "A", facet: "利他",     text: "我更看重自己的利益而非他人的感受。", reverse: true },

  // ===== 神经质 N (Neuroticism) - 14题 =====
  { id: 57, dim: "N", facet: "焦虑",     text: "我容易感到紧张和焦虑。", reverse: false },
  { id: 58, dim: "N", facet: "愤怒",     text: "我容易因为小事而烦躁。", reverse: false },
  { id: 59, dim: "N", facet: "抑郁",     text: "我经常感到情绪低落或沮丧。", reverse: false },
  { id: 60, dim: "N", facet: "自我意识", text: "我在社交场合容易感到不自在。", reverse: false },
  { id: 61, dim: "N", facet: "冲动",     text: "压力下我容易失控或做出冲动行为。", reverse: false },
  { id: 62, dim: "N", facet: "脆弱",     text: "面对突发事件时我容易感到崩溃。", reverse: false },
  { id: 63, dim: "N", facet: "焦虑",     text: "我经常为未来的事情担忧。", reverse: false },
  { id: 64, dim: "N", facet: "抑郁",     text: "我的情绪起伏比较大。", reverse: false },
  { id: 65, dim: "N", facet: "自我意识", text: "我经常对自己的表现不满意。", reverse: false },
  { id: 66, dim: "N", facet: "脆弱",     text: "遇到困难时我容易感到无助。", reverse: false },
  { id: 67, dim: "N", facet: "焦虑",     text: "即使在没有明显压力时，我也很少感到焦虑。", reverse: true },
  { id: 68, dim: "N", facet: "抑郁",     text: "我通常情绪稳定，很少感到沮丧。", reverse: true },
  { id: 69, dim: "N", facet: "愤怒",     text: "我很少发脾气，情绪比较平和。", reverse: true },
  { id: 70, dim: "N", facet: "脆弱",     text: "压力下我能保持冷静和镇定。", reverse: true }
];

/**
 * 维度说明
 * 每个维度的常模数据 (norm) 基于大样本验证研究:
 * - mean: 该维度平均得分 (14 题总分, 范围 14-70)
 * - sd: 标准差
 * 参考来源: John & Srivastava (1999), BFI 验证样本近似值 (按 14 题等比缩放)
 */
const DIMENSIONS = {
  O: {
    code: "O",
    name: "开放性",
    fullName: "Openness to Experience",
    desc: "衡量一个人对新经验、创意、艺术和抽象思想的接受程度。高分者好奇、富有想象力、喜欢探索新事物。",
    facets: ["想象力", "艺术兴趣", "情感丰富", "冒险尝试", "思想探索", "价值多元"],
    norm: { mean: 49.4, sd: 8.2 },
    highDesc: "富有想象力、好奇、有创造力、思想开放",
    lowDesc: "务实、保守、偏好传统和熟悉事物"
  },
  C: {
    code: "C",
    name: "尽责性",
    fullName: "Conscientiousness",
    desc: "衡量一个人的自我控制、目标导向和组织能力。高分者自律、可靠、有条理、追求成就。",
    facets: ["自我效能", "条理性", "责任感", "追求成就", "自律", "谨慎"],
    norm: { mean: 50.4, sd: 8.0 },
    highDesc: "自律、有条理、可靠、追求卓越",
    lowDesc: "灵活、随性、不拘小节"
  },
  E: {
    code: "E",
    name: "外向性",
    fullName: "Extraversion",
    desc: "衡量一个人的能量指向和社交活跃程度。高分者热情、健谈、乐观、喜欢社交活动。",
    facets: ["热情", "合群", "果断", "活跃", "寻求刺激", "积极情绪"],
    norm: { mean: 47.6, sd: 9.5 },
    highDesc: "热情、社交活跃、乐观、充满活力",
    lowDesc: "安静、内敛、独立、喜欢独处"
  },
  A: {
    code: "A",
    name: "宜人性",
    fullName: "Agreeableness",
    desc: "衡量一个人的人际取向和合作态度。高分者友善、信任他人、乐于助人、富有同理心。",
    facets: ["信任", "坦率", "利他", "顺从", "谦逊", "共情"],
    norm: { mean: 51.5, sd: 7.6 },
    highDesc: "友善、信任、乐于助人、富有同理心",
    lowDesc: "独立、批判性、竞争性强"
  },
  N: {
    code: "N",
    name: "神经质",
    fullName: "Neuroticism",
    desc: "衡量一个人体验负面情绪的倾向。高分者容易焦虑、情绪波动大、对压力敏感。",
    facets: ["焦虑", "愤怒", "抑郁", "自我意识", "冲动", "脆弱"],
    norm: { mean: 41.6, sd: 9.8 },
    highDesc: "容易焦虑、情绪敏感、对压力反应强烈",
    lowDesc: "情绪稳定、冷静、抗压能力强"
  }
};

/**
 * 参考文献 (用于 AI 分析时引用)
 */
const REFERENCES = [
  "Goldberg, L. R. (1992). The development of markers for the Big-Five factor structure. Psychological Assessment, 4(1), 26-42.",
  "John, O. P., & Srivastava, S. (1999). The Big Five Trait taxonomy: History, measurement, and theoretical perspectives. In Handbook of personality (2nd ed., pp. 102-138). Guilford.",
  "Goldberg, L. R., et al. (2006). The International Personality Item Pool and the future of public-domain personality measures. Journal of Research in Personality, 40, 84-96.",
  "Costa, P. T., & McCrae, R. R. (1992). Revised NEO Personality Inventory (NEO-PI-R) and NEO Five-Factor Inventory (NEO-FFI) manual. Odessa, FL: Psychological Assessment Resources.",
  "McCrae, R. R., & John, O. P. (1992). An introduction to the five-factor model and its applications. Journal of Personality, 60(2), 175-215."
];

/**
 * 大五人格类型描述 (按最高维度分类)
 * 注意: 大五人格不采用离散类型分类，而是连续维度。以下为各维度高/低的描述。
 */
const PERSONALITY_PROFILES = {
  high_O: "开放性高的人富有想象力和创造力，喜欢探索新想法和体验。他们通常对艺术、哲学和文化有浓厚兴趣，思维灵活，愿意接受新观念。",
  low_O:  "开放性低的人务实、脚踏实地，偏好具体和熟悉的事物。他们重视传统和常规，做事方式直接高效。",
  high_C: "尽责性高的人自律、有条理、目标明确。他们做事可靠，注重细节，追求卓越，善于规划和管理时间。",
  low_C:  "尽责性低的人灵活随性，不拘小节。他们更喜欢即兴和灵活的方式，有时会拖延但也能在压力下发挥。",
  high_E: "外向性高的人热情、健谈、充满活力。他们在社交中如鱼得水，喜欢与人互动，乐观积极。",
  low_E:  "外向性低的人安静、内敛、独立。他们更喜欢独处或小范围社交，思考深入，行动沉稳。",
  high_A: "宜人性高的人友善、信任、乐于助人。他们富有同理心，重视人际关系和谐，善于合作。",
  low_A:  "宜人性低的人独立、批判性强、有竞争意识。他们更注重客观和效率，不回避冲突。",
  high_N: "神经质高的人对情绪变化敏感，容易感到焦虑和压力。他们对环境和他人反应敏锐，情绪体验丰富。",
  low_N: "神经质低的人情绪稳定、冷静、抗压能力强。他们在压力下保持镇定，不易受情绪干扰。"
};

/**
 * 大五 -> MBTI 映射表
 * 大五维度高低组合映射到最接近的 MBTI 4 字母代号
 * 映射逻辑:
 *   E/I <- 大五 E (外向性) 高=E, 低=I
 *   S/N <- 大五 O (开放性) 高=N (直觉), 低=S (感觉)
 *   T/F <- 大五 A (宜人性) 高=F (情感), 低=T (思考)
 *   J/P <- 大五 C (尽责性) 高=J (判断), 低=P (感知)
 *   N (神经质) 作为修饰因子影响选择
 */
const MBTI_TYPES = {
  INTJ: { name: "建筑师", desc: "富有想象力又有战略思维，一切皆在计划之中。" },
  INTP: { name: "逻辑学家", desc: "对知识有着永不满足的渴望，喜欢分析和理论探索。" },
  ENTJ: { name: "指挥官", desc: "大胆、富有想象力且意志强大的领导者。" },
  ENTP: { name: "辩论家", desc: "聪明好奇的思想者，喜欢挑战和创新。" },
  INFJ: { name: "提倡者", desc: "安静而神秘，鼓舞人心且不知疲倦的理想主义者。" },
  INFP: { name: "调停者", desc: "诗意、善良的利他主义者，总是热情地为正当事业提供帮助。" },
  ENFJ: { name: "主人公", desc: "富有魅力、鼓舞人心的领导者，能够让听众为之着迷。" },
  ENFP: { name: "竞选者", desc: "热情、有创造力、爱社交的自由灵魂。" },
  ISTJ: { name: "物流师", desc: "实际且注重事实的人，可靠性不容怀疑。" },
  ISFJ: { name: "守卫者", desc: "非常专注而温暖的守护者，时刻准备保护爱的人们。" },
  ESTJ: { name: "总经理", desc: "出色的管理者，在管理事物和人方面无与伦比。" },
  ESFJ: { name: "执政官", desc: "极有同情心、爱交际、受欢迎的人，总是乐于助人。" },
  ISTP: { name: "鉴赏家", desc: "大胆而实际的实验家，擅长使用各种工具。" },
  ISFP: { name: "探险家", desc: "灵活而有魅力的艺术家，时刻准备探索和体验新事物。" },
  ESTP: { name: "企业家", desc: "聪明、精力充沛的人，真正享受生活在边缘。" },
  ESFP: { name: "表演者", desc: "自发的、精力充沛的表演者，生活在他们周围永不无聊。" }
};

/**
 * 根据大五维度得分映射出最接近的 MBTI 代号
 * @param {Object} dimDetails - calculateResult 返回的 dimDetails
 * @returns {Object} { code, name, desc }
 */
function getMBTIType(dimDetails) {
  // E/I: 外向性高 -> E, 低 -> I
  const ei = dimDetails.E.level === 'high' ? 'E' : (dimDetails.E.level === 'low' ? 'I' : (dimDetails.E.totalScore >= dimDetails.E.normMean ? 'E' : 'I'));
  // S/N: 开放性高 -> N (直觉), 低 -> S (感觉)
  const sn = dimDetails.O.level === 'high' ? 'N' : (dimDetails.O.level === 'low' ? 'S' : (dimDetails.O.totalScore >= dimDetails.O.normMean ? 'N' : 'S'));
  // T/F: 宜人性高 -> F (情感), 低 -> T (思考)
  const tf = dimDetails.A.level === 'high' ? 'F' : (dimDetails.A.level === 'low' ? 'T' : (dimDetails.A.totalScore >= dimDetails.A.normMean ? 'F' : 'T'));
  // J/P: 尽责性高 -> J (判断), 低 -> P (感知)
  const jp = dimDetails.C.level === 'high' ? 'J' : (dimDetails.C.level === 'low' ? 'P' : (dimDetails.C.totalScore >= dimDetails.C.normMean ? 'J' : 'P'));

  const code = ei + sn + tf + jp;
  const mbti = MBTI_TYPES[code] || { name: "独特型", desc: "你的人格组合较为独特，难以简单归类。" };
  return { code, name: mbti.name, desc: mbti.desc };
}

// ===== API 厂商预设列表 =====
const PROVIDERS = [
  {
    name: '智谱AI (GLM)',
    url: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    models: [
      // GLM-5 系列 (2026)
      'glm-5.3', 'glm-5.3-flash', 'glm-5.2', 'glm-5.1', 'glm-5', 'glm-5-turbo',
      // GLM-Z1 推理模型系列
      'glm-z1-air', 'glm-z1-airx', 'glm-z1-flash', 'glm-z1-rumination',
      // GLM-4 系列
      'glm-4.7', 'glm-4.7-flash', 'glm-4.6', 'glm-4.5', 'glm-4.5-flash', 'glm-4.5-air', 'glm-4-plus',
      'glm-4-long', 'glm-4-flash', 'glm-4', 'glm-4-air', 'glm-4-airx',
      // 多模态模型
      'cogview-4', 'cogviewx', 'cogvideox',
      // 专用模型
      'emohaa', 'codegeex-4'
    ]
  },
  {
    name: 'OpenAI',
    url: 'https://api.openai.com/v1/chat/completions',
    models: [
      'gpt-4o', 'gpt-4o-mini', 'gpt-4o-2024-11-20', 'gpt-4o-2024-08-06',
      'gpt-4o-2024-05-13', 'gpt-4-turbo', 'gpt-4-turbo-preview',
      'gpt-4', 'gpt-4-32k', 'gpt-4-0125-preview', 'gpt-4-1106-preview',
      'gpt-3.5-turbo', 'gpt-3.5-turbo-16k', 'o1-preview', 'o1-mini',
      'o3-mini', 'o1', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano',
      'gpt-4.5-preview'
    ]
  },
  {
    name: 'DeepSeek (深度求索)',
    url: 'https://api.deepseek.com/v1/chat/completions',
    models: [
      'deepseek-chat', 'deepseek-reasoner', 'deepseek-coder',
      'deepseek-v3', 'deepseek-v3.2', 'deepseek-v4-flash', 'deepseek-v4-pro',
      'deepseek-r1', 'deepseek-r2',
      'deepseek-coder-2.0', 'deepseek-llm-2.0',
      'deepseek-math-v2'
    ]
  },
  {
    name: 'Kimi / 月之暗面 (Moonshot)',
    url: 'https://api.moonshot.cn/v1/chat/completions',
    models: [
      'moonshot-v1-8k', 'moonshot-v1-32k', 'moonshot-v1-128k',
      'kimi-latest', 'moonshot-v1-auto',
      'kimi-k2.5', 'kimi-k2.6', 'kimi-k2.7-code', 'kimi-k2.7-code-highspeed'
    ]
  },
  {
    name: '通义千问 (阿里云百炼)',
    url: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
    models: [
      'qwen-turbo', 'qwen-turbo-latest', 'qwen-plus', 'qwen-plus-latest',
      'qwen-max', 'qwen-max-latest', 'qwen-long', 'qwen-vl-max',
      'qwen-vl-plus', 'qwen2.5-7b-instruct', 'qwen2.5-14b-instruct',
      'qwen2.5-32b-instruct', 'qwen2.5-72b-instruct', 'qwen2-7b-instruct',
      'qwen2-57b-a14b-instruct', 'qwen-math-turbo', 'qwen-coder-turbo',
      'qwen3-235b-a22b', 'qwen3-32b', 'qwen3-14b', 'qwen3-8b',
      'qwen3-4b', 'qwen3-1.7b', 'qwq-32b', 'qwq-plus',
      'qwen3.5-plus', 'qwen3.5-flash',
      'qwen3.6-flash', 'qwen3.6-plus-preview',
      'qwen3.8-max', 'qwen3.8-2.4t-a95b',
      'qwen-flash-character'
    ]
  },
  {
    name: '百川智能 (Baichuan)',
    url: 'https://api.baichuan-ai.com/v1/chat/completions',
    models: [
      'baichuan2-turbo', 'baichuan-novel-turbo', 'baichuan-4-turbo',
      'baichuan-4-turbo-128k', 'baichuan-3-turbo', 'baichuan2-53b',
      'baichuan2-13b', 'baichuan-7b',
      'baichuan-m4', 'baichuan-m3-plus', 'baichuan-m2'
    ]
  },
  {
    name: '硅基流动 (SiliconFlow)',
    url: 'https://api.siliconflow.cn/v1/chat/completions',
    models: [
      'Qwen/Qwen2.5-7B-Instruct', 'Qwen/Qwen2.5-14B-Instruct',
      'Qwen/Qwen2.5-32B-Instruct', 'Qwen/Qwen2.5-72B-Instruct',
      'Qwen/Qwen2.5-Coder-7B-Instruct', 'Qwen/Qwen2.5-Coder-32B-Instruct',
      'Qwen/Qwen2.5-Math-7B-Instruct', 'Qwen/QwQ-32B-Preview',
      'Qwen/Qwen3-235B-A22B', 'Qwen/Qwen3-32B', 'Qwen/Qwen3-14B',
      'Qwen/Qwen3-8B', 'Qwen/Qwen3-4B',
      'deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1',
      'deepseek-ai/DeepSeek-V2.5', 'deepseek-ai/DeepSeek-Coder-V2-Instruct',
      'deepseek-ai/deepseek-llm-7b-chat', 'deepseek-ai/deepseek-llm-67b-chat',
      'meta-llama/Meta-Llama-3.1-8B-Instruct', 'meta-llama/Meta-Llama-3.1-70B-Instruct',
      'meta-llama/Meta-Llama-3.1-405B-Instruct', 'meta-llama/Llama-3.3-70B-Instruct',
      'mistralai/Mistral-7B-Instruct-v0.3', 'mistralai/Mistral-Small-24B-Instruct-2501',
      'mistralai/Mistral-Nemo-12B-Instruct-2407', 'mistralai/Mistral-Large-2411',
      'google/gemma-2-9b-it', 'google/gemma-2-27b-it',
      '01-ai/Yi-1.5-9B-Chat', '01-ai/Yi-1.5-34B-Chat',
      'THUDM/glm-4-9b-chat', 'internlm/internlm2_5-7b-chat',
      'internlm/internlm2_5-20b-chat'
    ]
  },
  {
    name: 'NVIDIA NIM',
    url: 'https://integrate.api.nvidia.com/v1/chat/completions',
    models: [
      'meta/llama-3.1-8b-instruct', 'meta/llama-3.1-70b-instruct',
      'meta/llama-3.1-405b-instruct', 'meta/llama-3.3-70b-instruct',
      'meta/llama-3.2-1b-instruct', 'meta/llama-3.2-3b-instruct',
      'meta/llama-3.2-11b-vision-instruct', 'meta/llama-3.2-90b-vision-instruct',
      'mistralai/mistral-7b-instruct-v0.3', 'mistralai/mistral-large-2407',
      'mistralai/mixtral-8x7b-instruct-v0.1', 'mistralai/mixtral-8x22b-instruct-v0.1',
      'google/gemma-2-2b-it', 'google/gemma-2-9b-it', 'google/gemma-2-27b-it',
      'microsoft/phi-3-mini-128k-instruct', 'microsoft/phi-3-small-128k-instruct',
      'microsoft/phi-3-medium-128k-instruct', 'microsoft/phi-3.5-mini-instruct',
      'microsoft/phi-3.5-moe-instruct', 'nvidia/llama-3.1-nemotron-70b-instruct',
      'nvidia/nemotron-4-340b-instruct', '01-ai/yi-large',
      'qwen/qwen2.5-7b-instruct', 'qwen/qwen2.5-coder-32b-instruct',
      'qwen/qwen2.5-72b-instruct'
    ]
  },
  // Anthropic Claude 已移除：使用自有 API 格式（x-api-key 鉴权 + system 顶级参数），
  // 不兼容 OpenAI Chat Completions。请通过 OpenRouter 或 Together AI 间接调用 Claude。
  {
    name: 'Google Gemini',
    url: 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions',
    models: [
      'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.0-flash-thinking-exp',
      'gemini-1.5-flash', 'gemini-1.5-flash-8b', 'gemini-1.5-pro',
      'gemini-1.0-pro', 'gemini-exp-1206', 'gemini-2.0-pro-exp'
    ]
  },
  {
    name: '字节跳动 (火山引擎/豆包) ⚠️model需填Endpoint ID',
    url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    models: [
      'ep-xxxxx (Doubao-Seed-2.1-Pro - 控制台创建接入点)',
      'ep-xxxxx (Doubao-Seed-2.1-Turbo - 控制台创建接入点)',
      'ep-xxxxx (Doubao-Seed-Evolving - 控制台创建接入点)',
      'ep-xxxxx (Doubao-Seed-1.6 - 控制台创建接入点)',
      'ep-xxxxx (Doubao-Seed-1.6-Lite - 控制台创建接入点)',
      'ep-xxxxx (Doubao-Seed-1.6-Flash - 控制台创建接入点)',
      'ep-xxxxx (Doubao-2.0-Pro - 控制台创建接入点)',
      'ep-xxxxx (Doubao-2.0-Lite - 控制台创建接入点)',
      'ep-xxxxx (Doubao-2.0-Mini - 控制台创建接入点)',
      'ep-xxxxx (Doubao-2.0-Code - 控制台创建接入点)',
      'ep-xxxxx (doubao-seed-character-260628 - 控制台创建接入点)',
      'ep-xxxxx (Doubao 1.5 Pro 32k - 控制台创建接入点)',
      'ep-xxxxx (Doubao 1.5 Pro 256k - 控制台创建接入点)',
      'ep-xxxxx (Doubao 1.5 Lite 32k - 控制台创建接入点)',
      'ep-xxxxx (Doubao Pro 128k - 控制台创建接入点)',
      'ep-xxxxx (Doubao Vision Pro 32k - 控制台创建接入点)',
      'ep-xxxxx (DeepSeek R1 - 控制台创建接入点)',
      'ep-xxxxx (DeepSeek V3 - 控制台创建接入点)'
    ]
  },
  {
    name: '零一万物 (01.AI)',
    url: 'https://api.lingyiwanwu.com/v1/chat/completions',
    models: [
      'yi-large', 'yi-medium', 'yi-small', 'yi-vision',
      'yi-large-turbo', 'yi-large-rag', 'yi-lightning'
    ]
  },
  {
    name: 'MiniMax',
    url: 'https://api.minimax.chat/v1/chat/completions',
    models: [
      'MiniMax-M3', 'MiniMax-M2.7', 'MiniMax-M2.5', 'MiniMax-Text-01',
      'abab6.5s-chat', 'abab6.5g-chat', 'abab6.5t-chat',
      'abab6-chat', 'abab5.5s-chat', 'abab5.5-chat'
    ]
  },
  {
    name: '阶跃星辰 (StepFun)',
    url: 'https://api.stepfun.com/v1/chat/completions',
    models: [
      'step-1-8k', 'step-1-32k', 'step-1-128k', 'step-1-256k',
      'step-1-flash', 'step-1v-8k', 'step-1v-32k', 'step-2-16k',
      'step-2-mini'
    ]
  },
  {
    name: '讯飞星火 (Spark)',
    url: 'https://spark-api-open.xf-yun.com/v1/chat/completions',
    models: [
      'generalv3.5', 'generalv3', 'generalv2', 'general',
      'spark-v3.5', 'spark-v3.1', 'spark-v3', 'spark-v2',
      'spark-v1.5', 'spark-lite', 'spark-pro', 'spark-max',
      'spark-4.0-ultra'
    ]
  },
  {
    name: '腾讯混元 (Hunyuan)',
    url: 'https://api.hunyuan.cloud.tencent.com/v1/chat/completions',
    models: [
      'hunyuan-turbos-latest', 'hunyuan-turbos', 'hunyuan-standard',
      'hunyuan-standard-256K', 'hunyuan-lite', 'hunyuan-large',
      'hunyuan-code', 'hunyuan-role', 'hy-role-latest', 'hy-role',
      'hunyuan-pro', 'hunyuan-t1-latest',
      'hy3-preview',
      'hy-mt2-pro', 'hy-mt2-plus', 'hy-mt2-lite'
    ]
  },
  {
    name: '百度千帆 (文心一言)',
    url: 'https://qianfan.baidubce.com/v2/chat/completions',
    models: [
      'ernie-4.0-8k-latest', 'ernie-4.0-turbo-8k', 'ernie-4.0-turbo-128k',
      'ernie-4.0-8k-preview', 'ernie-4.0-8k-0329', 'ernie-4.0-8k-0613',
      'ernie-3.5-8k', 'ernie-3.5-128k', 'ernie-3.5-8k-preview',
      'ernie-speed-8k', 'ernie-speed-128k', 'ernie-speed-pro-128k',
      'ernie-lite-8k', 'ernie-lite-pro-128k', 'ernie-tiny-8k',
      'ernie-character-8k', 'ernie-character-128k', 'ernie-novel-8k',
      'deepseek-r1-250120', 'deepseek-v3-241226',
      'qwen2.5-72b-instruct', 'qwen2.5-coder-32b-instruct',
      'llama-3.1-405b-instruct', 'llama-3.3-70b-instruct'
    ]
  },
  {
    name: 'Groq',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    models: [
      'llama-3.3-70b-versatile', 'llama-3.1-8b-instant',
      'llama-3.1-70b-versatile', 'llama-3.2-1b-preview',
      'llama-3.2-3b-preview', 'llama-3.2-11b-vision-preview',
      'llama-3.2-90b-vision-preview', 'mixtral-8x7b-32768',
      'gemma2-9b-it', 'gemma-7b-it',
      'deepseek-r1-distill-llama-70b', 'deepseek-r1-distill-qwen-32b',
      'qwen-2.5-32b', 'qwen-2.5-coder-32b',
      'llama-3.1-8b-instant', 'allam-2-7b'
    ]
  },
  {
    name: 'Together AI',
    url: 'https://api.together.xyz/v1/chat/completions',
    models: [
      'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-405B-Instruct-Turbo',
      'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo', 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
      'Qwen/Qwen2.5-72B-Instruct-Turbo', 'Qwen/Qwen2.5-7B-Instruct-Turbo',
      'Qwen/Qwen2.5-Coder-32B-Instruct', 'Qwen/QwQ-32B-Preview',
      'deepseek-ai/DeepSeek-V3', 'deepseek-ai/DeepSeek-R1',
      'mistralai/Mistral-7B-Instruct-v0.3', 'mistralai/Mixtral-8x7B-Instruct-v0.1',
      'mistralai/Mistral-Large-Instruct-2411', 'google/gemma-2-27b-it',
      'google/gemma-2-9b-it', '01-ai/Yi-34B-Chat',
      'meta-llama/Llama-3.2-3B-Instruct-Turbo', 'meta-llama/Llama-3.2-11B-Vision-Instruct-Turbo',
      'meta-llama/Llama-3.2-90B-Vision-Instruct-Turbo'
    ]
  },
  {
    name: 'OpenRouter',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    models: [
      'openai/gpt-4o', 'openai/gpt-4o-mini', 'openai/gpt-4-turbo',
      'openai/gpt-4', 'openai/gpt-3.5-turbo', 'openai/o1-preview',
      'openai/o1-mini', 'openai/o3-mini', 'openai/o1',
      'anthropic/claude-3.5-sonnet', 'anthropic/claude-3.5-haiku',
      'anthropic/claude-3-opus', 'anthropic/claude-3-sonnet',
      'anthropic/claude-3-haiku',
      'google/gemini-2.0-flash-001', 'google/gemini-2.0-flash-lite-001',
      'google/gemini-flash-1.5', 'google/gemini-pro-1.5',
      'meta-llama/llama-3.3-70b-instruct', 'meta-llama/llama-3.1-405b-instruct',
      'meta-llama/llama-3.1-70b-instruct', 'meta-llama/llama-3.1-8b-instruct',
      'deepseek/deepseek-chat', 'deepseek/deepseek-r1',
      'qwen/qwen-2.5-72b-instruct', 'qwen/qwen-2.5-7b-instruct',
      'qwen/qwq-32b-preview', 'qwen/qwen-2.5-coder-32b-instruct',
      'mistralai/mistral-large-2411', 'mistralai/mistral-nemo',
      'mistralai/mixtral-8x7b-instruct', '01-ai/yi-large',
      'x-ai/grok-2', 'x-ai/grok-2-vision', 'x-ai/grok-beta',
      'cohere/command-r-plus', 'cohere/command-r',
      'microsoft/phi-3.5-mini-128k-instruct', 'microsoft/phi-3-medium-128k-instruct',
      'amazon/nova-pro-v1', 'amazon/nova-lite-v1', 'amazon/nova-micro-v1',
      'perplexity/llama-3.1-sonar-large-128k-online',
      'perplexity/llama-3.1-sonar-small-128k-online',
      'perplexity/sonar-reasoning', 'perplexity/sonar',
      'nvidia/llama-3.1-nemotron-70b-instruct',
      'thudm/glm-4-9b-chat'
    ]
  },
  {
    name: 'xAI (Grok)',
    url: 'https://api.x.ai/v1/chat/completions',
    models: [
      'grok-3', 'grok-3-mini', 'grok-3-fast',
      'grok-2-vision-1212', 'grok-2-1212', 'grok-2-vision-latest',
      'grok-2-latest', 'grok-beta', 'grok-vision-beta'
    ]
  },
  {
    name: 'Mistral AI',
    url: 'https://api.mistral.ai/v1/chat/completions',
    models: [
      'mistral-large-latest', 'mistral-large-2411', 'mistral-large-2407',
      'mistral-small-latest', 'mistral-small-2411', 'mistral-small-2409',
      'mistral-nemo', 'mistral-nemo-2407', 'mistral-tiny',
      'open-mistral-7b', 'open-mixtral-8x7b', 'open-mixtral-8x22b',
      'pixtral-large-2411', 'pixtral-12b-2409',
      'codestral-latest', 'codestral-2501', 'ministral-8b-latest',
      'ministral-3b-latest'
    ]
  },
  // GroCloud / SiliconFlow 海外 已移除：与硅基流动 SiliconFlow 相同 URL，重复条目。
];