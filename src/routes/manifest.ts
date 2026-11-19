import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { DEFAULT_AUDIO_QUALITY } from '../config.js';

export async function manifestRoutes(
  fastify: FastifyInstance,
  _options: FastifyPluginOptions
): Promise<void> {
  fastify.get('/manifest.json', async (_request, reply) => {
    reply.header('Content-Type', 'application/json; charset=utf-8');
    reply.header('Cache-Control', 'public, max-age=86400');
    return {
      id: 'com.limx.addon.monochrome',
      name: 'LimX Monochrome',
      version: '1.1.0',
      description:
        'LimX-branded lossless FLAC and Hi-Res music provider powered by the Monochrome API network.',
      author: 'LimX',
      icon: 'https://monochrome.st/favicon.ico',
      resources: ['search', 'stream', 'settings'],
      types: ['track'],
      contentType: 'music',
      settings: [
        {
          key: 'audio_quality',
          title: 'Preferred Audio Quality',
          type: 'select',
          default: DEFAULT_AUDIO_QUALITY,
          options: [
            {
              label: 'Hi-Res Lossless (24-bit / 192kHz)',
              value: 'HI_RES_LOSSLESS'
            },
            {
              label: 'Lossless FLAC (16-bit / 44.1kHz)',
              value: 'LOSSLESS'
            },
            {
              label: 'High (320kbps AAC)',
              value: 'HIGH'
            }
          ]
        }
      ]
    };
  });
}
