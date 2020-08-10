import { IsString, IsInt } from 'class-validator';

export class FileCreateRequestDto {
  @IsString()
  readonly name: string;

  @IsInt()
  readonly size: number;
}
