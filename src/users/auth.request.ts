import { Role } from './role.enum';

export interface AuthRequest {
  user: {
    sub: string;
    name: string;
    roles: Role[];
  };
}
