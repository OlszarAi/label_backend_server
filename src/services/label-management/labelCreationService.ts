/**
 * Dedykowany serwis do tworzenia etykiet
 * Centralizuje logikę tworzenia     return {
      id: labe      }
    });

    return this.mapToResponse(label);: label.name,
      description: label.description || undefined,
      width: label.width,
      height: label.height,
      projectId: label.projectId,
      version: label.version,
      fabricData: label.fabricData as unknown,
      thumbnail: label.thumbnail || undefined,
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString()
    };dnoliconym nazewnictwem
 */

import { PrismaClient } from '@prisma/client';
import { generateUniqueLabel, generateCopyName, type LabelForNaming } from '../../utils/labelNaming';

const prisma = new PrismaClient();

export interface CreateLabelRequest {
  name?: string;
  description?: string;
  width?: number;
  height?: number;
  fabricData?: unknown;
  thumbnail?: string;
  templateData?: unknown;
}

export interface CreateLabelResponse {
  id: string;
  name: string;
  description?: string;
  width: number;
  height: number;
  projectId: string;
  version: number;
  fabricData?: unknown;
  thumbnail?: string;
  createdAt: string;
  updatedAt: string;
}

export class LabelCreationService {
  /**
   * Mapuje obiekt Label z Prismy na CreateLabelResponse
   */
  private static mapToResponse(label: any): CreateLabelResponse {
    const response: CreateLabelResponse = {
      id: label.id,
      name: label.name,
      width: label.width,
      height: label.height,
      projectId: label.projectId,
      version: label.version,
      fabricData: label.fabricData as unknown,
      createdAt: label.createdAt.toISOString(),
      updatedAt: label.updatedAt.toISOString()
    };

    if (label.description) {
      response.description = label.description;
    }

    if (label.thumbnail) {
      response.thumbnail = label.thumbnail;
    }

    return response;
  }
  /**
   * Tworzy nową etykietę z automatycznym nazewnictwem
   */
  static async createLabel(
    projectId: string,
    userId: string,
    data: CreateLabelRequest = {}
  ): Promise<CreateLabelResponse> {
    // Sprawdź czy użytkownik jest właścicielem projektu
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    // Pobierz wszystkie etykiety w projekcie dla inteligentnego nazewnictwa
    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    });

    // Wygeneruj unikalną nazwę jeśli nie podano
    const labelName = data.name || generateUniqueLabel(existingLabels as LabelForNaming[]);

    // Utwórz etykietę z domyślnymi wartościami
    const label = await prisma.label.create({
      data: {
        name: labelName,
        description: data.description || '',
        width: data.width || 100,
        height: data.height || 50,
        projectId,
        thumbnail: data.thumbnail || null,
        fabricData: data.fabricData || {
          version: '6.0.0',
          objects: [],
          background: '#ffffff'
        }
      }
    });

    return this.mapToResponse(label);
  }

  /**
   * Duplikuje istniejącą etykietę z automatycznym nazewnictwem
   */
  static async duplicateLabel(
    labelId: string,
    userId: string
  ): Promise<CreateLabelResponse> {
    // Znajdź oryginalną etykietę
    const originalLabel = await prisma.label.findFirst({
      where: { 
        id: labelId,
        project: { userId }
      }
    });

    if (!originalLabel) {
      throw new Error('Label not found or access denied');
    }

    // Pobierz wszystkie etykiety w projekcie dla nazewnictwa
    const projectLabels = await prisma.label.findMany({
      where: { projectId: originalLabel.projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    });

    // Wygeneruj unikalną nazwę kopii
    const copyName = generateCopyName(originalLabel.name, projectLabels as LabelForNaming[]);

    // Utwórz duplikat
    const duplicatedLabel = await prisma.label.create({
      data: {
        name: copyName,
        description: originalLabel.description,
        width: originalLabel.width,
        height: originalLabel.height,
        projectId: originalLabel.projectId,
        fabricData: originalLabel.fabricData as any,
        thumbnail: originalLabel.thumbnail
      }
    });

    return this.mapToResponse(duplicatedLabel);
  }

  /**
   * Tworzy etykietę z szablonu
   */
  static async createFromTemplate(
    projectId: string,
    userId: string,
    templateData: {
      name?: string;
      width: number;
      height: number;
      fabricData?: unknown;
      baseName?: string;
    }
  ): Promise<CreateLabelResponse> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    });

    // Użyj nazwy z szablonu jako bazy lub wygeneruj nową
    const baseName = templateData.baseName || templateData.name || 'New Label';
    const uniqueName = generateUniqueLabel(existingLabels as LabelForNaming[], baseName);

    const label = await prisma.label.create({
      data: {
        name: uniqueName,
        description: `Created from template: ${baseName}`,
        width: templateData.width,
        height: templateData.height,
        projectId,
        fabricData: templateData.fabricData || {
          version: '6.0.0',
          objects: [],
          background: '#ffffff'
        }
      }
    });

    return this.mapToResponse(label);
  }

  /**
   * Tworzy wiele etykiet naraz (bulk creation)
   */
  static async createBulkLabels(
    projectId: string,
    userId: string,
    count: number,
    baseData: CreateLabelRequest = {}
  ): Promise<CreateLabelResponse[]> {
    const project = await prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!project) {
      throw new Error('Project not found or access denied');
    }

    const existingLabels = await prisma.label.findMany({
      where: { projectId },
      select: { id: true, name: true },
      orderBy: { createdAt: 'asc' }
    });

    const labelsToCreate = [];
    let currentLabels = [...existingLabels] as LabelForNaming[];

    for (let i = 0; i < count; i++) {
      const uniqueName = generateUniqueLabel(currentLabels, baseData.name);
      
      labelsToCreate.push({
        name: uniqueName,
        description: baseData.description || '',
        width: baseData.width || 100,
        height: baseData.height || 50,
        projectId,
        fabricData: baseData.fabricData || {
          version: '6.0.0',
          objects: [],
          background: '#ffffff'
        }
      });

      // Dodaj do lokalnej listy aby kolejne etykiety miały właściwe numery
      currentLabels.push({ id: `temp-${i}`, name: uniqueName });
    }

    // Utwórz wszystkie etykiety w jednej transakcji
    const createdLabels = await prisma.$transaction(
      labelsToCreate.map(labelData => 
        prisma.label.create({ data: labelData })
      )
    );

    return createdLabels.map(label => this.mapToResponse(label));
  }
}
