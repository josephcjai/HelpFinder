import { Injectable } from '@nestjs/common'
import { ContractEntity } from '../../entities/contract.entity'
import { dataStore } from '../../store/data.store'

@Injectable()
export class ContractsService {
  listForUser(userId: string): ContractEntity[] {
    return dataStore.contracts.filter(c => c.helperId === userId)
  }
}

