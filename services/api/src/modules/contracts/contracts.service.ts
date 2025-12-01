import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ContractEntity } from '../../entities/contract.entity'

@Injectable()
export class ContractsService {
  constructor(
    @InjectRepository(ContractEntity)
    private readonly repo: Repository<ContractEntity>
  ) { }

  async listForUser(userId: string): Promise<ContractEntity[]> {
    return this.repo.find({ where: { helperId: userId }, order: { createdAt: 'DESC' } })
  }
}

