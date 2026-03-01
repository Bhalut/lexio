import { Document } from './document.model';

export class DocumentDelivery {
  constructor(
    public readonly id: string,
    public readonly caseId: string,
    public readonly title: string,
    public readonly description: string,
    public readonly category: string,
    public readonly relatedPhase: string,
    public readonly createdByUserId: string | null,
    public readonly createdByName: string | null,
    public readonly createdAt: Date,
    public readonly documents: Document[],
  ) {}
}
