import { Controller, Get, Param } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { ContractEntity } from '../../entities/contract.entity'
import { ContractsService } from './contracts.service'

@ApiTags('contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contracts: ContractsService) {}

  @Get('user/:userId')
  getForUser(@Param('userId') userId: string): ContractEntity[] {
    return this.contracts.listForUser(userId)
  }
}

