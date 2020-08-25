import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class FileResponseDto {
  @Expose()
  public id: string;

  @Expose()
  public name: string;

  @Expose()
  public size: number;

  @Expose()
  public uploadedSize: number;

  @Expose()
  public uploadedAt?: Date;
}
