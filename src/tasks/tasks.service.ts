import { Injectable, NotFoundException } from '@nestjs/common';
import { ITask } from './task.model';

@Injectable()
export class TasksService {
  private tasks: ITask[] = [];
  findAll(): ITask[] {
    return this.tasks;
  }
  findOne(id: string): ITask | undefined {
    const task = this.tasks.find((task) => task.id === id);
    if (!task) {
      throw new NotFoundException(`Task with id ${id} not found`);
    }
    return task;
  }
}
