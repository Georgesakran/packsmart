const getTripItemDisplayName = (item) => {
    return (
      item?.custom_name ||
      item?.base_item_name ||
      item?.name ||
      `Item #${item?.item_id || item?.id || "Unknown"}`
    );
  };
  
  module.exports = {
    getTripItemDisplayName,
  };