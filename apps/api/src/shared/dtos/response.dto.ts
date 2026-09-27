import { MessageResSchema } from '@shared/types';
import { createZodDto } from 'nestjs-zod';

export class MessageResDTO extends createZodDto(MessageResSchema) {}
