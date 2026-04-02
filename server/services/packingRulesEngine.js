const ITEM_RULES = {
    underwear: {
      priority: "essential",
      removePriority: "low",
      preferredBagRole: "main",
    },
    socks: {
      priority: "essential",
      removePriority: "low",
      preferredBagRole: "main",
    },
    "toiletry bag": {
      priority: "essential",
      removePriority: "medium",
      preferredBagRole: "personal",
    },
    charger: {
      priority: "essential",
      removePriority: "low",
      preferredBagRole: "personal",
    },
    "t-shirt": {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    shirt: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    jeans: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    pants: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    shorts: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
    hoodie: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
    jacket: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
    sneakers: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
  };
  
  const CATEGORY_DEFAULT_RULES = {
    tech: {
      priority: "essential",
      removePriority: "medium",
      preferredBagRole: "personal",
    },
    accessories: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "personal",
    },
    tops: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    bottoms: {
      priority: "recommended",
      removePriority: "medium",
      preferredBagRole: "main",
    },
    outerwear: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
    shoes: {
      priority: "recommended",
      removePriority: "high",
      preferredBagRole: "main",
    },
  };
  
  const DEFAULT_RULE = {
    priority: "recommended",
    removePriority: "medium",
    preferredBagRole: "carry_on",
  };
  
  const normalizeName = (name = "") => name.trim().toLowerCase();
  const normalizeCategory = (category = "") => category.trim().toLowerCase();
  
  const getItemRule = ({ name, category }) => {
    const itemRule = ITEM_RULES[normalizeName(name)];
    if (itemRule) return itemRule;
  
    const categoryRule = CATEGORY_DEFAULT_RULES[normalizeCategory(category)];
    if (categoryRule) return categoryRule;
  
    return DEFAULT_RULE;
  };
  
  const getPriorityScore = (priority) => {
    if (priority === "essential") return 3;
    if (priority === "recommended") return 2;
    if (priority === "optional") return 1;
    return 2;
  };
  
  const getRemovePriorityScore = (removePriority) => {
    if (removePriority === "high") return 3;
    if (removePriority === "medium") return 2;
    if (removePriority === "low") return 1;
    return 2;
  };
  
  const enrichItemWithRules = (item) => {
    const rule = getItemRule({
      name: item.name,
      category: item.category,
    });
  
    return {
      ...item,
      priority: rule.priority,
      removePriority: rule.removePriority,
      preferredBagRole: rule.preferredBagRole,
      priorityScore: getPriorityScore(rule.priority),
      removePriorityScore: getRemovePriorityScore(rule.removePriority),
    };
  };
  
  module.exports = {
    getItemRule,
    enrichItemWithRules,
    getPriorityScore,
    getRemovePriorityScore,
  };