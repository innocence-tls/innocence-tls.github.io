// Превью-картинки для ссылок: /og/<slug>.jpg
import type { APIRoute } from 'astro';
import { getReleases, type Release } from '../../lib/releases';
import { renderOg } from '../../lib/og';

export async function getStaticPaths() {
  return (await getReleases()).filter((r) => r.status === 'released' && (r.posterFile || r.imageFile)).map((r) => ({ params: { slug: r.slug }, props: { r } }));
}

export const GET: APIRoute = async ({ props }) =>
  new Response(new Uint8Array(await renderOg((props as { r: Release }).r)), { headers: { 'Content-Type': 'image/jpeg' } });
