import { Controller, Get, Post } from '@nestjs/common';
import { SampleService } from '../service/sample.service';

@Controller('sample')
export class SampleController {
  constructor(private readonly sampleService: SampleService) {}

  @Post()
  async createSample() {
    return this.sampleService.createSample();
  }

  @Get()
  async getSamples() {
    return this.sampleService.getSamples();
  }
}
