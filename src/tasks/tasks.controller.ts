import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { TasksService } from './tasks.service';
import type { ITask } from './task.model';
import { CreateTaskDto } from './create-task.dto';

@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}
  @Get()
  findAll(): ITask[] {
    return this.tasksService.findAll();
  }
  @Get(':id')
  findOne(@Param('id') id: string): ITask | undefined {
    return this.tasksService.findOne(id);
  }
  @Post()
  create(@Body() createTaskDto: CreateTaskDto): ITask {
    return this.tasksService.create(createTaskDto);
  }
}
