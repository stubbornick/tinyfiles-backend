export class FileUploadResponseDto {
  public id: string;

  public name: string;

  public size: number;

  public uploadedSize?: number;

  public uploadedAt: Date;
}
