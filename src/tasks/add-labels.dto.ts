import { IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateTaskLabelDto } from './create-task-label.dto';

export class AddLabelsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateTaskLabelDto)
  labels: CreateTaskLabelDto[];
}
