import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ContractEntity } from '../../entities/contract.entity'
import { ContractsController } from './contracts.controller'
import { ContractsService } from './contracts.service'

@Module({
  imports: [TypeOrmModule.forFeature([ContractEntity])],
  controllers: [ContractsController],
  providers: [ContractsService]
})
export class ContractsModule { }

