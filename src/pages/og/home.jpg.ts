// Превью ссылки на главную: /og/home.jpg
import type { APIRoute } from 'astro';
import { getReleases } from '../../lib/releases';
import { renderHomeOg } from '../../lib/og';

export const GET: APIRoute = async () =>
  new Response(new Uint8Array(await renderHomeOg(await getReleases())), { headers: { 'Content-Type': 'image/jpeg' } });
