import { Controller } from '@nestjs/common';

@Controller('tasks')
export class TasksController {
    findAll(): string[]{
        return ['A', 'B'];
    }
}
