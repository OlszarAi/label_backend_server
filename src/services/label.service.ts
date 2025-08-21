import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

const prisma = new PrismaClient();

export interface Label {
  id: string;
  name: string;
  description?: string | null;
  projectId: string;
  fabricData?: any;
  thumbnail?: string | null;
  width: number;
  height: number;
  version: number;
  batchId?: string | null;
  templateId?: string | null;
  uniqueId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Simple service for label database operations
 */
export class LabelService {
  /**
   * Get label by ID
   */
  static async getLabelById(id: string): Promise<Label | null> {
    try {
      const label = await prisma.label.findUnique({
        where: { id }
      });
      return label;
    } catch (error) {
      Logger.error(`Failed to get label ${id}:`, error);
      return null;
    }
  }

  /**
   * Update label fabricData
   */
  static async updateLabelData(id: string, fabricData: any): Promise<boolean> {
    try {
      await prisma.label.update({
        where: { id },
        data: { 
          fabricData,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      Logger.error(`Failed to update label ${id}:`, error);
      return false;
    }
  }

  /**
   * Update label thumbnail path
   */
  static async updateThumbnail(id: string, thumbnailPath: string): Promise<boolean> {
    try {
      await prisma.label.update({
        where: { id },
        data: { 
          thumbnail: thumbnailPath,
          updatedAt: new Date()
        }
      });
      return true;
    } catch (error) {
      Logger.error(`Failed to update thumbnail for label ${id}:`, error);
      return false;
    }
  }
}
