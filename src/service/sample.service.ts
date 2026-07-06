import { Injectable } from '@nestjs/common';
import { SampleRepository } from '../data-access/sample.repository';

@Injectable()
export class SampleService {
  constructor(private readonly sampleRepository: SampleRepository) {}

  async createSample() {
    return this.sampleRepository.createSample();
  }

  async getSamples() {
    return this.sampleRepository.getSamples();
  }
}
