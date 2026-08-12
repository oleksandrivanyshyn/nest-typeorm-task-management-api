import { IsArray, IsNotEmpty, IsString } from 'class-validator';

export class RemoveLabelsDto {
  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  labelNames: string[];
}
