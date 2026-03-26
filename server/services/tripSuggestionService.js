const buildSuggestionRules = ({ durationDays, travelType, weatherType, travelerCount }) => {
    const days = Number(durationDays) || 1;
    const travelers = Number(travelerCount) || 1;
  
    const base = [];
  
    const addItem = (name, quantity) => {
      const finalQty = Math.max(1, Math.round(quantity * travelers));
      const existing = base.find((item) => item.name === name);
  
      if (existing) {
        existing.quantity += finalQty;
      } else {
        base.push({ name, quantity: finalQty });
      }
    };
  
    // base essentials
    addItem("Underwear", days);
    addItem("Socks", days);
    addItem("Toiletry Bag", 1);
    addItem("Charger", 1);
  
    // travel type rules
    switch (travelType) {
      case "beach":
        addItem("T-shirt", days);
        addItem("Shorts", Math.ceil(days * 0.6));
        addItem("Jeans", 1);
        addItem("Sneakers", 1);
        break;
  
      case "business":
        addItem("Shirt", days);
        addItem("Pants", Math.max(1, Math.ceil(days / 2)));
        addItem("Sneakers", 1);
        break;
  
      case "winter":
        addItem("T-shirt", Math.max(2, days - 1));
        addItem("Jeans", Math.max(1, Math.ceil(days / 2)));
        addItem("Hoodie", Math.max(1, Math.ceil(days / 3)));
        addItem("Jacket", 1);
        addItem("Sneakers", 1);
        break;
  
      case "weekend":
        addItem("T-shirt", Math.max(2, days));
        addItem("Jeans", 1);
        addItem("Shorts", 1);
        addItem("Sneakers", 1);
        break;
  
      case "adventure":
        addItem("T-shirt", days);
        addItem("Pants", Math.max(1, Math.ceil(days / 2)));
        addItem("Hoodie", 1);
        addItem("Sneakers", 1);
        break;
  
      case "family":
        addItem("T-shirt", days);
        addItem("Jeans", Math.max(1, Math.ceil(days / 2)));
        addItem("Shorts", Math.max(1, Math.ceil(days / 3)));
        addItem("Sneakers", 1);
        break;
  
      case "casual":
      default:
        addItem("T-shirt", days);
        addItem("Jeans", Math.max(1, Math.ceil(days / 3)));
        addItem("Shorts", Math.max(1, Math.ceil(days / 3)));
        addItem("Sneakers", 1);
        break;
    }
  
    // weather rules
    switch (weatherType) {
      case "cold":
        addItem("Hoodie", Math.max(1, Math.ceil(days / 3)));
        addItem("Jacket", 1);
        break;
  
      case "mild":
        addItem("Hoodie", 1);
        break;
  
      case "mixed":
        addItem("Hoodie", 1);
        if (days >= 4) addItem("Jacket", 1);
        break;
  
      case "hot":
      default:
        break;
    }
  
    return base;
  };
  
  module.exports = { buildSuggestionRules };