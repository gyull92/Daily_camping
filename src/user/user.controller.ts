import { Body, Controller, Delete, Get, Param, Put } from '@nestjs/common';
import { UpdateUserDto } from 'src/auth/dto/update-user.dto';
import { User } from 'src/entity/user.entity';
import { UserService } from './user.service';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get()
  findAll(): Promise<User[]> {
    return this.userService.findAll();
  }

  @Get('/:id')
  findOne(@Param() id: number): Promise<User> {
    return this.userService.findOne(id);
  }

  @Delete('/logoff/:id')
  async remove(@Param() id: number): Promise<void> {
    await this.userService.remove(id);
  }
}
