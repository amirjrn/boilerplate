import { Injectable } from '@nestjs/common';
import { PrismaService } from '../init/prisma.service';

@Injectable()
export class SampleRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createSample() {
    return this.prisma.sample.create({ data: {} });
  }

  async getSamples() {
    return this.prisma.sample.findMany();
  }
}
