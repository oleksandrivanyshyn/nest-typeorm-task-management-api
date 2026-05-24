import { Controller, Get, Param } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { ITask } from './task.model';

@Controller('tasks')
export class TasksController {
  constructor(private readonly taskService: TasksService) {}
  @Get()
  findAll(): ITask[] {
    return this.taskService.findAll();
  }
  @Get('/:id')
  findOne(@Param() id: string): ITask | undefined {
    return this.taskService.findOne(id);
  }
}
