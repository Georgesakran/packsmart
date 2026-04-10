const queryAsync = require("../utils/queryAsync");

const getDefaultSizeProfile = async (itemId) => {
  const rows = await queryAsync(
    `
    SELECT *
    FROM item_size_profiles
    WHERE item_id = ?
    ORDER BY is_default DESC, size_code ASC
    LIMIT 1
    `,
    [itemId]
  );

  return rows[0] || null;
};

const getSelectedSizeProfile = async (itemId, sizeCode) => {
  if (!itemId || !sizeCode) return null;

  const rows = await queryAsync(
    `
    SELECT *
    FROM item_size_profiles
    WHERE item_id = ? AND size_code = ?
    LIMIT 1
    `,
    [itemId, sizeCode]
  );

  return rows[0] || null;
};

const getSelectedFoldProfile = async (itemId, category, foldType) => {
  if (!foldType) return null;

  const rows = await queryAsync(
    `
    SELECT *
    FROM fold_profiles
    WHERE
      (item_id = ? AND fold_type = ?)
      OR
      (item_id IS NULL AND category = ? AND fold_type = ?)
    ORDER BY CASE WHEN item_id = ? THEN 0 ELSE 1 END
    LIMIT 1
    `,
    [itemId, foldType, category, foldType, itemId]
  );

  return rows[0] || null;
};

const getDefaultFoldProfile = async (itemId, category) => {
  const rows = await queryAsync(
    `
    SELECT *
    FROM fold_profiles
    WHERE
      (item_id = ?)
      OR
      (item_id IS NULL AND category = ?)
    ORDER BY
      CASE WHEN item_id = ? THEN 0 ELSE 1 END,
      is_default DESC
    LIMIT 1
    `,
    [itemId, category, itemId]
  );

  return rows[0] || null;
};

const resolveTripItemPackingProfile = async (tripItem) => {
  const itemId = tripItem.item_id || null;
  const category = tripItem.category || null;

  let effectiveVolume = Number(tripItem.base_volume_cm3 || 0);
  let effectiveWeight = Number(tripItem.base_weight_g || 0);
  let resolvedSizeCode = tripItem.size_code || null;
  let resolvedFoldType = tripItem.fold_type || null;

  let sizeProfile = null;
  if (itemId) {
    sizeProfile =
      (resolvedSizeCode && (await getSelectedSizeProfile(itemId, resolvedSizeCode))) ||
      (await getDefaultSizeProfile(itemId));
  }

  if (sizeProfile) {
    effectiveVolume = Number(sizeProfile.base_volume_cm3 || effectiveVolume);
    effectiveWeight = Number(sizeProfile.base_weight_g || effectiveWeight);
    resolvedSizeCode = resolvedSizeCode || sizeProfile.size_code;
  }

  let foldProfile = null;
  foldProfile =
    (resolvedFoldType && (await getSelectedFoldProfile(itemId, category, resolvedFoldType))) ||
    (await getDefaultFoldProfile(itemId, category));

  if (foldProfile) {
    if (foldProfile.folded_volume_cm3 != null) {
      effectiveVolume = Number(foldProfile.folded_volume_cm3);
    } else if (foldProfile.volume_multiplier != null) {
      effectiveVolume = effectiveVolume * Number(foldProfile.volume_multiplier);
    }

    resolvedFoldType = resolvedFoldType || foldProfile.fold_type;
  }

  return {
    ...tripItem,
    resolved_size_code: resolvedSizeCode,
    resolved_fold_type: resolvedFoldType,
    effective_volume_cm3: Math.round(effectiveVolume),
    effective_weight_g: Math.round(effectiveWeight),
  };
};

module.exports = {
  resolveTripItemPackingProfile,
};