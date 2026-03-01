export class Document {
  constructor(
    public readonly id: string,
    public readonly deliveryId: string,
    public readonly originalName: string,
    public readonly mimeType: string,
    public readonly sizeBytes: number,
    public readonly storageKey: string,
    public readonly checksum: string | null,
    public readonly uploadedAt: Date,
  ) {}
}
