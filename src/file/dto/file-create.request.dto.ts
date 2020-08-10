import { IsInt, IsString } from 'class-validator';

export class FileCreateRequestDto {
  @IsString()
  readonly name: string;

  @IsInt()
  readonly size: number;
}
