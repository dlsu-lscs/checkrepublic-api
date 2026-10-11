import type { FastifyReply, FastifyRequest } from 'fastify';
import { HealthService } from './health.service';

export class HealthController {
  constructor(private readonly healthService = new HealthService()) {}

  public getHealth = async (_request: FastifyRequest, reply: FastifyReply) => {
    const data = this.healthService.getHealth();
    return reply.status(200).send(data);
  };
}
