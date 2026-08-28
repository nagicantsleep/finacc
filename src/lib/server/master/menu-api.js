import { createRequire } from 'module';
import axios from 'axios';
import { JSDOM } from 'jsdom';
import models from '$lib/server/db/index.js';

const Op = models.Sequelize.Op;
const require = createRequire(import.meta.url);
const menuTemplatesDef = require('../../../../config/menu-template.cjs');

export async function getMenuTemplates(tenantId) {
  let templates = await models.Menu.findAll({
    where: {
      tenantId,
      userId: null,
      displayOrder: { [Op.gt]: 0 }
    },
    order: [['displayOrder', 'ASC']]
  });
  if (templates.length === 0) {
    const records = menuTemplatesDef.map((template, i) => ({
      tenantId,
      userId: null,
      title: template.title,
      displayOrder: i + 1,
      body: JSON.stringify(template.menu)
    }));
    templates = await models.Menu.bulkCreate(records);
  }
  return { templates };
}

function isYouTube(url) {
  return /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/.test(url);
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  return match ? match[1] : null;
}

function getFaviconUrl(doc, baseUrl) {
  const links = Array.from(doc.querySelectorAll('link[rel*="icon"]'));
  for (const link of links) {
    const href = link.getAttribute('href');
    if (href) {
      try {
        return new URL(href, baseUrl).href;
      } catch {
        /* ignore */
      }
    }
  }
  return new URL('/favicon.ico', baseUrl).href;
}

export async function previewMenuUrl(targetUrl) {
  if (!targetUrl) {
    return { ok: false, status: 400, payload: { error: 'Missing url parameter' } };
  }
  try {
    const preview = {
      title: '',
      description: '',
      image: '',
      url: targetUrl,
      favicon: ''
    };
    const response = await axios.get(targetUrl, { timeout: 8000 });
    const html = response.data;
    const dom = new JSDOM(html);
    const doc = dom.window.document;
    const getMeta = (name) =>
      doc.querySelector(`meta[property="${name}"]`)?.content ||
      doc.querySelector(`meta[name="${name}"]`)?.content ||
      null;

    if (isYouTube(targetUrl)) {
      const videoId = extractYouTubeId(targetUrl);
      if (videoId) {
        preview.title = getMeta('og:title') || doc.querySelector('title')?.textContent || 'YouTube Video';
        preview.description = `<iframe width="440" height="330" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allow="accelerometer;" allowfullscreen></iframe>`;
        preview.favicon = 'https://www.youtube.com/favicon.ico';
        return { ok: true, payload: preview };
      }
    }
    preview.title = getMeta('og:title') || doc.querySelector('title')?.textContent || '(no title)';
    preview.description = getMeta('og:description') || getMeta('description');
    preview.image = getMeta('og:image');
    preview.url = getMeta('og:url') || targetUrl;
    preview.favicon = getFaviconUrl(doc, targetUrl);
    return { ok: true, payload: preview };
  } catch (error) {
    console.error('URL preview fetch error:', error.message);
    return { ok: false, status: 500, payload: { error: 'Failed to fetch or parse target URL' } };
  }
}
