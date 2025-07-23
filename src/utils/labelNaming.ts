/**
 * Utility functions for label naming and numbering on the backend
 */

export interface LabelForNaming {
  id: string;
  name: string;
}

/**
 * Generates a unique label name with proper numbering
 * @param existingLabels - Array of existing labels in the project
 * @param baseName - Base name for the label (default: "New Label")
 * @returns A unique name with proper numbering
 */
export const generateUniqueLabel = (
  existingLabels: LabelForNaming[] = [],
  baseName: string = 'New Label'
): string => {
  if (existingLabels.length === 0) {
    return `${baseName} 1`;
  }

  // Find all existing labels that match the pattern "baseName X" where X is a number
  const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`);
  const existingNumbers = existingLabels
    .map(label => {
      const match = label.name.match(pattern);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0)
    .sort((a, b) => a - b);

  // Find the next available number
  let nextNumber = 1;
  for (const num of existingNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return `${baseName} ${nextNumber}`;
};

/**
 * Generates a copy name for duplicated labels
 * @param originalName - Original label name
 * @param existingLabels - Array of existing labels
 * @returns A unique copy name
 */
export const generateCopyName = (
  originalName: string,
  existingLabels: LabelForNaming[] = []
): string => {
  const baseName = `${originalName} (Copy)`;
  
  // Check if the base copy name is already unique
  const exists = existingLabels.some(label => label.name === baseName);
  if (!exists) {
    return baseName;
  }

  // Find the next available copy number
  const pattern = new RegExp(`^${baseName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s+(\\d+)$`);
  const existingNumbers = existingLabels
    .map(label => {
      const match = label.name.match(pattern);
      return match && match[1] ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0)
    .sort((a, b) => a - b);

  let nextNumber = 2;
  for (const num of existingNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }

  return `${baseName} ${nextNumber}`;
};

/**
 * Validates a label name and suggests corrections if needed
 * @param name - Label name to validate
 * @returns Object with validation result and suggestions
 */
export const validateLabelName = (name: string) => {
  const trimmedName = name.trim();
  
  if (!trimmedName) {
    return {
      isValid: false,
      error: 'Label name cannot be empty',
      suggestion: 'New Label 1'
    };
  }

  if (trimmedName.length > 100) {
    return {
      isValid: false,
      error: 'Label name cannot exceed 100 characters',
      suggestion: trimmedName.substring(0, 97) + '...'
    };
  }

  return {
    isValid: true,
    error: null,
    suggestion: null
  };
};
